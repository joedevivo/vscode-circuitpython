import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as axios from 'axios';
import * as unzip from 'unzipper';
import { String } from 'typescript-string-operations';
import * as _ from 'lodash';
import { Library } from './library';
import * as globby from 'globby';
import * as fs_extra from 'fs-extra';
import * as trash from 'trash';
import { Container } from '../container';

class LibraryQP implements vscode.QuickPickItem {
  // QuickPickItem impl
  public label: string = null;
  public description: string = null;

  public bundleLib: Library = null;
  public projectLib: Library = null;

  private op: string = null;
  public constructor(b: Library, p: Library) {
    this.bundleLib = b;
    this.projectLib = p;
    this.label = b.name;

    if(p === null) {
      this.op = "install";
      this.description = `Install version ${b.version}`;
    } else if(b.version !== p.version) {
      this.op = "update";
      this.description = `Update from v${p.version} to v${b.version}`;
    } else {
      this.op = null;
      this.description = `v${p.version} is installed and up to date.`;
    }
  }

  public onClick() {
    switch (this.op) {
      case "install":
        this.install();
        break;
      case "update":
        this.update();
        break;

      default:
        break;
    }
    Container.reloadProjectLibraries();
  }
  private install() {
    let src: string = LibraryManager.getMpy(path.basename(this.bundleLib.location));
    if(this.bundleLib.isDirectory) {
      fs_extra.copySync(
        src,
        path.join(Container.getProjectLibDir(), path.basename(this.bundleLib.location)),
        { overwrite: true }
      );
    } else {
      fs.copyFileSync(
        src,
        path.join(Container.getProjectLibDir(), path.basename(this.bundleLib.location, ".py") + ".mpy"),
      );
    }
  }

  private update() {
    this.install();
  }
}
export class LibraryManager implements vscode.Disposable {
  public static BUNDLE_URL: string = "https://github.com/adafruit/Adafruit_CircuitPython_Bundle";

  public static BUNDLE_SUFFIXES: string[] = [
    'py', '7.x-mpy', '8.x-mpy'
  ];
  public static BUNDLE_VERSION_REGEX: RegExp = /\d\d\d\d\d\d\d\d/;
  // storageRootDir is passed in from the extension BoardManager as
  // `BoardManager.globalStoragePath` We'll keep up to date libraries here, and all
  // instances of the extension can look here for them.
  private storageRootDir: string = null;

  // ${storageRootDir}/bundle
  private bundleDir: string = null;

  // ${storageRootDir}/bundle/${tag}
  private localBundleDir: string = null;

  // This is the current tag for the latest bundle ON DISK.
  public tag: string = null;

  // Circuit Python version running on this project's device
  public cpVersion = null;

  // mpySuffix defaults to "py", but we'll switch it on successful
  // identification of cpVersion
  public mpySuffix: string = "py";

  // full path to what's effectively $workspaceRoot/lib
  public projectLibDir: string = null;

  // Metadata for Bundled libraries on disk
  private libraries: Map<string, Library> = new Map<string, Library>();

  // Metadata for libraries in your project
  private workspaceLibraries: Map<string, Library> = new Map<string, Library>();

  public dispose() {}

  public constructor(p: string) {
    this.setStorageRoot(p);
  }

  public async initialize() {
    // Get the latest Adafruit_CircuitPython_Bundle
    await this.updateBundle();
    // Store the library metadata in memory
    await this.loadBundleMetadata();

    // Figure out where the project is keeping libraries.
    this.projectLibDir = this.getProjectLibDir();

    // Get their metadata
    console.log(this.projectLibDir);
    this.workspaceLibraries = await this.loadLibraryMetadata(this.projectLibDir);

    this.cpVersion = this.getProjectCPVer();
    if(this.cpVersion){
      let v: string[] = this.cpVersion.split(".");
      if(LibraryManager.BUNDLE_SUFFIXES.includes(`${v[0]}.x-mpy`)) {
        this.mpySuffix = `${v[0]}.x-mpy`;
      }
    }
  }

  public completionPath(): string {
    if(this.localBundleDir === null) {
      // In case nothing exists yet.
      return null;
    }
    return this.bundlePath("py");
  }

  public async reloadProjectLibraries() {
    this.workspaceLibraries = await this.loadLibraryMetadata(this.projectLibDir);
  }

  public async show() {
    let choices: LibraryQP[] = this.getAllChoices();
    const chosen = await vscode.window.showQuickPick(choices);
    if (chosen) {
      chosen.onClick();
    }
  }

