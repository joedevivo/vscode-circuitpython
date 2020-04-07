import * as vscode from 'vscode';
import { Container } from './container';

export async function activate(context: vscode.ExtensionContext) {
	// Disable jedi
	vscode.workspace.getConfiguration().update("python.jediEnabled", false);

	let container: Container = await Container.newInstance(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
