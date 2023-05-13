import * as vscode from 'vscode';
import { Container } from './container';

export async function activate(context: vscode.ExtensionContext) {
	vscode.workspace.getConfiguration().update("python.languageServer", "Pylance");
	vscode.workspace.getConfiguration().update("python.linting.pylintEnabled", false);

	let config_key: string = "python.analysis.diagnosticSeverityOverrides"
	let config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(config_key);
	config.update("reportMissingModuleSource", "none");
	let container: Container = await Container.newInstance(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
