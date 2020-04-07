import * as vscode from "vscode";
import * as os from "os";
import * as serialport from 'serialport';
import SerialPort = require("serialport");
import { BoardManager } from "../boards/boardManager";
import { Board } from "../boards/board";
import { Container } from "../container";

class SerialPickItem implements vscode.QuickPickItem {
  public label: string;
  public description: string;
  public serialPort: serialport.PortInfo;
  public constructor(sp: serialport.PortInfo) {
    this.label = sp.path;
    if (sp.vendorId && sp.productId) {
      let b: Board = Board.lookup(sp.vendorId, sp.productId);
      if (b) {
        this.description = `${b.manufacturer}:${b.product}`;
      } 
    }
    if(!this.description) {
      let bits: string[] = 
        [
          sp.manufacturer,
          sp.vendorId,
          sp.productId
        ].filter((v: string, i, a) => v);
      if(bits.length > 0) {
        this.description = bits.join(" | ");
      }
    }
    this.serialPort = sp;
  }
}
export class SerialMonitor implements vscode.Disposable {
  public static SERIAL_MONITOR: string = "Circuit Python Serial Monitor";
  public static BAUD_RATE: number = 115200;

  // String representing the current port path e.g. /dev/tty.usbmodemX etc...
  private _currentPort: SerialPickItem;
  // The actual port we're working with
  private _serialPort: SerialPort;
  private _portsStatusBar: vscode.StatusBarItem;

  private _openPortStatusBar: vscode.StatusBarItem;
  private _terminal: vscode.Terminal;
  private _writeEmitter: vscode.EventEmitter<string>;

  public constructor() {
    this._writeEmitter = new vscode.EventEmitter<string>();
    let pty:vscode.Pseudoterminal = {
      onDidWrite: this._writeEmitter.event,
      open: () => this._writeEmitter.fire('Circuit Python Serial Monitor\r\n'),
      close: () => {},
      handleInput: (data: string) => {
        this._serialPort.write(data);
      }
    };
    this._terminal = vscode.window.createTerminal({name: SerialMonitor.SERIAL_MONITOR, pty: pty });
    this._portsStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 20);
    this._portsStatusBar.command = "circuitpython.selectSerialPort";
    this._portsStatusBar.tooltip = "Select Serial Port";
    this._portsStatusBar.show();

    this._openPortStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 30);
    this._openPortStatusBar.command = "circuitpython.openSerialMonitor";
    this._openPortStatusBar.text = `$(plug)`;
    this._openPortStatusBar.tooltip = "Open Serial Monitor";
    this._openPortStatusBar.show();
  }

  public dispose() {}

  // vid/pid needed for usb monitoring, which we're not doing... yet?
  public async selectSerialPort(vid: string, pid: string) {
    const lists = await serialport.list();
    console.log(lists);
    // vid & pid available in SerialPort as vendorId & productId
    if (!lists.length) {
      vscode.window.showInformationMessage("No serial port is available.");
      return;
    }
    const chosen = await vscode.window.showQuickPick(<SerialPickItem[]>lists.map((l: serialport.PortInfo): SerialPickItem => {
      return new SerialPickItem(l);
    }).sort((a, b): number => {
        return a.label === b.label ? 0 : (a.label > b.label ? 1 : -1);
    }), { placeHolder: "Select a serial port" });
    if (chosen && chosen.label) {
      let b: Board = Board.lookup(chosen.serialPort.vendorId, chosen.serialPort.productId);
      await Container.setBoard(b);
      this.updatePortListStatus(chosen);
    }
  }

  public async openSerialMonitor() {
    if (!this._currentPort) {
      await this.selectSerialPort(null, null);
      if (!this._currentPort) {
          return;
      }
    }

    if (this._serialPort) {
      if (this._currentPort.serialPort.path !== this._serialPort.path) {
        await this._serialPort.close();
        this._serialPort = new SerialPort(this._currentPort.serialPort.path, {baudRate: SerialMonitor.BAUD_RATE, autoOpen: false});
      } else if (this._serialPort.isOpen) {
        vscode.window.showWarningMessage(`Serial monitor is already opened for ${this._currentPort.serialPort.path}`);
        return;
      }
    } else {
      this._serialPort = new SerialPort(this._currentPort.serialPort.path, {baudRate: SerialMonitor.BAUD_RATE, autoOpen: false});
    }

    this._terminal.show();
    try {
      this._serialPort.open();
      this.updatePortStatus(true);
    } catch (error) {
      this._writeEmitter.fire("[Error]" + error.toString() + "\r\n\r\n");
      console.log(
                `Failed to open serial port ${this._currentPort} due to error: + ${error.toString()}`);
    }
    this._writeEmitter.fire(`[Open] Connection to ${this._currentPort.serialPort.path}${os.EOL}\r\n`);
    this._serialPort.on("data", (_event) => {
      this._writeEmitter.fire(_event.toString());
    });
    this._serialPort.on("error", (_error) => {
      this._writeEmitter.fire("[Error]" + _error.toString() + "\r\n\r\n");
    });
  }

  // Closes the serial connection
  public async closeSerialMonitor() {
    if (this._serialPort) {
      const result = await this._serialPort.close();
      this._serialPort = null;
      if (this._writeEmitter) {
        this._writeEmitter.fire(`[Done] Closed the serial port ${os.EOL}`);
      }
      this.updatePortStatus(false);
      return result;
    } else {
      return false;
    }
  }

  private updatePortListStatus(port: SerialPickItem) {
    this._currentPort = port;

    if (port) {
        this._portsStatusBar.text = port.serialPort.path;
    } else {
        this._portsStatusBar.text = "<Select Serial Port>";
    }
  }

  private updatePortStatus(isOpened: boolean) {
    if (isOpened) {
      this._openPortStatusBar.command = "circuitpython.closeSerialMonitor";
      this._openPortStatusBar.text = `$(x)`;
      this._openPortStatusBar.tooltip = "Close Serial Monitor";
    } else {
      this._openPortStatusBar.command = "circuitpython.openSerialMonitor";
      this._openPortStatusBar.text = `$(plug)`;
      this._openPortStatusBar.tooltip = "Open Serial Monitor";
    }
  }
}