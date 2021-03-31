import * as vscode from 'vscode';
// Not used yet, but may do semver checks in the future. Right now logic assumes
// that the most recently downloaded bundle will be newer than the one you've
// got installed if they're different.
import * as semver from 'semver';
import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';

/*
A Library can either represent an entry in the Adafruit_CircuitPython_Bundle or
a library in the project.
*/
export class Library implements vscode.QuickPickItem {
  // QuickPickItem impl
  public label: string = null;
  public description: string = null;

  public name: string = null;
  public version: string = null;
  public repo: string = null;
  // Is this a compiled mpy library
  public mpy: boolean = false;
  // Is this a directory? If false, it's a single file.
  public isDirectory: boolean = false;
  // Whatever it is, it's this.
  public location: string = null;

  // Location may be a file or directory
  public constructor(name: string, version: string, repo: string, location: string, isDirectory: boolean) {
    this.label = name;
    this.description = `Version: ${version}`;
    this.name = name;
    this.version = version;
    this.repo = repo;
    this.location = location;
    this.isDirectory = isDirectory;
  }

  /*
  Figures out what kind of files represent this library and routes to the
  appropriate function
   */
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

  /*
  This handles the single source py file
   */
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

  /*
  This handles the single binary mpy file 
  */
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

  /*
  This handles a directory, which makes some decisions about what to look at,
  then sends single files through the above functions and identifies the one
  with the best metadata.
  */
  public static async fromDirectory(dir: string): Promise<Library> {
    let name: string = path.basename(dir);
    let mpy: boolean = false;
    let modules: Promise<Library>[] = null;
    let files: string[] = fs.readdirSync(dir);
    let deepFiles: string[] = [];
    files.forEach((file: string) => {
        deepFiles = []
        if (fs.lstatSync(path.join(dir, file)).isDirectory()) {
            deepFiles = deepFiles.concat(fs.readdirSync(path.join(dir, file)));
            deepFiles = deepFiles.map((v, i, a) => path.join(file, v));
        }
        files = files.concat(deepFiles);
    });
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