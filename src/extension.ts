import * as vscode from 'vscode';
import { registerSmartPaste } from './smartPaste';
import { registerNewWeekly } from './newWeekly';
import { registerBase64Tools } from './base64Tools';

/**
 * Extension activation entry point
 */
export function activate(context: vscode.ExtensionContext) {
  // Register feature 1: Smart Paste for Markdown URLs
  registerSmartPaste(context);

  // Register feature 2: New Weekly folder creation
  registerNewWeekly(context);

  // Register feature 3: Base64 encryption and decryption tools
  registerBase64Tools(context);
}

/**
 * Extension deactivation
 */
export function deactivate() {}
