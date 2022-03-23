import * as vscode from 'vscode';
import { Project } from './project';
import { BoardManager } from './boards/boardManager';
import { Board } from './boards/board';
import * as path from 'path';
import { LibraryManager } from './librarymanager/libraryManager';
import { SerialMonitor } from './serialmonitor/serialMonitor';
import { DeviceManager } from './devicemanager/deviceManager';

export class Container implements vscode.Disposable {
  private static _instance: Container = null;

  public static async newInstance(context: vscode.ExtensionContext) {
    if(Container._instance === null) {
      Container._instance = new Container(context);
    }
    await Container._instance.initialize();
    return Container._instance;
  }
  // TODO: Error on null
  public static getInstance() {
    return this._instance;
  }

  private _project: Project = null;
  private _context: vscode.ExtensionContext;
  private _boardManager: BoardManager;
  private _libraryManager: LibraryManager;
  private _serialMonitor: SerialMonitor;
  private _deviceManager: DeviceManager;


  public constructor(context: vscode.ExtensionContext){
    this._context = context;
    let metadataFile: string = path.join(
      this._context.extensionPath,
      "boards",
      "metadata.json"
    );
    Board.loadBoards(metadataFile);

    this._project = new Project(context);
    this._boardManager = new BoardManager(this._project.getBoard());
    this._libraryManager = new LibraryManager(context.globalStoragePath);
    this._serialMonitor = new SerialMonitor();

    /*
    The DeviceManager is a work in progress, and is therefore disabled by default
    */
    //this._deviceManager = new DeviceManager();
  }

  private async initialize() {
    await this._libraryManager.initialize();
    this.registerCommand('library.show', () => this._libraryManager.show());
    this.registerCommand('library.list', () => this._libraryManager.list());
    this.registerCommand('library.update', () => this._libraryManager.update());
    this.registerCommand('library.reload', () => this._libraryManager.reloadProjectLibraries());

    vscode.workspace.onDidDeleteFiles((e: vscode.FileDeleteEvent) => this._libraryManager.reloadProjectLibraries());
    this.registerCommand('library.fetch', () => this._libraryManager.updateBundle());
    this.registerCommand('selectBoard', () => this._boardManager.selectBoard());

    try {
      require("@serialport/bindings-cpp");
      this.registerCommand('openSerialMonitor', () => this._serialMonitor.openSerialMonitor());
      this.registerCommand('selectSerialPort', () => this._serialMonitor.selectSerialPort(null, null));
      this.registerCommand('closeSerialMonitor', () => this._serialMonitor.closeSerialMonitor());
    } catch (error) {
      console.log(error);
    }
  }

  private registerCommand(name: string, f: (...any) => any) {
    this._context.subscriptions.push(
      vscode.commands.registerCommand(`circuitpython.${name}`, f)
    );
  }
  public dispose() {}

  // Commands
  public static updatePaths() {
    Container._instance._project.refreshAutoCompletePaths();
  }
  public static updateBundlePath() {
    Container._instance._project.updateBundlePath(Container.getBundlePath());
    Container.updatePaths();
  }

  public static setBoard(board: Board) {
    Container._instance._project.setBoard(board);
    Container._instance._boardManager.updateBoardChoiceStatus(board);
  }

  public static reloadProjectLibraries() {
    Container._instance._libraryManager.reloadProjectLibraries();
  }

  public static getProjectLibDir(): string {
    return Container._instance._libraryManager.projectLibDir;
  }

  public static getMpySuffix(): string {
    return Container._instance._libraryManager.mpySuffix;
  }

  public static getBundlePath(): string {
    return Container._instance._libraryManager.bundlePath(Container.getMpySuffix());
  }

  public static async loadBundleMetadata(): Promise<boolean> {
    return await Container._instance._libraryManager.loadBundleMetadata();
  }
}