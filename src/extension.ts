import * as vscode from 'vscode';
import { registerSmartPaste } from './smartPaste';
import { registerNewWeekly } from './newWeekly';

/**
 * Extension activation entry point
 */
export function activate(context: vscode.ExtensionContext) {
  // Register feature 1: Smart Paste for Markdown URLs
  registerSmartPaste(context);

  // Register feature 2: New Weekly folder creation
  registerNewWeekly(context);
}

/**
 * Extension deactivation
 */
export function deactivate() {}
