import * as vscode from 'vscode';
import { Container } from './container';

export async function activate(context: vscode.ExtensionContext) {
	vscode.workspace.getConfiguration().update("python.languageServer", "Pylance");
	vscode.workspace.getConfiguration().update("python.linting.pylintEnabled", false);

	let config_key = "python.analysis.diagnosticSeverityOverrides"
	let config_value = vscode.workspace.getConfiguration()[config_key];
	config_value["reportMissingModuleSource"] = "none";
	vscode.workspace.getConfiguration().update(config_key,config_value);
	let container: Container = await Container.newInstance(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
