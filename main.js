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

// 라이트/다크 모드
const THEME_KEY = 'theme';
const sunIcon = `
    <svg id="theme-toggle-icon" xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
`;
const moonIcon = `
    <svg id="theme-toggle-icon" xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
`;

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const dark = document.getElementById('hljs-dark-theme');
    const light = document.getElementById('hljs-light-theme');
    if (dark) dark.disabled = theme === 'light';
    if (light) light.disabled = theme !== 'light';
    const icon = document.getElementById('theme-toggle-icon');
    if (icon) icon.outerHTML = (theme === 'light' ? sunIcon : moonIcon).trim();
}

function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const theme = saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    applyTheme(theme);
}

initTheme();

const themeToggleBtn = document.getElementById('theme-toggle-btn');
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'light' ? 'dark' : 'light';
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
    });
}

const editor = document.getElementById('markdown-input');
const preview = document.getElementById('preview-output');
const copyBtn = document.getElementById('copy-btn');
const loadBtn = document.getElementById('load-btn');
const fileInput = document.getElementById('file-input');
const viewToggleBtn = document.getElementById('view-toggle-btn');
const splitContainer = document.querySelector('.split-container');

let isEditorMode = true;
splitContainer.classList.add('editor-mode');

function enterEditorMode() {
    isEditorMode = true;
    splitContainer.classList.remove('preview-mode');
    splitContainer.classList.add('editor-mode');
    viewToggleBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    `;
    viewToggleBtn.title = "View Preview";
}

function enterPreviewMode() {
    isEditorMode = false;
    splitContainer.classList.remove('editor-mode');
    splitContainer.classList.add('preview-mode');
    viewToggleBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
      </svg>
    `;
    viewToggleBtn.title = "View Editor";
    // Also update the preview when switching to it, to ensure it's fresh
    updatePreview();
}

viewToggleBtn.addEventListener('click', () => {
    if (isEditorMode) {
        enterPreviewMode();
    } else {
        enterEditorMode();
    }
});

const fontSelect = document.getElementById('font-select');

fontSelect.addEventListener('change', (e) => {
    document.documentElement.style.setProperty('--preview-font', e.target.value);
});

const initialMarkdown = `---
title: 마크다운 뷰어 데모
author: Antigravity
date: 2023-10-27
source: https://google.com
tags: [마크다운, 뷰어, 라이브]
---

# 마크다운 뷰어에 오신 것을 환영합니다

이곳은 **실시간 미리보기** 마크다운 에디터입니다.

## 헤더 데모
### 헤딩 레벨 3
#### 헤딩 레벨 4
##### 헤딩 레벨 5
###### 헤딩 레벨 6

## 기능
- **다양한 헤더 색상**을 지원하는 실시간 미리보기!
- 문법 강조 (Syntax highlighting)
- **굵은 텍스트는 금색입니다!**
- *이탤릭 텍스트는 분홍색입니다!*

\`\`\`javascript
function hello() {
  console.log("안녕하세요, 세상아!");
}
\`\`\`

> 즐거운 편집 되세요!
`;

// Configure custom renderer for links
marked.use({
    renderer: {
        link(href, title, text) {
            return `<a target="_blank" rel="noopener noreferrer" href="${href}" title="${title || ''}">${text}</a>`;
        }
    }
});


function preprocessMarkdown(markdown) {
    // Check if markdown starts with frontmatter delimiter
    if (markdown.startsWith('---')) {
        const endFrontmatter = markdown.indexOf('\n---', 3);
        if (endFrontmatter !== -1) {
            const frontmatter = markdown.slice(4, endFrontmatter).trim(); // Content between delimiters
            const content = markdown.slice(endFrontmatter + 4);

            const lines = frontmatter.split('\n');
            let rows = '';

            for (const line of lines) {
                const colonIndex = line.indexOf(':');
                if (colonIndex !== -1) {
                    const key = line.slice(0, colonIndex).trim();
                    let value = line.slice(colonIndex + 1).trim();
                    if (value.startsWith('http')) {
                        value = `<a href="${value}" target="_blank" rel="noopener noreferrer">${value}</a>`;
                    }
                    rows += `<tr><td><strong>${key}</strong></td><td>${value}</td></tr>`;
                }
            }
            // <details>는 기본적으로 접혀 있어 초기 로드 시 프론트매터가 보이지 않는다
            const html = `<details class="frontmatter-details">\n<summary>메타데이터</summary>\n\n<table>\n<thead><tr><th>Key</th><th>Value</th></tr></thead>\n<tbody>${rows}</tbody>\n</table>\n\n</details>\n\n`;
            return html + content;
        }
    }
    return markdown;
}

