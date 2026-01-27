const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

// Đọc file markdown
const markdownPath = path.join(__dirname, '..', 'KIEN-TRUC-HE-THONG.md');
const markdownContent = fs.readFileSync(markdownPath, 'utf-8');

// Parse markdown thành các đoạn
function parseMarkdown(markdown) {
  const lines = markdown.split('\n');
  const paragraphs = [];
  let currentCodeBlock = null;
  let currentCodeContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Xử lý code blocks
    if (line.startsWith('```')) {
      if (currentCodeBlock === null) {
        currentCodeBlock = line.substring(3).trim();
        currentCodeContent = [];
      } else {
        // Kết thúc code block
        if (currentCodeContent.length > 0) {
          paragraphs.push({
            type: 'code',
            language: currentCodeBlock,
            content: currentCodeContent.join('\n')
          });
        }
        currentCodeBlock = null;
        currentCodeContent = [];
      }
      continue;
    }

    if (currentCodeBlock !== null) {
      currentCodeContent.push(line);
      continue;
    }

    // Xử lý headings
    if (line.startsWith('# ')) {
      paragraphs.push({ type: 'heading1', text: line.substring(2).trim() });
    } else if (line.startsWith('## ')) {
      paragraphs.push({ type: 'heading2', text: line.substring(3).trim() });
    } else if (line.startsWith('### ')) {
      paragraphs.push({ type: 'heading3', text: line.substring(4).trim() });
    } else if (line.startsWith('#### ')) {
      paragraphs.push({ type: 'heading4', text: line.substring(5).trim() });
    } else if (line.startsWith('##### ')) {
      paragraphs.push({ type: 'heading5', text: line.substring(6).trim() });
    } else if (line.startsWith('###### ')) {
      paragraphs.push({ type: 'heading6', text: line.substring(7).trim() });
    }
    // Xử lý horizontal rule
    else if (line.trim() === '---' || line.trim() === '***') {
      paragraphs.push({ type: 'separator' });
    }
    // Xử lý list items
    else if (line.trim().startsWith('- ')) {
      paragraphs.push({ type: 'bullet', text: line.trim().substring(2) });
    }
    // Xử lý empty lines
    else if (line.trim() === '') {
      paragraphs.push({ type: 'empty' });
    }
    // Xử lý text thường
    else if (line.trim()) {
      paragraphs.push({ type: 'text', text: line.trim() });
    }
  }

  return paragraphs;
}

// Chuyển đổi sang Word document
function createWordDocument(paragraphs) {
  const children = [];

  for (const para of paragraphs) {
    if (para.type === 'heading1') {
      children.push(
        new Paragraph({
          text: para.text,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        })
      );
    } else if (para.type === 'heading2') {
      children.push(
        new Paragraph({
          text: para.text,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 150 },
        })
      );
    } else if (para.type === 'heading3') {
      children.push(
        new Paragraph({
          text: para.text,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 150, after: 100 },
        })
      );
    } else if (para.type === 'heading4') {
      children.push(
        new Paragraph({
          text: para.text,
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 100, after: 80 },
        })
      );
    } else if (para.type === 'bullet') {
      children.push(
        new Paragraph({
          text: para.text,
          bullet: {
            level: 0,
          },
          spacing: { after: 100 },
        })
      );
    } else if (para.type === 'code') {
      children.push(
        new Paragraph({
          text: para.content,
          spacing: { before: 100, after: 100 },
          style: 'Code',
        })
      );
    } else if (para.type === 'separator') {
      children.push(
        new Paragraph({
          text: '',
          border: {
            bottom: {
              color: 'auto',
              space: 1,
              value: 'single',
              size: 6,
            },
          },
          spacing: { after: 200 },
        })
      );
    } else if (para.type === 'text') {
      // Xử lý bold và italic trong text
      const textRuns = parseTextRuns(para.text);
      children.push(
        new Paragraph({
          children: textRuns,
          spacing: { after: 100 },
        })
      );
    } else if (para.type === 'empty') {
      children.push(
        new Paragraph({
          text: '',
          spacing: { after: 50 },
        })
      );
    }
  }

  return new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
            size: 24, // 12pt
          },
          paragraph: {
            spacing: {
              line: 276, // 1.15 line spacing
            },
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Code',
          name: 'Code',
          basedOn: 'Normal',
          run: {
            font: 'Courier New',
            size: 20, // 10pt
          },
          paragraph: {
            shading: {
              fill: 'F5F5F5',
            },
            indent: {
              left: 360, // 0.25 inch
            },
          },
        },
      ],
    },
  });
}

// Parse text runs để xử lý bold và italic
function parseTextRuns(text) {
  const runs = [];
  let currentIndex = 0;
  
  // Regex để tìm **bold** và *italic*
  const boldRegex = /\*\*(.+?)\*\*/g;
  const italicRegex = /\*(.+?)\*/g;
  
  const matches = [];
  let match;
  
  // Tìm tất cả bold matches
  while ((match = boldRegex.exec(text)) !== null) {
    matches.push({
      type: 'bold',
      start: match.index,
      end: match.index + match[0].length,
      text: match[1],
    });
  }
  
  // Tìm tất cả italic matches
  while ((match = italicRegex.exec(text)) !== null) {
    matches.push({
      type: 'italic',
      start: match.index,
      end: match.index + match[0].length,
      text: match[1],
    });
  }
  
  // Sắp xếp matches theo vị trí
  matches.sort((a, b) => a.start - b.start);
  
  // Loại bỏ overlaps (ưu tiên bold)
  const filteredMatches = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    let hasOverlap = false;
    
    for (let j = 0; j < filteredMatches.length; j++) {
      const existing = filteredMatches[j];
      if (
        (current.start >= existing.start && current.start < existing.end) ||
        (current.end > existing.start && current.end <= existing.end) ||
        (current.start <= existing.start && current.end >= existing.end)
      ) {
        hasOverlap = true;
        break;
      }
    }
    
    if (!hasOverlap) {
      filteredMatches.push(current);
    }
  }
  
  // Tạo text runs
  let lastIndex = 0;
  for (const match of filteredMatches) {
    if (match.start > lastIndex) {
      runs.push(new TextRun(text.substring(lastIndex, match.start)));
    }
    
    if (match.type === 'bold') {
      runs.push(
        new TextRun({
          text: match.text,
          bold: true,
        })
      );
    } else if (match.type === 'italic') {
      runs.push(
        new TextRun({
          text: match.text,
          italics: true,
        })
      );
    }
    
    lastIndex = match.end;
  }
  
  if (lastIndex < text.length) {
    runs.push(new TextRun(text.substring(lastIndex)));
  }
  
  return runs.length > 0 ? runs : [new TextRun(text)];
}

// Main function
async function convertToWord() {
  try {
    console.log('Đang đọc file markdown...');
    const paragraphs = parseMarkdown(markdownContent);
    
    console.log('Đang tạo document Word...');
    const doc = createWordDocument(paragraphs);
    
    console.log('Đang xuất file Word...');
    const buffer = await Packer.toBuffer(doc);
    
    const outputPath = path.join(__dirname, '..', 'KIEN-TRUC-HE-THONG.docx');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`✅ Đã xuất thành công file Word tại: ${outputPath}`);
  } catch (error) {
    console.error('❌ Lỗi khi chuyển đổi:', error);
    process.exit(1);
  }
}

convertToWord();
