const fs = require('fs');
const path = require('path');

// Đọc file markdown
const markdownPath = path.join(__dirname, '..', 'KIEN-TRUC-HE-THONG.md');
const markdownContent = fs.readFileSync(markdownPath, 'utf-8');

// Chuyển đổi markdown sang HTML đơn giản
function markdownToHtml(markdown) {
  let html = markdown;
  
  // Headings
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^\*\*\*$/gm, '<hr>');
  
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  
  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]+?)```/g, (match, lang, code) => {
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  });
  
  // Lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
    return '<ul>' + match + '</ul>';
  });
  
  // Paragraphs (lines không phải là heading, list, code, hr)
  const lines = html.split('\n');
  const processedLines = [];
  let inCodeBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim().startsWith('<pre>')) {
      inCodeBlock = true;
      processedLines.push(line);
      continue;
    }
    
    if (line.trim().startsWith('</pre>')) {
      inCodeBlock = false;
      processedLines.push(line);
      continue;
    }
    
    if (inCodeBlock) {
      processedLines.push(line);
      continue;
    }
    
    if (line.trim() === '' || 
        line.trim().startsWith('<h') || 
        line.trim().startsWith('<ul') || 
        line.trim().startsWith('<li') ||
        line.trim().startsWith('</ul') ||
        line.trim().startsWith('<hr') ||
        line.trim().startsWith('<pre')) {
      processedLines.push(line);
    } else if (line.trim()) {
      processedLines.push('<p>' + line + '</p>');
    } else {
      processedLines.push(line);
    }
  }
  
  html = processedLines.join('\n');
  
  return html;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Tạo HTML document hoàn chỉnh
const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kiến Trúc Hệ Thống Blue Code</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.5;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 {
            font-size: 24pt;
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 12px;
            color: #000;
        }
        h2 {
            font-size: 18pt;
            font-weight: bold;
            margin-top: 16px;
            margin-bottom: 10px;
            color: #000;
        }
        h3 {
            font-size: 14pt;
            font-weight: bold;
            margin-top: 12px;
            margin-bottom: 8px;
            color: #000;
        }
        h4 {
            font-size: 12pt;
            font-weight: bold;
            margin-top: 10px;
            margin-bottom: 6px;
            color: #000;
        }
        h5 {
            font-size: 11pt;
            font-weight: bold;
            margin-top: 8px;
            margin-bottom: 4px;
            color: #000;
        }
        h6 {
            font-size: 10pt;
            font-weight: bold;
            margin-top: 6px;
            margin-bottom: 4px;
            color: #000;
        }
        p {
            margin: 6px 0;
            text-align: justify;
        }
        ul {
            margin: 6px 0;
            padding-left: 30px;
        }
        li {
            margin: 4px 0;
        }
        pre {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 12px;
            margin: 10px 0;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 10pt;
        }
        code {
            font-family: 'Courier New', monospace;
            font-size: 10pt;
            background-color: #f5f5f5;
            padding: 2px 4px;
            border-radius: 3px;
        }
        pre code {
            background-color: transparent;
            padding: 0;
        }
        hr {
            border: none;
            border-top: 1px solid #ccc;
            margin: 20px 0;
        }
        strong {
            font-weight: bold;
        }
        em {
            font-style: italic;
        }
        @media print {
            body {
                max-width: 100%;
                padding: 0;
            }
        }
    </style>
</head>
<body>
${markdownToHtml(markdownContent)}
</body>
</html>`;

// Lưu file HTML
const outputPath = path.join(__dirname, '..', 'KIEN-TRUC-HE-THONG.html');
fs.writeFileSync(outputPath, htmlContent, 'utf-8');

console.log(`✅ Đã tạo file HTML tại: ${outputPath}`);
console.log('📝 Bạn có thể:');
console.log('   1. Mở file HTML bằng trình duyệt');
console.log('   2. Mở file HTML bằng Microsoft Word');
console.log('   3. Trong Word: File > Save As > chọn định dạng .docx');
