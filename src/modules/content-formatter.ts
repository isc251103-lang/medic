export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ContentFormatter {
  formatToHTML(text: string): string {
    // マークダウン風のテキストをHTMLに変換
    let html = text;

    // 見出しの変換
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');

    // リストの変換
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
      return '<ul>' + match + '</ul>';
    });

    // 段落の変換
    html = html.split('\n\n').map((paragraph) => {
      if (!paragraph.trim()) return '';
      if (paragraph.startsWith('<h') || paragraph.startsWith('<ul')) {
        return paragraph;
      }
      return '<p>' + paragraph + '</p>';
    }).join('\n');

    // HTMLの基本構造を追加
    html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>退院時サマリー</title>
</head>
<body>
${html}
</body>
</html>`;

    return html;
  }

  validateContent(html: string): ValidationResult {
    const errors: string[] = [];

    // 必須セクションのチェック
    const requiredSections = [
      '患者基本情報',
      '入院・退院情報',
      '主病名',
      '治療経過',
    ];

    for (const section of requiredSections) {
      if (!html.includes(section)) {
        errors.push(`必須セクション「${section}」が含まれていません`);
      }
    }

    // HTMLの妥当性チェック（簡易版）
    if (!html.includes('<html>') || !html.includes('</html>')) {
      errors.push('HTMLの構造が不正です');
    }

    // XSS対策チェック
    if (html.includes('<script>') || html.includes('javascript:')) {
      errors.push('不正なスクリプトが検出されました');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