  public async list() {
    let choices: LibraryQP[] = this.getInstalledChoices();
    const chosen = await vscode.window.showQuickPick(choices);
    if (chosen) {
      chosen.onClick();
    }
  }

  public async update() {
    let choices: LibraryQP[] = this.getInstalledChoices();
    choices.forEach((c: LibraryQP) => {
      c.onClick();
    });
  }

  private getAllChoices(): LibraryQP[] {
    let installedChoices: LibraryQP[] = this.getInstalledChoices();
    let uninstalledChoices: LibraryQP[] = this.getUninstalledChoices();
    return installedChoices.concat(uninstalledChoices);
  }

  private getInstalledChoices(): LibraryQP[] {
    let choices: LibraryQP[] = new Array<LibraryQP>();
    Array.from(this.workspaceLibraries.keys()).sort().forEach((v,i,a) => {
      let b: Library = this.libraries.get(v);
      let p: Library = this.workspaceLibraries.get(v);
      choices.push(new LibraryQP(b, p));
    });
    return choices;
  }

  private getUninstalledChoices(): LibraryQP[] {
    let choices: LibraryQP[] = new Array<LibraryQP>();
    Array.from(this.libraries.keys()).sort().forEach((v,i,a) => {
      let b: Library = this.libraries.get(v);
      if (!this.workspaceLibraries.has(v)) {
        choices.push(new LibraryQP(b, null));
      }
    });
    return choices;
  }

  private getProjectRoot(): string {
    let root:string = null;
    vscode.workspace.workspaceFolders.forEach((f) => {
      let r: string = path.join(
        f.uri.fsPath
      );
      if(!root && fs.existsSync(r)){
        let b: string = path.join(
          r, "boot_out.txt"
        );
        if(fs.existsSync(b)) {
          root = r;
        }
      }
    });
    if(!root) {
      root = vscode.workspace.workspaceFolders[0].uri.fsPath;
    }
    return root;
  }
  // Find it boot_out, so put boot_out.txt in your project root if you want this.
  private getProjectCPVer(): string {
    let confVer: string =
      vscode.workspace.getConfiguration("circuitpython.board").get("version");

    let bootOut: string = null;
    let ver: string = null;
    let b: string = path.join(
      this.getProjectRoot(),
      "boot_out.txt"
    );

    let exists: boolean = fs.existsSync(b);
    // If no boot_out.txt && configured version, use configured
    if (!exists && confVer) {
      ver = confVer;
    } else if (exists) {
      bootOut = b;
      try {
        let _a: string = fs.readFileSync(b).toString();
        let _b: string[] = _a.split(";");
        let _c: string = _b[0];
        let _d: string[] = _c.split(" ");
        let _e: string = _d[2];
        ver = _e;
      } catch (error) {
        ver = "unknown";
      }
    }
    vscode.workspace.getConfiguration("circuitpython.board").update("version", ver);
    return ver;
  }

  private getProjectLibDir(): string {
    let libDir: string = path.join(
      this.getProjectRoot(),
      "lib"
    );
    if (!fs.existsSync(libDir)) {
      fs.mkdirSync(libDir);
    }
    return libDir;
  }

  private setStorageRoot(root: string) {
    this.storageRootDir = root;
    this.bundleDir = path.join(this.storageRootDir, "bundle");
    fs.mkdirSync(this.bundleDir, {recursive: true});
    let tag: string = this.getMostRecentBundleOnDisk();
    if(tag !== undefined && this.verifyBundle(tag)) {
      this.tag = tag;
      this.localBundleDir = path.join(this.bundleDir, tag);
    }
  }

  public async updateBundle() {
    let tag: string = await this.getLatestBundleTag();
    let localBundleDir: string = path.join(this.bundleDir, tag);
    if (tag === this.tag) {
      vscode.window.showInformationMessage(`Bundle already at latest version: ${tag}`);
    } else {
      vscode.window.showInformationMessage(`Downloading new bundle: ${tag}`);
      await this.getBundle(tag);
      this.tag = tag;
      this.localBundleDir = localBundleDir;
      vscode.window.showInformationMessage(`Bundle updated to ${tag}`);
    }
    this.verifyBundle(tag);
    Container.updateBundlePath();
  }

