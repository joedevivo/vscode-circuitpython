import * as vscode from "vscode";
import * as os from "os";
import * as serialport from 'serialport';
import SerialPort = require("serialport");
import { Context } from "../context";

class SerialPickItem implements vscode.QuickPickItem {
  public label: string;
  public description: string;
  public serialPort: serialport.PortInfo;
  public constructor(sp: serialport.PortInfo) {
    this.label = sp.path;
    this.description = sp.path;
    this.serialPort = sp;
  }
}
export class SerialMonitor implements vscode.Disposable {
  public static SERIAL_MONITOR: string = "Circuit Python Serial Monitor";
  public static BAUD_RATE: number = 115200;

  public static getInstance(): SerialMonitor {
    if (SerialMonitor._serialMonitor === null) {
      SerialMonitor._serialMonitor = new SerialMonitor();
    }
    return SerialMonitor._serialMonitor;
  }
  private static _serialMonitor: SerialMonitor = null;

  // String representing the current port path e.g. /dev/tty.usbmodemX etc...
  private _currentPort: SerialPickItem;
  // The actual port we're working with
  private _serialPort: SerialPort;
  private _portsStatusBar: vscode.StatusBarItem;

  private _openPortStatusBar: vscode.StatusBarItem;
  private _outputChannel: vscode.OutputChannel;

  private constructor() {
    this.initialize();
  }

  public initialize() {
    this._outputChannel = vscode.window.createOutputChannel(SerialMonitor.SERIAL_MONITOR);
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

  public get initialized(): boolean {
    return !!this._outputChannel;
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
      await Context.getInstance().autoSelectBoard(chosen.serialPort.vendorId, chosen.serialPort.productId);
      this.updatePortListStatus(chosen);
    }
  }

  public async openSerialMonitor() {
    if (!this._currentPort) {
      const ans = await vscode.window.showInformationMessage("No serial port was selected, please select a serial port first", "Yes", "No");
      if (ans === "Yes") {
          await this.selectSerialPort(null, null);
      }
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

    this._outputChannel.show();
    try {
      this._serialPort.open();
      this.updatePortStatus(true);
    } catch (error) {
      this._outputChannel.appendLine("[Error]" + error.toString());
      console.log(
                `Failed to open serial port ${this._currentPort} due to error: + ${error.toString()}`);
    }
    this._outputChannel.appendLine(`[Open] Connection to ${this._currentPort.serialPort.path}${os.EOL}`);
    this._serialPort.on("data", (_event) => {
      this._outputChannel.append(_event.toString());
    });
    this._serialPort.on("error", (_error) => {
      this._outputChannel.appendLine("[Error]" + _error.toString());
    });
  }

  // Closes the serial connection
  public async closeSerialMonitor() {
    if (this._serialPort) {
      const result = await this._serialPort.close();
      this._serialPort = null;
      if (this._outputChannel) {
        this._outputChannel.appendLine(`[Done] Closed the serial port ${os.EOL}`);
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