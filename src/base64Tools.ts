import * as vscode from 'vscode';

/**
 * Base64 加密功能
 * @param selectedText 用户选中的文本
 */
async function base64Encode(selectedText: string): Promise<void> {
    try {
        // 对选中文本进行 Base64 编码
        const encoded = Buffer.from(selectedText, 'utf8').toString('base64');
        
        // 获取当前编辑器
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('未找到活动编辑器');
            return;
        }
        
        // 替换选中的文本为加密结果
        await editor.edit(editBuilder => {
            editBuilder.replace(editor.selection, encoded);
        });
    } catch (error) {
        vscode.window.showErrorMessage(`加密失败: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Base64 解密功能
 * @param selectedText 用户选中的文本
 */
async function base64Decode(selectedText: string): Promise<void> {
    try {
        // 对选中文本进行 Base64 解码
        const decoded = Buffer.from(selectedText, 'base64').toString('utf8');
        
        // 通过对话框展示解密结果
        await vscode.window.showInformationMessage(
            'Base64 解密结果',
            { modal: true, detail: decoded },
            '确定'
        );
    } catch (error) {
        // 显示友好的错误提示
        vscode.window.showErrorMessage(
            '解密失败',
            { modal: true, detail: '请确保选中的文本是有效的 Base64 格式' },
            '确定'
        );
    }
}

/**
 * 处理 Base64 加密命令
 */
async function handleBase64Encode(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('未找到活动编辑器');
        return;
    }
    
    const selection = editor.selection;
    if (selection.isEmpty) {
        vscode.window.showInformationMessage('请先选择要加密的文本');
        return;
    }
    
    const selectedText = editor.document.getText(selection);
    await base64Encode(selectedText);
}

/**
 * 处理 Base64 解密命令
 */
async function handleBase64Decode(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('未找到活动编辑器');
        return;
    }
    
    const selection = editor.selection;
    if (selection.isEmpty) {
        vscode.window.showInformationMessage('请先选择要解密的文本');
        return;
    }
    
    const selectedText = editor.document.getText(selection);
    await base64Decode(selectedText);
}

/**
 * 注册 Base64 加密解密功能
 */
export function registerBase64Tools(context: vscode.ExtensionContext): void {
    // 注册加密命令
    const encodeCommand = vscode.commands.registerCommand(
        'weeklytool.base64Encode',
        handleBase64Encode
    );
    context.subscriptions.push(encodeCommand);
    
    // 注册解密命令
    const decodeCommand = vscode.commands.registerCommand(
        'weeklytool.base64Decode',
        handleBase64Decode
    );
    context.subscriptions.push(decodeCommand);
}
