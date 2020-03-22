import * as vscode from 'vscode';
import * as path from 'path';
import { SerialMonitor } from "./serialmonitor/serialMonitor";
import { BoardManager } from "./boards/boardManager";
import { Board } from "./boards/board";
import { LibraryManager } from './librarymanager/libraryManager';
import { DeviceManager } from './devicemanager/deviceManager';

export async function activate(context: vscode.ExtensionContext) {
	// Disable jedi
	vscode.workspace.getConfiguration().update("python.jediEnabled", false);

	// Update bundle and load metadata on activation
	await LibraryManager.newInstance(context.globalStoragePath);
	let lib: LibraryManager = LibraryManager.getInstance();
	let libraryShowCmd = vscode.commands.registerCommand('circuitpython.library.show', () =>
		lib.show()
	);
	context.subscriptions.push(libraryShowCmd);
	let libraryListCmd = vscode.commands.registerCommand('circuitpython.library.list', () =>
		lib.list()
	);	
	context.subscriptions.push(libraryListCmd);
	let libraryUpdateCmd = vscode.commands.registerCommand('circuitpython.library.update', () =>
		lib.update()
	);
	context.subscriptions.push(libraryUpdateCmd);
	let libraryReloadProjectCmd = vscode.commands.registerCommand('circuitpython.library.reload', () =>
		lib.reloadProjectLibraries()
	);
	context.subscriptions.push(libraryReloadProjectCmd);
	vscode.workspace.onDidDeleteFiles((e: vscode.FileDeleteEvent) => lib.reloadProjectLibraries());

	let dev: DeviceManager = await DeviceManager.getInstance();

	let metadataFile: string = path.join(
		context.extensionPath,
		"boards",
		"metadata.json"
	);
	Board.loadBoards(metadataFile);
	const boardManager = BoardManager.getInstance();
	boardManager.setExtensionPath(context.extensionPath);
	
	// Path to Circuit Python Libraries
	boardManager.libraryPath = lib.completionPath();

	const serialMonitor = SerialMonitor.getInstance();
	context.subscriptions.push(serialMonitor);

	let serialMonitorCmd = vscode.commands.registerCommand('circuitpython.openSerialMonitor', () => 
		serialMonitor.openSerialMonitor()
	);
	context.subscriptions.push(serialMonitorCmd);

	let selectSerialPortCmd = vscode.commands.registerCommand('circuitpython.selectSerialPort', () => 
		serialMonitor.selectSerialPort(null, null)
	);
	context.subscriptions.push(selectSerialPortCmd);

	let closeSerialMonitorCmd = vscode.commands.registerCommand('circuitpython.closeSerialMonitor', () => 
		serialMonitor.closeSerialMonitor()
	);
	context.subscriptions.push(closeSerialMonitorCmd);

	let selectBoardCmd = vscode.commands.registerCommand('circuitpython.selectBoard', () => 
	  boardManager.selectBoard()
	);
	context.subscriptions.push(selectBoardCmd);
}

// this method is called when your extension is deactivated
export function deactivate() {}
