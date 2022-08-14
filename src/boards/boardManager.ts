import * as vscode from "vscode";
import { Board } from './board';
import * as path from 'path';
import { LibraryManager } from "../librarymanager/libraryManager";
import { Container } from "../container";

export class BoardManager implements vscode.Disposable {
  private extensionPath: string = null;
  public libraryPath: string = null;

  private _boardChoice: vscode.StatusBarItem;
  private _currentBoard: Board;
  private static _boardManager: BoardManager = null;

  public constructor(board: Board) {
    this._boardChoice = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 30);
    this._boardChoice.command = "circuitpython.selectBoard";
    this._boardChoice.text = "<Choose a board>";
    this._boardChoice.tooltip = "Choose Circuit Python Board";
    if (board !== null) {
      this._boardChoice.text = board.label;
    }
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

  public async selectBoard() {
    const chosen = await vscode.window.showQuickPick(
      Board.getBoardChoices()
      .sort((a, b): number => {
      return a.label === b.label ? 0 : (a.label > b.label ? 1 : -1);
    }), { placeHolder: "Choose a board"});
    if (chosen && chosen.label) {
      Container.setBoard(chosen);
    }
  }

  public async openBoardSite() {
    vscode.env.openExternal(vscode.Uri.parse(Container.getBoard().site));
  }

  public updateBoardChoiceStatus(board: Board) {
    if (board) {
      this._boardChoice.text = board.label;
    } else {
      this._boardChoice.text = "<Choose a board>";
    }
  }
}