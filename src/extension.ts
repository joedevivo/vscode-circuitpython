import * as vscode from "vscode";
import { Container } from "./container";

export async function activate(context: vscode.ExtensionContext) {
  let pythonConfig: vscode.WorkspaceConfiguration =
    vscode.workspace.getConfiguration("python");
  pythonConfig.update("languageServer", "Pylance");
  let pythonAnalysis: Object = pythonConfig.get(
    "analysis.diagnosticSeverityOverrides"
  );
  pythonAnalysis["reportMissingModuleSource"] = "none";
  pythonAnalysis["reportShadowedImports"] = "none";
  pythonConfig.update("analysis.diagnosticSeverityOverrides", pythonAnalysis);

  let container: Container = await Container.newInstance(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
