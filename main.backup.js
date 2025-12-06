import { marked } from 'marked';
import hljs from 'highlight.js';

// Configure marked with highlight.js
marked.setOptions({
    highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        } else {
            return hljs.highlightAuto(code).value;
        }
    },
    breaks: true,
    gfm: true
});

const editor = document.getElementById('markdown-input');
const preview = document.getElementById('preview-output');
const copyBtn = document.getElementById('copy-btn');
const loadBtn = document.getElementById('load-btn');
const fileInput = document.getElementById('file-input');

const initialMarkdown = `# Welcome to Markdown Viewer

This is a **live preview** markdown editor.

## Headers Demo
### Heading Level 3
#### Heading Level 4
##### Heading Level 5
###### Heading Level 6

## Features
- Real-time preview with **distinct header colors**!
- Syntax highlighting
- **Bold text is Gold!**
- *Italic text is Pink!*

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

> enjoy your editing experience!
`;

function updatePreview() {
    const markdownText = editor.value;
    const htmlContent = marked.parse(markdownText);
    preview.innerHTML = htmlContent;
}

// Event Listeners
editor.addEventListener('input', updatePreview);

loadBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        editor.value = e.target.result;
        updatePreview();
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    fileInput.value = '';
});

copyBtn.addEventListener('click', () => {
    const htmlContent = marked.parse(editor.value);
    navigator.clipboard.writeText(htmlContent).then(() => {
        const originalIcon = copyBtn.innerHTML;
        // Show checkmark
        copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        setTimeout(() => {
            copyBtn.innerHTML = originalIcon;
        }, 2000);
    });
});

// Initialize
editor.value = initialMarkdown;
updatePreview();
