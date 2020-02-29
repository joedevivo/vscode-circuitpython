import * as vscode from 'vscode';
import { posix } from 'path';
import * as fs from 'fs';
import { SerialMonitor } from "./serialmonitor/serialMonitor";
import { Context } from "./context";
import { execSync } from "child_process";
import * as $ from 'shelljs';
import { Board } from "./boards/board";
import { Circup } from './circup';

export function activate(context: vscode.ExtensionContext) {
	let metadataFile: string = posix.join(
		context.extensionPath,
		"boards",
		"metadata.json"
	);
	Board.loadBoards(metadataFile);

	let circup: Circup = Circup.getInstance();

	const extContext = Context.getInstance();
	extContext.extensionPath = context.extensionPath;
	
	// Path to Circuit Python Libraries
	extContext.libraryPath = circup.getLibraryPath();

	// Disable jedi
	vscode.workspace.getConfiguration().update("python.jediEnabled", false);

	if (!SerialMonitor.getInstance().initialized) {
		SerialMonitor.getInstance().initialize();
	}
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
		extContext.selectBoard()
	);
	context.subscriptions.push(selectBoardCmd);

	let circupListCmd = vscode.commands.registerCommand('circuitpython.circup.list', () =>
		circup.list()
	);
	context.subscriptions.push(circupListCmd);

	let circupShowCmd = vscode.commands.registerCommand('circuitpython.circup.show', () =>
		circup.show()
	);
	context.subscriptions.push(circupShowCmd);

	let circupUpdateCmd = vscode.commands.registerCommand('circuitpython.circup.update', () =>
	  circup.update()
	);
	context.subscriptions.push(circupUpdateCmd);
}

// this method is called when your extension is deactivated
export function deactivate() {}
