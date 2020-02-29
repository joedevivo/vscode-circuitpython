import * as vscode from 'vscode';
import * as $ from 'shelljs';
import { execSync } from "child_process";

import { posix } from 'path';
import * as fs from 'fs';

class Library implements vscode.QuickPickItem {
  public name: string;
  public installed: string = null;
  public label: string;
  public description: string;
  public constructor(name: string) {
    this.name = name;
    this.label = name;
    this.description = "";
  }
}

export class Circup implements vscode.Disposable {
  private _exec: string = null;
  private _dataDir: string = null;
  private _tag: string = null;

  private libraries: Map<string, Library> = null;

  private static _circup: Circup = null;
  public static getInstance(): Circup {
    if (Circup._circup === null) {
      Circup._circup = new Circup();
    }
    return Circup._circup;
  }

  private constructor() {
    this.initialize();
  }

  public initialize() {
    let cmd: string = $.which("circup");
    if (cmd === null) {
      console.log("TODO: circup not installed, we should ask permission to install");
      execSync(`python -m pip install -U circup --user`);
      cmd = $.which("circup");
    }
    this._exec = cmd;
    this._dataDir = execSync(`python -c 'import circup; print(circup.DATA_DIR)'`).toString().trim();
    this._setTag();
    this.reloadLibraries();
  }

  private reloadLibraries() {
    let libs: Array<string> = this._show();
    let installed: Map<string, string> = this._freeze();
    this.libraries = new Map<string, Library>();
    libs.map((l) => {
      let lib: Library = new Library(l);
      if (installed.has(l)) {
        lib.installed = installed.get(l);
        lib.description = "Version " + lib.installed + " installed.";
      }
      this.libraries.set(l, lib);
    });
  }

  public getLibraryPath(): string {
    return posix.join(
      this._dataDir, 
      "adafruit_circuitpython_bundle_py", 
      "adafruit-circuitpython-bundle-py-" + this._tag, 
      "lib"
    );
  }

  private _setTag() {
    let circupTag: string = posix.join(
      this._dataDir,
      "circup.json"
    );
    let circupData: Buffer = fs.readFileSync(circupTag);
    this._tag = JSON.parse(circupData.toString())["tag"];
  }

  public async update() {
    let up: string = await execSync(`${Circup.getInstance()._exec} update --all`).toString();
    vscode.window.showInformationMessage(up);
  }

  public async list() {
    console.log(execSync(`${Circup.getInstance()._exec} list`).toString().split('\n'));
  }

  public async show() {
    let choices: Array<Library> = await Array.from(this.libraries.values());
    const chosen = await vscode.window.showQuickPick(choices);
    if (chosen && chosen.installed === null) {
      this._install(chosen.name);
      let installed: Map<string, string> = this._freeze();
      let l: Library = this.libraries.get(chosen.name);
      l.installed = installed.get(chosen.name);
      this.libraries.set(chosen.name,  l);
    }
  }

  private _show(): Array<string> {
    let libs: Array<string> = execSync(`${this._exec} show`).toString().split('\n');
    libs.shift();
    libs.shift();
    libs.pop();
    libs.pop();
    return libs;
  }

  private _freeze(): Map<string, string> {
    let frozen: Array<string> = execSync(`${this._exec} freeze`).toString().split('\n');
    frozen.shift();
    frozen.shift();
    frozen.pop();

    let installed: Map<string, string> = new Map<string, string>();
    frozen.forEach(f => {
      let s: Array<string> = f.split("==");
      installed.set(s[0].trim(), s[1].trim());
    }); 
    return installed;
  }

  private _install(l: string) {
    execSync(`${this._exec} install ${l}`);
    this.reloadLibraries();
  }

  public dispose() {}

}