function updatePreview() {
    const markdownText = editor.value;
    const processedText = preprocessMarkdown(markdownText);
    const htmlContent = marked.parse(processedText);
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

// TTS Implementation (Supertonic3 via All4me SupertonicTTS 서버)
// Mac에서 실행 중인 SupertonicTTS 웹서버(/chunks, /synth)에 접속해 문장 단위로 합성/재생한다.
// https로 배포된 페이지에서는 http 요청이 차단(mixed content)되므로 Tailscale HTTPS 주소를 기본값으로 사용
const DEFAULT_SERVER_URL = location.protocol === 'https:'
    ? 'https://roy-macbookair.tailf4ccb7.ts.net'
    : 'http://royui-macbookair.local:8080';
const SUPERTONIC_VOICES = ['M1', 'M2', 'M3', 'M4', 'M5', 'F1', 'F2', 'F3', 'F4', 'F5'];

// 한글이 없고 알파벳이 있으면 영어 문장으로 판단
function isEnglishSentence(text) {
    const hangul = (text.match(/[가-힣]/g) || []).length;
    const latin = (text.match(/[A-Za-z]/g) || []).length;
    return hangul === 0 && latin > 0;
}

class TTSManager {
    constructor() {
        this.audioPlayer = new Audio();
        this.sentences = [];
        this.sentenceIndexMap = [];
        this.allSentences = null;
        this.audioCache = {};
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isPaused = false;
        // repeatEnglish: 영어 문장을 N번씩 반복 재생 (한글 문장은 항상 1회)
        this.repeatEnglish = localStorage.getItem('repeat_english') === 'true';
        this.repeatTimes = Math.max(1, parseInt(localStorage.getItem('repeat_times'), 10) || 2);
        this.repeatCountLeft = 0;
        this.lastSpokenIndex = -1;
        this.lastHighlightFlatOffset = 0;
        // skipKorean: 재생 목록에서 한글 문장 자체를 제외
        this.skipKorean = localStorage.getItem('skip_korean') === 'true';

        this.serverUrl = (localStorage.getItem('supertonic_url') || DEFAULT_SERVER_URL).replace(/\/$/, '');
        this.token = localStorage.getItem('supertonic_token') || '';
        this.voice = localStorage.getItem('supertonic_voice') || 'M1';
        this.fmt = localStorage.getItem('supertonic_fmt') || 'wav';

        this.rateEn = parseFloat(localStorage.getItem('rate_en')) || 1.0;
        this.rateKo = parseFloat(localStorage.getItem('rate_ko')) || 1.0;
        this.textSize = 100; // percent

        // Controls
        this.toggleBtn = document.getElementById('footer-toggle');
        this.stopBtn = document.getElementById('footer-stop');
        this.prevBtn = document.getElementById('tts-prev');
        this.nextBtn = document.getElementById('tts-next');
        this.repeatEnBtn = document.getElementById('tts-repeat-en');

        // Header controls (Sync)
        this.headerToggleBtn = document.getElementById('tts-toggle');
        this.headerStopBtn = document.getElementById('tts-stop');

        this.rateEnIncreaseBtn = document.getElementById('rate-en-increase');
        this.rateEnDecreaseBtn = document.getElementById('rate-en-decrease');
        this.rateEnValueDisplay = document.getElementById('rate-en-value');

        this.rateKoIncreaseBtn = document.getElementById('rate-ko-increase');
        this.rateKoDecreaseBtn = document.getElementById('rate-ko-decrease');
        this.rateKoValueDisplay = document.getElementById('rate-ko-value');

        this.sizeIncreaseBtn = document.getElementById('size-increase');
        this.sizeDecreaseBtn = document.getElementById('size-decrease');
        this.sizeValueDisplay = document.getElementById('size-value');

        this.sentenceCounter = document.getElementById('header-sentence-counter');
        this.previewPane = document.getElementById('preview-output');
        this.voiceSelect = document.getElementById('voice-select');
        this.fmtSelect = document.getElementById('fmt-select');

        // Settings modal
        this.settingsModal = document.getElementById('settings-modal');
        this.settingsOpenBtn = document.getElementById('settings-open-btn');
        this.settingsCloseBtn = document.getElementById('settings-close-btn');
        this.settingsRefreshBtn = document.getElementById('settings-refresh-btn');
        this.repeatEnCheckbox = document.getElementById('repeat-en-checkbox');
        this.skipKoreanCheckbox = document.getElementById('skip-korean-checkbox');
        this.repeatCountIncreaseBtn = document.getElementById('repeat-count-increase');
        this.repeatCountDecreaseBtn = document.getElementById('repeat-count-decrease');
        this.repeatCountValueDisplay = document.getElementById('repeat-count-value');
        this.serverUrlInput = document.getElementById('server-url-input');
        this.serverTokenInput = document.getElementById('server-token-input');
        this.serverSaveBtn = document.getElementById('server-save-btn');

        this.audioPlayer.addEventListener('ended', () => {
            if (!this.isPlaying || this.isPaused) return;
            if (this.repeatEnglish && this.repeatCountLeft > 0) {
                this.repeatCountLeft--;
                this.speakNext();
            } else {
                this.currentIndex++;
                this.speakNext();
            }
        });

        this.audioPlayer.addEventListener('error', () => {
            if (this.audioPlayer.src) {
                console.error('Audio playback error');
                this.stop();
            }
        });

        this.bindEvents();
        this.populateVoices();
        this.updateRateDisplays();
        this.updateRepeatButton();
        this.updateSkipKoreanCheckbox();
        if (this.repeatCountValueDisplay) this.repeatCountValueDisplay.textContent = this.repeatTimes;

        // 탭을 닫거나 다른 곳으로 이동할 때 남아있는 오디오 캐시(blob URL)를 정리해
        // 기기 저장공간에 불필요하게 남지 않게 한다. 배경 재생 중에는 방해하지 않도록
        // 실제로 페이지를 떠나는 pagehide에서만 정리한다(탭 전환/화면 끄기 제외).
        window.addEventListener('pagehide', () => this.revokeAllAudioCache());
    }

    bindEvents() {
        const toggleHandler = () => this.toggle();
        const stopHandler = () => this.stop();

        if (this.toggleBtn) this.toggleBtn.addEventListener('click', toggleHandler);
        if (this.headerToggleBtn) this.headerToggleBtn.addEventListener('click', toggleHandler);

        if (this.stopBtn) this.stopBtn.addEventListener('click', stopHandler);
        if (this.headerStopBtn) this.headerStopBtn.addEventListener('click', stopHandler);

        if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prevSentence());
        if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextSentence());

        if (this.rateEnIncreaseBtn) this.rateEnIncreaseBtn.addEventListener('click', () => this.updateRate('en', 0.05));
        if (this.rateEnDecreaseBtn) this.rateEnDecreaseBtn.addEventListener('click', () => this.updateRate('en', -0.05));
        if (this.rateKoIncreaseBtn) this.rateKoIncreaseBtn.addEventListener('click', () => this.updateRate('ko', 0.05));
        if (this.rateKoDecreaseBtn) this.rateKoDecreaseBtn.addEventListener('click', () => this.updateRate('ko', -0.05));

        if (this.repeatEnBtn) this.repeatEnBtn.addEventListener('click', () => this.toggleRepeatEnglish());

        if (this.sizeIncreaseBtn) this.sizeIncreaseBtn.addEventListener('click', () => this.updateSize(10));
        if (this.sizeDecreaseBtn) this.sizeDecreaseBtn.addEventListener('click', () => this.updateSize(-10));

        if (this.voiceSelect) {
            this.voiceSelect.addEventListener('change', () => {
                this.voice = this.voiceSelect.value;
                localStorage.setItem('supertonic_voice', this.voice);
                this.audioCache = {};
            });
        }

        if (this.fmtSelect) {
            this.fmtSelect.addEventListener('change', () => {
                this.fmt = this.fmtSelect.value;
                localStorage.setItem('supertonic_fmt', this.fmt);
                this.audioCache = {};
            });
        }

        if (this.settingsOpenBtn) this.settingsOpenBtn.addEventListener('click', () => this.openSettings());
        if (this.settingsCloseBtn) this.settingsCloseBtn.addEventListener('click', () => this.closeSettings());
        if (this.settingsRefreshBtn) this.settingsRefreshBtn.addEventListener('click', () => this.hardRefresh());
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.settingsModal) this.closeSettings();
            });
        }

        if (this.repeatEnCheckbox) {
            this.repeatEnCheckbox.addEventListener('change', () => this.toggleRepeatEnglish());
        }

        if (this.skipKoreanCheckbox) {
            this.skipKoreanCheckbox.addEventListener('change', () => this.toggleSkipKorean());
        }

        if (this.repeatCountIncreaseBtn) this.repeatCountIncreaseBtn.addEventListener('click', () => this.updateRepeatTimes(1));
        if (this.repeatCountDecreaseBtn) this.repeatCountDecreaseBtn.addEventListener('click', () => this.updateRepeatTimes(-1));

        if (this.serverSaveBtn) {
            this.serverSaveBtn.addEventListener('click', () => this.saveServerSettings());
        }
    }

    openSettings() {
        if (!this.settingsModal) return;
        if (this.serverUrlInput) this.serverUrlInput.value = this.serverUrl;
        if (this.serverTokenInput) this.serverTokenInput.value = this.token;
        this.settingsModal.classList.remove('hidden');
    }

    closeSettings() {
        if (this.settingsModal) this.settingsModal.classList.add('hidden');
    }

    // 아이폰 홈 화면 앱은 새 배포 후에도 캐시된 페이지를 계속 띄우는 경우가 많아,
    // 쿼리스트링으로 URL을 바꿔 강제로 네트워크에서 새로 받아오게 한다
    async hardRefresh() {
        const icon = this.settingsRefreshBtn?.querySelector('svg');
        if (icon) icon.classList.add('spinning');

        // 지금 읽던 글과 위치를 저장해 두었다가, 새로고침 후 이어서 볼 수 있게 한다
        try {
            localStorage.setItem('pending_markdown', editor.value);
            if (this.sentences.length > 0) {
                localStorage.setItem('pending_resume_index', String(this.currentIndex));
            } else {
                localStorage.removeItem('pending_resume_index');
            }
        } catch (e) { /* ignore */ }

        try {
            if (window.caches) {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
            }
        } catch (e) { /* ignore */ }
        const url = new URL(window.location.href);
        url.searchParams.set('_r', Date.now());
        window.location.replace(url.toString());
    }

    saveServerSettings() {
        const url = (this.serverUrlInput?.value || '').trim().replace(/\/$/, '');
        const token = (this.serverTokenInput?.value || '').trim();
        if (!url) return;
        this.serverUrl = url;
        this.token = token;
        localStorage.setItem('supertonic_url', this.serverUrl);
        localStorage.setItem('supertonic_token', this.token);
        this.audioCache = {};
        this.closeSettings();
    }

    populateVoices() {
        if (!this.voiceSelect) return;
        this.voiceSelect.innerHTML = '';
        SUPERTONIC_VOICES.forEach(v => {
            const option = document.createElement('option');
            option.textContent = v;
            option.value = v;
            this.voiceSelect.appendChild(option);
        });
        this.voiceSelect.value = SUPERTONIC_VOICES.includes(this.voice) ? this.voice : 'M1';
        if (this.fmtSelect) this.fmtSelect.value = this.fmt;
    }


    synthUrl(text) {
        return `${this.serverUrl}/synth?token=${encodeURIComponent(this.token)}` +
            `&voice=${encodeURIComponent(this.voice)}&fmt=${encodeURIComponent(this.fmt)}` +
            `&text=${encodeURIComponent(text)}`;
    }

    cleanTextForTTS(text) {
        return text.replace(/[*#`_\[\]]/g, '').trim();
    }

    localSplitSentences(text) {
        return (text.match(/[^.!?\n]+[.!?\n\s]*|[^.!?\n]+$/g) || [])
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }

    async splitIntoSentences(text) {
        // 서버의 문장 분리(/chunks)를 우선 사용, 실패 시 로컬 분리로 폴백
        try {
            const r = await fetch(`${this.serverUrl}/chunks?token=${encodeURIComponent(this.token)}&text=${encodeURIComponent(text)}`);
            if (r.ok) {
                const chunks = await r.json();
                if (Array.isArray(chunks) && chunks.length > 0) return chunks;
            }
        } catch (e) {
            console.warn('서버 문장 분리 실패, 로컬 분리 사용', e);
        }
        return this.localSplitSentences(text);
    }

    // 서버 연결 워밍업/일시적 지연(다른 앱과 동시 사용, 엔진 콜드 스타트 등)에 대비해
    // 점점 더 오래 기다리며 재시도한다
    async fetchAudioWithRetry(text, index, delays = [500, 1000, 2000, 4000]) {
        for (let attempt = 0; attempt <= delays.length; attempt++) {
            try {
                const r = await fetch(this.synthUrl(text));
                if (r.ok) {
                    const b = await r.blob();
                    return URL.createObjectURL(b);
                }
                this.lastFetchError = `HTTP ${r.status}`;
            } catch (e) {
                this.lastFetchError = e?.message || '네트워크 오류';
            }
            if (attempt < delays.length) {
                if (index === this.currentIndex && this.sentenceCounter) {
                    this.sentenceCounter.textContent = `재시도 중... (${attempt + 1}/${delays.length})`;
                }
                await new Promise(res => setTimeout(res, delays[attempt]));
            }
        }
        return null;
    }

    prefetch(index) {
        if (index < 0 || index >= this.sentences.length) return;
        if (this.audioCache[index]) return;
        const text = this.cleanTextForTTS(this.sentences[index]);
        if (!text) { this.audioCache[index] = Promise.resolve(null); return; }
        this.audioCache[index] = this.fetchAudioWithRetry(text, index);
    }

    // 이미 재생을 마친 오래된 문장의 오디오(blob URL)는 계속 들고 있을 필요가 없다.
    // 긴 글을 처음부터 끝까지 재생하는 동안 캐시가 무한정 쌓여 기기 저장공간을
    // 갉아먹지 않도록, 현재 위치보다 충분히 앞선 항목은 그때그때 해제한다.
    trimAudioCache(currentIndex, keepBehind = 2) {
        Object.keys(this.audioCache).forEach(key => {
            const idx = parseInt(key, 10);
            if (idx < currentIndex - keepBehind) {
                Promise.resolve(this.audioCache[idx]).then(u => u && URL.revokeObjectURL(u));
                delete this.audioCache[idx];
            }
        });
    }

    // 탭을 닫거나 다른 페이지로 이동할 때 아직 재생하지 않은 캐시까지 확실히 정리한다
    revokeAllAudioCache() {
        Object.values(this.audioCache).forEach(p => Promise.resolve(p).then(u => u && URL.revokeObjectURL(u)));
        this.audioCache = {};
    }

    // 미리보기의 모든 텍스트 노드를 순서대로 이어붙였을 때의 위치(flat offset) 기준으로
    // 각 노드의 시작/끝 범위를 계산한다. 문장이 반복되는 문서에서 항상 문서 맨 앞부터
    // 찾으면 엉뚱한(더 앞쪽의) 동일 문구를 강조하게 되므로, 직전 강조 위치 이후부터
    // 우선 탐색하고, 찾지 못했을 때만(예: 이전 문장으로 이동) 처음부터 다시 찾는다.
    findSentenceRange(cleanText) {
        const walker = document.createTreeWalker(this.previewPane, NodeFilter.SHOW_TEXT, null, false);
        const nodes = [];
        let node;
        let flatStart = 0;
        while (node = walker.nextNode()) {
            const len = node.nodeValue.length;
            nodes.push({ node, flatStart });
            flatStart += len;
        }

        const resumeFrom = this.lastHighlightFlatOffset || 0;

        for (const { node, flatStart } of nodes) {
            const localStart = Math.max(0, resumeFrom - flatStart);
            if (localStart >= node.nodeValue.length) continue;
            const idx = node.nodeValue.indexOf(cleanText, localStart);
            if (idx !== -1) return { node, index: idx, flatIndex: flatStart + idx };
        }

        // 폴백: 직전 위치 이후에서 못 찾으면 문서 전체에서 다시 탐색 (뒤로 가기 등)
        for (const { node, flatStart } of nodes) {
            const idx = node.nodeValue.indexOf(cleanText);
            if (idx !== -1) return { node, index: idx, flatIndex: flatStart + idx };
        }

        return null;
    }

    highlightSentence(text) {
        const highlights = document.querySelectorAll('.highlight-sentence');
        highlights.forEach(el => {
            const parent = el.parentNode;
            parent.replaceChild(document.createTextNode(el.innerText), el);
            parent.normalize();
        });

        if (!text) return;
        const cleanText = text.trim();
        if (!cleanText) return;

        const match = this.findSentenceRange(cleanText);
        if (!match) return;

        const { node, index } = match;
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + cleanText.length);

        const span = document.createElement('span');
        span.className = 'highlight-sentence';
        range.surroundContents(span);

        span.scrollIntoView({ behavior: 'smooth', block: 'center' });

        this.lastHighlightFlatOffset = match.flatIndex + cleanText.length;
    }

    updateRate(lang, change) {
        const clamp = v => Math.max(0.5, Math.min(2.0, parseFloat(v.toFixed(2))));
        if (lang === 'en') {
            this.rateEn = clamp(this.rateEn + change);
            localStorage.setItem('rate_en', this.rateEn);
        } else {
            this.rateKo = clamp(this.rateKo + change);
            localStorage.setItem('rate_ko', this.rateKo);
        }
        this.updateRateDisplays();

        const current = this.sentences[this.currentIndex];
        if (current) {
            this.audioPlayer.playbackRate = isEnglishSentence(current) ? this.rateEn : this.rateKo;
        }
    }

    updateRateDisplays() {
        if (this.rateEnValueDisplay) this.rateEnValueDisplay.textContent = this.rateEn.toFixed(2);
        if (this.rateKoValueDisplay) this.rateKoValueDisplay.textContent = this.rateKo.toFixed(2);
    }

    toggleRepeatEnglish() {
        this.repeatEnglish = !this.repeatEnglish;
        localStorage.setItem('repeat_english', this.repeatEnglish);
        this.updateRepeatButton();
        this.repeatCountLeft = 0;
        this.lastSpokenIndex = -1;
    }

    updateRepeatButton() {
        if (this.repeatEnBtn) this.repeatEnBtn.classList.toggle('active', this.repeatEnglish);
        if (this.repeatEnCheckbox) this.repeatEnCheckbox.checked = this.repeatEnglish;
    }

    updateRepeatTimes(change) {
        this.repeatTimes = Math.max(1, Math.min(10, this.repeatTimes + change));
        localStorage.setItem('repeat_times', this.repeatTimes);
        if (this.repeatCountValueDisplay) this.repeatCountValueDisplay.textContent = this.repeatTimes;
        this.repeatCountLeft = 0;
    }

    toggleSkipKorean() {
        this.skipKorean = !this.skipKorean;
        localStorage.setItem('skip_korean', this.skipKorean);
        this.updateSkipKoreanCheckbox();
        this.rebuildPlaylist();
    }

    updateSkipKoreanCheckbox() {
        if (this.skipKoreanCheckbox) this.skipKoreanCheckbox.checked = this.skipKorean;
    }

    // allSentences로부터 재생 목록을 만든다. sentenceIndexMap[i]는 sentences[i]가
    // allSentences에서 원래 몇 번째였는지를 기록해, 필터링 후에도 위치를 추적할 수 있게 한다.
    buildPlaylist() {
        if (this.skipKorean) {
            this.sentences = [];
            this.sentenceIndexMap = [];
            this.allSentences.forEach((s, i) => {
                if (isEnglishSentence(s)) {
                    this.sentences.push(s);
                    this.sentenceIndexMap.push(i);
                }
            });
        } else {
            this.sentences = this.allSentences.slice();
            this.sentenceIndexMap = this.allSentences.map((_, i) => i);
        }
    }

    rebuildPlaylist() {
        if (!this.allSentences) return;
        // 재생 위치를 최대한 유지: 현재 읽던 지점 이후 가장 가까운 문장을 새 목록에서 찾는다
        const globalIndex = this.sentenceIndexMap[this.currentIndex] ?? 0;
        this.buildPlaylist();
        this.audioCache = {};
        this.repeatCountLeft = 0;
        this.lastSpokenIndex = -1;

        let newIndex = this.sentenceIndexMap.findIndex(gi => gi >= globalIndex);
        if (newIndex === -1) newIndex = Math.max(0, this.sentences.length - 1);
        this.currentIndex = newIndex;
        this.updateCounter();

        if (this.isPlaying) {
            this.audioPlayer.pause();
            if (this.sentences.length === 0) {
                if (this.sentenceCounter) this.sentenceCounter.textContent = '영어 문장 없음';
                this.stop();
                return;
            }
            this.isPaused = false;
            this.speakNext();
        }
    }

    updateSize(change) {
        this.textSize = Math.max(50, Math.min(200, this.textSize + change));
        this.sizeValueDisplay.textContent = `${this.textSize}%`;
        this.previewPane.style.fontSize = `${this.textSize}%`;
    }

    updateCounter() {
        if (this.sentenceCounter) {
            const total = this.sentences.length;
            const current = total > 0 ? this.currentIndex + 1 : 0;
            this.sentenceCounter.innerHTML =
                `<span class="counter-num">${current}</span><span class="counter-num">${total}</span>`;
        }
    }

    toggle() {
        if (this.isPlaying && !this.isPaused) {
            this.pause();
        } else {
            this.play();
        }
    }

    // iOS: 사용자 제스처 안에서 무음 재생으로 오디오를 한 번 잠금 해제해야
    // 이후 fetch(await) 뒤의 프로그램적 play()가 허용된다.
    unlockAudio() {
        if (this.audioUnlocked) return;
        const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
        this.audioPlayer.src = SILENT_WAV;
        const p = this.audioPlayer.play();
        if (p && p.then) p.then(() => { this.audioUnlocked = true; }).catch(() => {});
        else this.audioUnlocked = true;
    }

    async play() {
        if (this.isPaused) {
            this.resume();
            return;
        }

        if (this.isPlaying) return;

        if (isEditorMode) enterPreviewMode();

        this.stop();
        this.unlockAudio();

        // 에디터 모드에서는 미리보기가 숨겨져 innerText가 비므로 textContent로 폴백
        const textContent = this.previewPane.innerText || this.previewPane.textContent;
        if (this.sentenceCounter) this.sentenceCounter.textContent = '분석 중...';
        this.allSentences = await this.splitIntoSentences(textContent);
        this.buildPlaylist();

        if (this.sentences.length === 0) {
            if (this.sentenceCounter) this.sentenceCounter.textContent = this.skipKorean ? '영어 문장 없음' : '0 / 0';
            return;
        }

        this.audioCache = {};
        this.currentIndex = (typeof this.pendingResumeIndex === 'number' && this.pendingResumeIndex < this.sentences.length)
            ? this.pendingResumeIndex
            : 0;
        this.pendingResumeIndex = null;
        this.repeatCountLeft = 0;
        this.lastSpokenIndex = -1;
        this.isPlaying = true;
        this.isPaused = false;

        this.updateControls();
        this.updateCounter();
        this.speakNext();
    }

    async speakNext() {
        if (!this.isPlaying || this.isPaused) return;

        // 이전/다음을 연달아 빠르게 누르면 speakNext()가 겹쳐서 호출될 수 있다.
        // 매 호출마다 세대 번호를 새로 발급해, 뒤늦게 끝난 이전 호출이 최신 상태를
        // 덮어쓰지 않도록 한다(더 이상 유효하지 않으면 조용히 중단하고 stop()하지 않음).
        this.playToken = (this.playToken || 0) + 1;
        const myToken = this.playToken;

        if (this.currentIndex >= this.sentences.length) {
            // 한글을 건너뛰는 짧은 연습 목록일 때만 끝에서 처음으로 되돌아간다
            if (this.skipKorean && this.sentences.length > 0) {
                this.currentIndex = 0;
            } else {
                this.stop();
                return;
            }
        }

        const index = this.currentIndex;
        const sentence = this.sentences[index];
        if (!sentence || !this.cleanTextForTTS(sentence)) {
            this.currentIndex++;
            this.speakNext();
            return;
        }

        this.trimAudioCache(index);

        // 새 문장으로 넘어갈 때만 반복 횟수를 다시 채운다 (같은 문장 반복 중엔 유지)
        // 반복은 영어 문장에만 적용되고, 한글 문장은 항상 한 번만 읽는다
        if (index !== this.lastSpokenIndex) {
            this.repeatCountLeft = (this.repeatEnglish && isEnglishSentence(sentence)) ? this.repeatTimes - 1 : 0;
            this.lastSpokenIndex = index;
        }

        this.highlightSentence(sentence);
        this.updateCounter();

        this.prefetch(index);
        this.prefetch(index + 1);

        try {
            const src = await this.audioCache[index];
            if (myToken !== this.playToken || !this.isPlaying || this.isPaused) return;
            if (!src) throw new Error('음성 합성 실패');

            this.audioPlayer.src = src;
            this.audioPlayer.playbackRate = isEnglishSentence(sentence) ? this.rateEn : this.rateKo;
            await this.audioPlayer.play();
            if (myToken !== this.playToken) return;
            this.prefetch(index + 1);
            this.prefetch(index + 2);
        } catch (e) {
            // 더 최신 탐색(다음/이전 연타 등)이 이 재생을 가로챈 것이므로 정상적인 중단이다
            if (myToken !== this.playToken || e?.name === 'AbortError') return;
            console.error('TTS Error:', e, this.lastFetchError);
            const detail = this.lastFetchError ? ` (${this.lastFetchError})` : '';
            this.stop();
            if (this.sentenceCounter) this.sentenceCounter.textContent = `서버 연결 실패${detail}`;
        }
    }

    pause() {
        if (this.isPlaying && !this.isPaused) {
            this.audioPlayer.pause();
            this.isPaused = true;
            this.updateControls();
        }
    }

    resume() {
        if (this.isPlaying && this.isPaused) {
            this.audioPlayer.play().catch(e => console.error(e));
            this.isPaused = false;
            this.updateControls();
        }
    }

    stop() {
        this.audioPlayer.pause();
        this.audioPlayer.removeAttribute('src');
        this.revokeAllAudioCache();
        this.isPlaying = false;
        this.isPaused = false;
        this.currentIndex = 0;
        this.lastHighlightFlatOffset = 0;
        this.highlightSentence(null);
        this.updateControls();
        if (this.sentenceCounter) this.sentenceCounter.textContent = "0 / 0";
    }

    nextSentence() {
        if (!this.isPlaying) return;
        this.audioPlayer.pause();
        if (this.currentIndex < this.sentences.length - 1) {
            this.currentIndex++;
        } else if (this.skipKorean) {
            this.currentIndex = 0;
        } else {
            this.stop();
            return;
        }
        this.isPaused = false;
        this.updateControls();
        this.speakNext();
    }

    prevSentence() {
        if (!this.isPlaying) return;
        this.audioPlayer.pause();
        if (this.currentIndex > 0) this.currentIndex--;
        // 뒤로 이동하면 목표 문장이 직전 강조 위치보다 앞에 있으므로 처음부터 다시 찾는다
        this.lastHighlightFlatOffset = 0;
        this.isPaused = false;
        this.updateControls();
        this.speakNext();
    }

    updateControls() {
        const isPlayingOrPaused = this.isPlaying;
        const isPaused = this.isPaused;

        const playIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
        `;

        const pauseIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
        `;

        if (this.toggleBtn) {
            if (isPlayingOrPaused && !isPaused) {
                this.toggleBtn.innerHTML = pauseIcon;
                this.toggleBtn.title = "Pause";
            } else {
                this.toggleBtn.innerHTML = playIcon;
                this.toggleBtn.title = "Play";
            }
        }

        if (this.headerToggleBtn) {
            if (isPlayingOrPaused && !isPaused) {
                this.headerToggleBtn.innerHTML = pauseIcon;
                this.headerToggleBtn.title = "Pause";
            } else {
                this.headerToggleBtn.innerHTML = playIcon;
                this.headerToggleBtn.title = "Play";
            }
        }

        if (this.stopBtn) {
            this.stopBtn.disabled = !isPlayingOrPaused;
        }
        if (this.headerStopBtn) {
            this.headerStopBtn.disabled = !isPlayingOrPaused;
        }
    }
}

