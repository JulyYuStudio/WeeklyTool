import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';

function isLikelyUrl(text: string): string | null {
  const trimmed = text.trim();
  const urlRegex = /^(https?:\/\/[^\s]+)$/i;
  if (urlRegex.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function decodeHtmlEntities(input: string): string {
  // Minimal decode; handle common entities
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

async function fetchUrlText(url: string, timeoutMs: number): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const lib = url.startsWith('https:') ? https : http;
    const req = lib.get(url, {
      headers: {
        'user-agent': 'WeeklyTool SmartPaste/0.0.1 (+vscode)'
      }
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // simple redirect follow (one hop)
        const redirected = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).toString();
        req.destroy();
        fetchUrlText(redirected, timeoutMs).then(resolve, reject);
        return;
      }
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks: Uint8Array[] = [];
      res.on('data', (d: Uint8Array) => chunks.push(d));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve(buf.toString('utf8'));
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('Request timeout'));
    });
  });
}

function extractTitle(html: string): string | null {
  // Prefer og:title if present
  const ogMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["'][^>]*>/i);
  if (ogMatch && ogMatch[1]) {
    return decodeHtmlEntities(ogMatch[1]);
  }
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return decodeHtmlEntities(titleMatch[1]);
  }
  return null;
}

type ContextType = 'article' | 'other' | null;

function isEligibleContext(document: vscode.TextDocument, position: vscode.Position): ContextType {
  // Scan upwards to determine context:
  //   - 'article': for "## 📕精选文章" or list item starting with "* 📄"
  //   - 'other': for other "##" headers
  //   - null: no eligible context
  for (let lineNum = position.line; lineNum >= 0; lineNum--) {
    const lineText = document.lineAt(lineNum).text;
    if (lineText.trim() === '') {
      // Skip empty lines and continue scanning upwards
      continue;
    }
    if (lineText.trim() === '## 📕精选文章') {
      return 'article';
    }
    if (lineText.trim().startsWith('* 📄')) {
      return 'article';
    }
    // Check for other markdown headers (## followed by space)
    if (lineText.trim().match(/^##\s+/)) {
      return 'other';
    }
    // Found other non-empty content before eligible markers -> not eligible
    if (lineNum < position.line) {
      return null;
    }
  }
  return null;
}

class MarkdownUrlPasteProvider implements vscode.DocumentPasteEditProvider {
  readonly id = 'weeklytool.markdownSmartPaste';

  async provideDocumentPasteEdits(
    document: vscode.TextDocument,
    ranges: readonly vscode.Range[],
    dataTransfer: vscode.DataTransfer,
    context: vscode.DocumentPasteEditContext,
    token: vscode.CancellationToken
  ): Promise<vscode.DocumentPasteEdit[] | undefined> {
    try {
      const enabled = vscode.workspace.getConfiguration().get<boolean>('weeklytool.smartPaste.enabled', true);
      if (!enabled) {
        return undefined;
      }
      if (document.languageId !== 'markdown') {
        return undefined;
      }

      const position = ranges[0]?.start ?? new vscode.Position(0, 0);
      const contextType = isEligibleContext(document, position);

      // Check if fallback format is enabled when no context is found
      const fallbackEnabled = vscode.workspace.getConfiguration().get<boolean>('weeklytool.smartPaste.fallbackFormat', false);
      if (!contextType && !fallbackEnabled) {
        return undefined;
      }

      const uriItem = dataTransfer.get('text/uri-list');
      const textItem = dataTransfer.get('text/plain');
      const raw = (uriItem?.value as string | undefined) ?? (textItem?.value as string | undefined) ?? '';
      const url = isLikelyUrl(raw);
      if (!url) {
        return undefined; // not a pure URL paste, let default proceed
      }

      const timeoutMs = vscode.workspace.getConfiguration().get<number>('weeklytool.smartPaste.requestTimeoutMs', 5000);
      let title: string | null = null;
      try {
        const html = await fetchUrlText(url, timeoutMs);
        title = extractTitle(html);
      } catch {
        // ignore and fallback later
      }

      if (!title) {
        return undefined; // parsing failed -> default paste
      }

      // Generate different format based on context type
      let insertText: string;
      let confirmMessage: string;

      if (contextType === 'article') {
        insertText = `* 📄[${title}](${url})`;
        confirmMessage = `识别到 URL，标题为: ${title}，是否按 '* 📄[Title](url)' 插入？`;
      } else if (contextType === 'other') {
        insertText = `**${title}**  \n${url}`;
        confirmMessage = `识别到 URL，标题为: ${title}，是否按 '**Title**\\nurl' 插入？`;
      } else {
        // contextType is null, use fallback format
        insertText = `* [${title}](${url})`;
        confirmMessage = `识别到 URL，标题为: ${title}，是否按 '* [Title](url)' 插入？`;
      }

      const confirm = await vscode.window.showInformationMessage(
        confirmMessage,
        { modal: true, detail: url },
        '是',
        '否'
      );
      if (confirm !== '是') {
        return undefined; // user declined -> default paste
      }

      const snippet = new vscode.SnippetString(insertText);

      const pasteEdit = new vscode.DocumentPasteEdit(
        snippet,
        '插入文章链接',
        vscode.DocumentDropOrPasteEditKind.Empty
      );
      // Ensure we replace the paste range with our snippet
      pasteEdit.additionalEdit = new vscode.WorkspaceEdit();
      // No additional edits; the snippet will replace the paste selection
      return [pasteEdit];
    } catch {
      return undefined;
    }
  }
}

/**
 * Register the smart paste feature
 */
export function registerSmartPaste(context: vscode.ExtensionContext): void {
  const provider = new MarkdownUrlPasteProvider();
  context.subscriptions.push(
    vscode.languages.registerDocumentPasteEditProvider(
      { language: 'markdown' },
      provider,
      {
        pasteMimeTypes: ['text/uri-list', 'text/plain'],
        providedPasteEditKinds: [vscode.DocumentDropOrPasteEditKind.Empty]
      }
    )
  );
}