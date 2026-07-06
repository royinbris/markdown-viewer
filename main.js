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
const viewToggleBtn = document.getElementById('view-toggle-btn');
const splitContainer = document.querySelector('.split-container');

let isEditorMode = true;
splitContainer.classList.add('editor-mode');

viewToggleBtn.addEventListener('click', () => {
    isEditorMode = !isEditorMode;
    if (isEditorMode) {
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
    } else {
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
        this.allSentences = null;
        this.audioCache = {};
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.repeatEnglish = localStorage.getItem('repeat_english') === 'true';
        this.repeatTimes = Math.max(1, parseInt(localStorage.getItem('repeat_times'), 10) || 2);
        this.repeatCountLeft = 0;
        this.lastSpokenIndex = -1;

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

        this.sentenceCounter = document.getElementById('sentence-counter');
        this.previewPane = document.getElementById('preview-output');
        this.voiceSelect = document.getElementById('voice-select');
        this.fmtSelect = document.getElementById('fmt-select');

        // Settings modal
        this.settingsModal = document.getElementById('settings-modal');
        this.settingsOpenBtn = document.getElementById('settings-open-btn');
        this.settingsCloseBtn = document.getElementById('settings-close-btn');
        this.repeatEnCheckbox = document.getElementById('repeat-en-checkbox');
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
        if (this.repeatCountValueDisplay) this.repeatCountValueDisplay.textContent = this.repeatTimes;
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

        if (this.rateEnIncreaseBtn) this.rateEnIncreaseBtn.addEventListener('click', () => this.updateRate('en', 0.1));
        if (this.rateEnDecreaseBtn) this.rateEnDecreaseBtn.addEventListener('click', () => this.updateRate('en', -0.1));
        if (this.rateKoIncreaseBtn) this.rateKoIncreaseBtn.addEventListener('click', () => this.updateRate('ko', 0.1));
        if (this.rateKoDecreaseBtn) this.rateKoDecreaseBtn.addEventListener('click', () => this.updateRate('ko', -0.1));

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
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.settingsModal) this.closeSettings();
            });
        }

        if (this.repeatEnCheckbox) {
            this.repeatEnCheckbox.addEventListener('change', () => this.toggleRepeatEnglish());
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
        return (text.match(/[^.!?\n]+[.!?\n\s]*|[^.!?\n]+$/g) || [])
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }

    prefetch(index) {
        if (index < 0 || index >= this.sentences.length) return;
        if (this.audioCache[index]) return;
        const text = this.cleanTextForTTS(this.sentences[index]);
        if (!text) { this.audioCache[index] = Promise.resolve(null); return; }
        this.audioCache[index] = fetch(this.synthUrl(text))
            .then(r => r.ok ? r.blob() : null)
            .then(b => b ? URL.createObjectURL(b) : null)
            .catch(() => null);
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

        const walker = document.createTreeWalker(this.previewPane, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walker.nextNode()) {
            const index = node.nodeValue.indexOf(cleanText);
            if (index !== -1) {
                const range = document.createRange();
                range.setStart(node, index);
                range.setEnd(node, index + cleanText.length);

                const span = document.createElement('span');
                span.className = 'highlight-sentence';
                range.surroundContents(span);

                span.scrollIntoView({ behavior: 'smooth', block: 'center' });
                break;
            }
        }
    }

    updateRate(lang, change) {
        const clamp = v => Math.max(0.5, Math.min(2.0, parseFloat(v.toFixed(1))));
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
        if (this.rateEnValueDisplay) this.rateEnValueDisplay.textContent = this.rateEn.toFixed(1);
        if (this.rateKoValueDisplay) this.rateKoValueDisplay.textContent = this.rateKo.toFixed(1);
    }

    toggleRepeatEnglish() {
        this.repeatEnglish = !this.repeatEnglish;
        localStorage.setItem('repeat_english', this.repeatEnglish);
        this.updateRepeatButton();
        this.rebuildPlaylist();
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

    rebuildPlaylist() {
        if (!this.allSentences) return;
        // 재생 위치를 최대한 유지: 현재 읽던 문장을 새 목록에서 다시 찾는다
        const currentText = this.sentences[this.currentIndex];
        this.sentences = this.repeatEnglish
            ? this.allSentences.filter(isEnglishSentence)
            : this.allSentences;
        this.audioCache = {};
        this.repeatCountLeft = 0;
        this.lastSpokenIndex = -1;
        const foundIndex = currentText ? this.sentences.indexOf(currentText) : -1;
        this.currentIndex = foundIndex !== -1 ? foundIndex : 0;
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
            this.sentenceCounter.textContent = `${current} / ${total}`;
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

        this.stop();
        this.unlockAudio();

        // 에디터 모드에서는 미리보기가 숨겨져 innerText가 비므로 textContent로 폴백
        const textContent = this.previewPane.innerText || this.previewPane.textContent;
        if (this.sentenceCounter) this.sentenceCounter.textContent = '분석 중...';
        this.allSentences = await this.splitIntoSentences(textContent);
        this.sentences = this.repeatEnglish
            ? this.allSentences.filter(isEnglishSentence)
            : this.allSentences;

        if (this.sentences.length === 0) {
            if (this.sentenceCounter) this.sentenceCounter.textContent = this.repeatEnglish ? '영어 문장 없음' : '0 / 0';
            return;
        }

        this.audioCache = {};
        this.currentIndex = 0;
        this.isPlaying = true;
        this.isPaused = false;

        this.updateControls();
        this.updateCounter();
        this.speakNext();
    }

    async speakNext() {
        if (!this.isPlaying || this.isPaused) return;

        if (this.currentIndex >= this.sentences.length) {
            if (this.repeatEnglish && this.sentences.length > 0) {
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

        // 새 문장으로 넘어갈 때만 반복 횟수를 다시 채운다 (같은 문장 반복 중엔 유지)
        if (index !== this.lastSpokenIndex) {
            this.repeatCountLeft = this.repeatEnglish ? this.repeatTimes - 1 : 0;
            this.lastSpokenIndex = index;
        }

        this.highlightSentence(sentence);
        this.updateCounter();

        this.prefetch(index);
        this.prefetch(index + 1);

        try {
            const src = await this.audioCache[index];
            if (!this.isPlaying || this.isPaused || this.currentIndex !== index) return;
            if (!src) throw new Error('음성 합성 실패');

            this.audioPlayer.src = src;
            this.audioPlayer.playbackRate = isEnglishSentence(sentence) ? this.rateEn : this.rateKo;
            await this.audioPlayer.play();
            this.prefetch(index + 1);
            this.prefetch(index + 2);
        } catch (e) {
            console.error('TTS Error:', e);
            this.stop();
            if (this.sentenceCounter) this.sentenceCounter.textContent = '서버 연결 실패';
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
        Object.values(this.audioCache).forEach(p => Promise.resolve(p).then(u => u && URL.revokeObjectURL(u)));
        this.audioCache = {};
        this.isPlaying = false;
        this.isPaused = false;
        this.currentIndex = 0;
        this.highlightSentence(null);
        this.updateControls();
        if (this.sentenceCounter) this.sentenceCounter.textContent = "0 / 0";
    }

    nextSentence() {
        if (!this.isPlaying) return;
        this.audioPlayer.pause();
        if (this.currentIndex < this.sentences.length - 1) {
            this.currentIndex++;
        } else if (this.repeatEnglish) {
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
editor.value = initialMarkdown;
updatePreview();
const ttsManager = new TTSManager();
