import { QuickPickItem } from "vscode";
import * as fs from 'fs';
import { stringify } from "querystring";
import { normalize } from "path";

export class Board implements QuickPickItem {
  public vid: string;
  public pid: string;
  public product: string;
  public manufacturer: string;
  public label: string;
  public description: string = "";
  public site: string;

  public constructor(m: Map<string, string>) {
    this.vid = m["vid"];
    this.pid = m["pid"];
    this.product = m["product"];
    this.manufacturer = m["manufacturer"];
    this.label = this.manufacturer + ":" + this.product;
    if(m["site_path"]){
      this.site = `https://circuitpython.org/board/${m["site_path"]}/`
    };
  }

  private static _boards: Map<string, Board> = null;
  public static loadBoards(metadataFile: string) {
    if (Board._boards === null) {
      Board._boards = new Map<string, Board>();
    }
    let jsonData: Buffer = fs.readFileSync(metadataFile);
    let boardMetadata: Array<Map<string, string>> = JSON.parse(jsonData.toString());
    boardMetadata.forEach(b => {
      Board._boards.set(Board.key(b["vid"], b["pid"]), new Board(b));
    });
  }
  public static getBoardChoices(): Array<Board> {
    return Array.from(Board._boards.values());
  }
  public static lookup(vid: string, pid: string): Board {
    let key: string = Board.key(vid, pid);
    return Board._boards.get(key);
  }
  public static key(vid: string, pid: string): string {
    return Board._normalizeHex(vid) + ":" + Board._normalizeHex(pid);
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