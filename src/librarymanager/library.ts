import * as vscode from 'vscode';
import * as semver from 'semver';
import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';

/*
A Library can either represent an entry in the Adafruit_CircuitPython_Bundle or
a library in the project.
*/
export class Library implements vscode.QuickPickItem {
  public label: string = null;
  public description: string = null;

  public name: string = null;
  public version: string = null;
  public repo: string = null;
  public path: string = null;
  public mpy: boolean = false;
  public directory: boolean = false;

  public constructor(name: string, version: string, repo: string, file: string, directory: boolean) {
    this.label = name;
    this.description = `Version: ${version}`;
    this.name = name;
    this.version = version;
    this.repo = repo;
    this.path = file;
    this.directory = directory;
  }

  public static async from(p: string): Promise<Library> {
    let ext: string = path.extname(p);
    if(ext === ".py") {
      return Library.fromFile(p);
    } else if(ext === ".mpy") {
      return Library.fromBinaryFile(p); 
    } else {
      return Library.fromDirectory(p);
    }
  }

  public static async fromFile(file: string): Promise<Library> {
    let s: fs.ReadStream = fs.createReadStream(file, {encoding: "utf8"});

    return new Promise<Library>((resolve, reject) => {
      let name: string = path.basename(file, ".py");
      let version: string = null;
      let repo: string = null;

      s.on("data", (data: string) => {
        let lines: string[] = data.split('\n');
        lines = _.dropWhile(lines, (l) => l.startsWith('#'));
        while ((version === null || repo === null) && lines.length > 0) {
          let l: string = _.head(lines);
          if(l.startsWith('__version__')) {
            version = l.replace(/__version__\s=\s"([\d.?]+)"/, '$1').trim();
          } else if(l.startsWith('__repo__')) {
            repo = l.replace(/__repo__\s=\s"(.+)"/, '$1');
          }
          lines = _.tail(lines);
        }
      })
      .once('end', () => {
        resolve(new Library(name, version, repo, file, false));
      });
    });
  }

  public static async fromBinaryFile(file: string): Promise<Library> {
    let s: fs.ReadStream = fs.createReadStream(file);
    return new Promise<Library>((resolve, reject) => {
      let name: string = path.basename(file, ".mpy");
      let version: string = null;
      s.on("data", (data: string) => {
        let chunk: string = data.toString();
        let start: number = chunk.search(/[\d*\.?]+\x0b__version__/);
        let end: number = chunk.indexOf('\x0b__version');
        version = chunk.substring(start, end).trim();
      })
      .once('end', () => {
        let l: Library = new Library(name, version, null, file, false);
        l.mpy = true;
        resolve(l);
      });
    });
  }

  public static async fromDirectory(dir: string): Promise<Library> {
    let name: string = path.basename(dir);
    let mpy: boolean = false;
    let modules: Promise<Library>[] = null;
    let files: string[] = fs.readdirSync(dir);
    let mpyfiles: string[] = _.filter(files, (f) => path.extname(f) === ".mpy");
    let pyfiles: string[] = _.filter(files, (f) => path.extname(f) === ".py");
  
    // Check mpy first, since sometimes mpy folders have an __init__.py, but py
    // directories never have mpy files
    if (mpyfiles.length > 0) {
      files = mpyfiles;
      mpy = true;
      modules = files.map((v, i, a) => Library.fromBinaryFile(path.join(dir, v)));
    } else {
      files = pyfiles;
      modules = files.map((v, i, a) => Library.fromFile(path.join(dir, v)));
    }

    let potentials: Library[] = await Promise.all(modules);

    return new Promise<Library>((resolve, reject) => {
      let version: string = null;
      let repo: string = null;

      potentials = potentials.filter((v, i, a) => {
        return(v.version !== null && v.version !== "");
      });
      
      let l: Library = _.find(potentials, (v) => v.repo !== null);
      if(l === undefined) {
        l = potentials.shift();
      }  
      version = l.version;
      repo = l.repo;
      l = new Library(name, version, repo, dir, true);
      l.mpy = mpy;
      resolve(l);
    });
  }
}