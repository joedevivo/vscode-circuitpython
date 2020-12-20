import { QuickPickItem } from "vscode";
import * as fs from 'fs';
import { stringify } from "querystring";
import { normalize } from "path";

class BoardData {
  public vid: string;
  public pid: string;
  public product: string;
  public manufacturer: string;
}

export class Board implements QuickPickItem {
  public vid: string;
  public pid: string;
  public product: string;
  public manufacturer: string;
  public label: string;
  public description: string = "";

  public constructor(m: BoardData) {
    this.vid = m["vid"];
    this.pid = m["pid"];
    this.product = m["product"];
    this.manufacturer = m["manufacturer"];
    this.label = this.manufacturer + ":" + this.product;
  }

  private static _boards: Map<string, Board> = null;
  public static loadBoards(metadataFile: string) {
    if (Board._boards === null) {
      Board._boards = new Map<string, Board>();
    }
    let jsonData: Buffer = fs.readFileSync(metadataFile);
    let boardMetadata: Array<BoardData> = JSON.parse(jsonData.toString());
    boardMetadata.forEach(b => {
      Board._boards.set(Board.key(b["vid"], b["pid"]), new Board(b));
    });
    console.log(Board._boards);
  }
  public static getBoardChoices(): Array<Board> {
    return Array.from(Board._boards.values());
  }
  public static lookup(vid: string, pid: string): Board {
    vid = Board._normalizeHex(vid);
    pid = Board._normalizeHex(pid);
    let key: string = Board.key(vid, pid);
    let found: Board = Board._boards.get(key);
    if (found) {
      return found;
    }
    return new Board({
      vid: vid,
      pid: pid,
      manufacturer: Board._normalizeHex(vid),
      product: Board._normalizeHex(pid)
    });
  }
  public static key(vid: string, pid: string): string {
    return `${vid}:${pid}`;
  }
  private static _normalizeHex(hex: string): string {
    let n: string = hex;
    if (hex.length === 4)  {
      n = "0x" + hex.toUpperCase();
    } else if(hex.length === 6) {
      n = "0x" + hex.substring(2).toUpperCase();
    }
    return n;
  }
}