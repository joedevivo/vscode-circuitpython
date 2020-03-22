import * as vscode from "vscode";
import { Board } from './board';
import * as path from 'path';
import { LibraryManager } from "../librarymanager/libraryManager";

export class BoardManager implements vscode.Disposable {
  private extensionPath: string = null;
  public libraryPath: string = null;

  public static getInstance(): BoardManager {
    if (BoardManager._boardManager === null) {
      BoardManager._boardManager = new BoardManager();
    }
    return BoardManager._boardManager;
  }

  private _boardChoice: vscode.StatusBarItem;
  private _currentBoard: Board;
  private static _boardManager: BoardManager = null;

  private constructor() {
    this.initialize();
  }

  public initialize() {
    this._boardChoice = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 30);
    this._boardChoice.command = "circuitpython.selectBoard";
    this._boardChoice.tooltip = "Choose Circuit Python Board";
    this._boardChoice.show();
  }

  public setExtensionPath(p: string) {
    this.extensionPath = p;
    let conf: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("circuitpython.board");
    let vid: string = conf.get("vid");
    let pid: string = conf.get("pid");
    if(vid && pid) {
      let b: Board = Board.lookup(vid, pid);
      this.updateBoardChoiceStatus(b);
    }
  }

  public dispose() {}

  public static resetCompletionPath() {
    BoardManager._boardManager.updateBoardChoiceStatus(
      BoardManager._boardManager._currentBoard
    );
  }

  public async selectBoard() {
    const chosen = await vscode.window.showQuickPick(
      Board.getBoardChoices()
      .sort((a, b): number => {
      return a.label === b.label ? 0 : (a.label > b.label ? 1 : -1);
    }), { placeHolder: "Choose a board"});
    if (chosen && chosen.label) {
      this.updateBoardChoiceStatus(chosen);
    }
  }

  public async autoSelectBoard(vid: string, pid: string) {
    const chosen = Board.lookup(vid, pid);
    if (chosen && chosen.label) {
      this.updateBoardChoiceStatus(chosen);
    }
  }

  private updateBoardChoiceStatus(board: Board) {
    /* If this is a change, update the workspace config */
    if (!(this._currentBoard &&
          this._currentBoard.vid === board.vid &&
          this._currentBoard.pid === board.pid)) {
      let conf: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("circuitpython.board");
      conf.update("vid", board.vid);
      conf.update("pid", board.pid);
    }

    let paths: string[] = new Array<string>();
    this._currentBoard = board;

    if(board) {
      paths.push(
        path.join(this.extensionPath, "boards", board.vid, board.pid)
      );
    }
    paths.push(path.join(this.extensionPath, "stubs"));
    let libPath: string = LibraryManager.getInstance().completionPath();
    if(libPath) {
      paths.push(libPath);
    }

    vscode.workspace.getConfiguration().update(
      "python.autoComplete.extraPaths", 
      paths
    );

    if (board) {
      this._boardChoice.text = board.label;
    } else {
      this._boardChoice.text = "<Choose a board>";
    }
  }
}