// Initialize
// iOS 단축어 등에서 ?text=로 공유된 내용이 있으면 최우선으로 사용(다른 복원 상태는 무시)
const urlParams = new URLSearchParams(location.search);
const sharedText = urlParams.get('text');
const hasSharedText = sharedText !== null && sharedText.trim() !== '';

// 단축어 URL에 ?token=, ?server=를 심어두면 매번 설정에서 입력할 필요 없이 자동 저장된다
const sharedToken = urlParams.get('token');
const sharedServer = urlParams.get('server');
if (sharedToken !== null && sharedToken.trim() !== '') {
    localStorage.setItem('supertonic_token', sharedToken.trim());
}
if (sharedServer !== null && sharedServer.trim() !== '') {
    localStorage.setItem('supertonic_url', sharedServer.trim().replace(/\/$/, ''));
}
if (urlParams.has('token') || urlParams.has('server')) {
    const cleanParams = new URLSearchParams(location.search);
    cleanParams.delete('token');
    cleanParams.delete('server');
    const cleanQuery = cleanParams.toString();
    window.history.replaceState({}, '', location.pathname + (cleanQuery ? `?${cleanQuery}` : ''));
}

if (hasSharedText) {
    localStorage.removeItem('pending_markdown');
    localStorage.removeItem('pending_resume_index');
    window.history.replaceState({}, '', location.pathname);
    editor.value = sharedText;
} else {
    // 새로고침(설정 > 새로고침) 전에 저장해 둔 내용이 있으면 이어서 복원한다
    const pendingMarkdown = localStorage.getItem('pending_markdown');
    if (pendingMarkdown !== null) {
        editor.value = pendingMarkdown;
        localStorage.removeItem('pending_markdown');
    } else {
        editor.value = initialMarkdown;
    }
}
updatePreview();
const ttsManager = new TTSManager();

if (hasSharedText) {
    enterPreviewMode();
} else {
    const pendingResumeIndex = localStorage.getItem('pending_resume_index');
    if (pendingResumeIndex !== null) {
        ttsManager.pendingResumeIndex = parseInt(pendingResumeIndex, 10);
        localStorage.removeItem('pending_resume_index');
        enterPreviewMode();

        // 실제 재생(네트워크 문장 분리)은 재생 버튼을 누를 때 다시 이뤄지지만,
        // 그 전에도 화면에 위치가 보이도록 로컬 분리로 미리 카운터/하이라이트를 맞춰둔다
        const previewText = preview.innerText || preview.textContent;
        const localSentences = ttsManager.localSplitSentences(previewText);
        const localPlaylist = ttsManager.skipKorean
            ? localSentences.filter(isEnglishSentence)
            : localSentences;
        if (ttsManager.pendingResumeIndex < localPlaylist.length) {
            ttsManager.sentences = localPlaylist;
            ttsManager.currentIndex = ttsManager.pendingResumeIndex;
            ttsManager.updateCounter();
            ttsManager.highlightSentence(localPlaylist[ttsManager.pendingResumeIndex]);
        }
    }
}
