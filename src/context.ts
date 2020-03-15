import * as vscode from "vscode";
import { Board } from './boards/board';
import * as path from 'path';
import { LibraryManager } from "./librarymanager/libraryManager";

export class Context implements vscode.Disposable {
  public extensionPath: string = null;
  public libraryPath: string = null;

  public static getInstance(): Context {
    if (Context._context === null) {
      Context._context = new Context();
    }
    return Context._context;
  }

  private _boardChoice: vscode.StatusBarItem;
  private _currentBoard: Board;
  private static _context: Context = null;

  private constructor() {
    this.initialize();
  }

  public initialize() {
    this._boardChoice = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 30);
    this._boardChoice.command = "circuitpython.selectBoard";
    this._boardChoice.tooltip = "Choose Circuit Python Board";
    this._boardChoice.show();
  }

  public dispose() {}

  public static resetCompletionPath() {
    Context._context.updateBoardChoiceStatus(
      Context._context._currentBoard
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
    console.log(pid);
    console.log(Board.lookup(vid, pid));
    const chosen = Board.lookup(vid, pid);
    if (chosen && chosen.label) {
      this.updateBoardChoiceStatus(chosen);
    }
  }

  private updateBoardChoiceStatus(board: Board) {
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