  private verifyBundle(tag: string): boolean {
    let localBundleDir: string = path.join(this.bundleDir, tag);
    if(!fs.existsSync(localBundleDir)) {
      return false;
    }
    let bundles: fs.Dirent[] = fs.readdirSync(localBundleDir, {withFileTypes: true}).sort();

    let suffixRegExp: RegExp = new RegExp(`adafruit-circuitpython-bundle-(.*)-${tag}`);

    let suffixes: string[] = [];

    bundles.forEach(b => {
      /*
      It's possible for some operating systems to leave files in the bundle
      directory *cough* .DS_Store *cough*. Regardless, if there's a file in
      here, we can't dig deeper in its directory tree, so we'll catch them all.
      */
      if(b.isDirectory()) {
        let p: string = path.join(localBundleDir, b.name);
        let lib: string[] = fs.readdirSync(p).filter((v,i,a) => v === "lib");
        if(lib.length !== 1) {
          return false;
        }
        suffixes.push(b.name.match(suffixRegExp)[1]);
      }
    });
    // TODO: Should not overwrite BUNDLE_SUFFIXES, better to get the suffixes
    // from the GitHub API

    //LibraryManager.BUNDLE_SUFFIXES = suffixes;
    this.localBundleDir = localBundleDir;

    // We're done. New bundle in $tag, so let's delete the ones that aren't
    // this.
    fs.readdir(this.bundleDir, {withFileTypes: true}, (err, bundles) => {
      bundles.forEach(b => {
        if(b.isDirectory() && b.name !== this.tag) {
          let old: string = path.join(this.bundleDir, b.name);
          trash(old).then(() => null);
        }
      });
    });

    return true;
  }

  private getMostRecentBundleOnDisk(): string {
    if(!fs.existsSync(this.bundleDir)) {
      return null;
    }
    let tag: string =
      fs.readdirSync(this.bundleDir)
      .filter((dir: string, i: number, a: string[]) => LibraryManager.BUNDLE_VERSION_REGEX.test(dir))
      .sort()
      .reverse()
      .shift();
    return(tag);
  }
  /*
  Gets latest tag
  */
  private async getLatestBundleTag(): Promise<string> {
    let r: axios.AxiosResponse =
      await axios.default.get(
        'https://github.com/adafruit/Adafruit_CircuitPython_Bundle/releases/latest',
        { headers : { 'Accept': 'application/json'}}
      );
    return await r.data.tag_name;
  }

  /*
  Downloads 6.x. and source bundles. Source are crucial for autocomplete
  */
  private async getBundle(tag: string) {
    let urlRoot: string = LibraryManager.BUNDLE_URL + '/releases/download/{0}/adafruit-circuitpython-bundle-{1}-{0}.zip';
    this.tag = tag;
    for await (const suffix of LibraryManager.BUNDLE_SUFFIXES) {
      let url: string = String.Format(urlRoot, tag, suffix);
      let p: string = path.join(this.storageRootDir, "bundle", tag);

      await axios.default.get(url, {responseType: 'stream'}).then((response) => {
        response.data.pipe(
          unzip.Extract({path: p})
        ).on('close', (entry) => {
          if(suffix === 'py') {
            Container.loadBundleMetadata();
          };
        });
      }).catch((error) => {
        console.log(`Error downloading {suffix} bundle: ${url}`);
      });
    };
  }

  public static getMpy(name: string): string {
    if(path.extname(name) === ".py" && Container.getMpySuffix() !== "py") {
      name = path.basename(name, ".py") + ".mpy";
    }
    return path.join(
      Container.getBundlePath(),
      name
    );
  }

  public bundlePath(suffix: string): string {
    return path.join(
      this.localBundleDir,
      `adafruit-circuitpython-bundle-${suffix}-${this.tag}`,
      `lib`
    );
  }

  public async loadBundleMetadata(): Promise<boolean> {
    let bundlePath = this.bundlePath("py");
    this.libraries = await this.loadLibraryMetadata(bundlePath);
    return true;
  }

  private async loadLibraryMetadata(rootDir: string): Promise<Map<string, Library>> {
    console.log(rootDir);
    let libDirs: string[] =
      await globby( '*',
                    {absolute: true, cwd: rootDir, deep: 1, onlyFiles: false}
      );

    let libraries: Array<Promise<Library>> =
      libDirs.map((p, i, a) => Library.from(p));

    return new Promise<Map<string, Library>>(async (resolve, reject) => {
      let libs: Array<Library> = await Promise.all(libraries).catch((error) => {
        return new Array<Library>();
      });

      let libraryMetadata: Map<string, Library> = new Map<string, Library>();
      libs.forEach((l: Library) => {
        libraryMetadata.set(l.name, l);
      });
      return resolve(libraryMetadata);
    });
  }
}
