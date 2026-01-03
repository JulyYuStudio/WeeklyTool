import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Find the maximum number from folders matching pattern "No{number}"
 * Returns null if no matching folders found
 */
function findMaxWeeklyNumber(dirPath: string): number | null {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const noPattern = /^No(\d+)$/;
    let maxNum: number | null = null;

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const match = entry.name.match(noPattern);
        if (match) {
          const num = parseInt(match[1], 10);
          if (maxNum === null || num > maxNum) {
            maxNum = num;
          }
        }
      }
    }

    return maxNum;
  } catch (err) {
    return null;
  }
}

/**
 * Create a new weekly folder with incremented number and corresponding markdown file
 */
async function createNewWeekly(uri: vscode.Uri | undefined) {
  try {
    // Determine the target directory
    let targetDir: string;
    if (uri && uri.fsPath) {
      const stat = fs.statSync(uri.fsPath);
      targetDir = stat.isDirectory() ? uri.fsPath : path.dirname(uri.fsPath);
    } else if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      targetDir = vscode.workspace.workspaceFolders[0].uri.fsPath;
    } else {
      vscode.window.showErrorMessage('无法确定目标目录');
      return;
    }

    // Find max weekly number
    const maxNum = findMaxWeeklyNumber(targetDir);
    if (maxNum === null) {
      vscode.window.showWarningMessage('未找到符合 "NoXX" 格式的文件夹，无法创建新周报');
      return;
    }

    // Create new folder name
    const newNum = maxNum + 1;
    const newFolderName = `No${newNum}`;
    const newFolderPath = path.join(targetDir, newFolderName);

    // Check if folder already exists
    if (fs.existsSync(newFolderPath)) {
      vscode.window.showErrorMessage(`文件夹 ${newFolderName} 已存在`);
      return;
    }

    // Create the folder
    fs.mkdirSync(newFolderPath);

    // Create markdown file with same name and template content
    const mdFileName = `${newFolderName}.md`;
    const mdFilePath = path.join(newFolderPath, mdFileName);
    const templateContent = `## 📕精选文章\n\n## 🤖AI前沿\n\n## 🔨实用工具\n\n## 📚宝藏资源\n\n## 💡优秀作品\n\n## 🎮好玩有趣\n\n## 📝日常记录`;
    fs.writeFileSync(mdFilePath, templateContent, 'utf8');

    // Open the newly created markdown file
    const doc = await vscode.workspace.openTextDocument(mdFilePath);
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage(`成功创建 ${newFolderName} 及 ${mdFileName}`);
  } catch (err) {
    vscode.window.showErrorMessage(`创建失败: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Register the new weekly command
 */
export function registerNewWeekly(context: vscode.ExtensionContext): void {
  const newWeeklyCommand = vscode.commands.registerCommand(
    'weeklytool.newWeekly',
    createNewWeekly
  );
  context.subscriptions.push(newWeeklyCommand);
}