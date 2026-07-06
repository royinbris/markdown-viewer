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
            let tableMarkdown = '| Key | Value |\n|---|---|\n';

            for (const line of lines) {
                const colonIndex = line.indexOf(':');
                if (colonIndex !== -1) {
                    const key = line.slice(0, colonIndex).trim();
                    let value = line.slice(colonIndex + 1).trim();
                    if (value.startsWith('http')) {
                        value = `<a href="${value}" target="_blank" rel="noopener noreferrer">${value}</a>`;
                    }
                    tableMarkdown += `| **${key}** | ${value} |\n`;
                }
            }
            return tableMarkdown + '\n' + content;
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

// TTS Implementation (Dual Engine: Supertonic3 & Web Speech API)
class TTSManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.audioPlayer = new Audio();
        this.sentences = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.utterance = null;
        
        this.isSupertonic = true; // default to supertonic if available
        this.selectedVoice = null;

        // Settings
        this.rate = 1.0;
        this.pitch = 1.0;
        this.textSize = 100; // percent

        // Controls
        this.toggleBtn = document.getElementById('footer-toggle');
        this.toggleIcon = document.getElementById('footer-toggle-icon');
        this.stopBtn = document.getElementById('footer-stop');
        this.prevBtn = document.getElementById('tts-prev');
        this.nextBtn = document.getElementById('tts-next');

        // Header controls (Sync)
        this.headerToggleBtn = document.getElementById('tts-toggle');
        this.headerToggleIcon = document.getElementById('tts-toggle-icon');
        this.headerStopBtn = document.getElementById('tts-stop');

        // Settings Controls
        this.rateIncreaseBtn = document.getElementById('rate-increase');
        this.rateDecreaseBtn = document.getElementById('rate-decrease');
        this.rateValueDisplay = document.getElementById('rate-value');

        this.pitchIncreaseBtn = document.getElementById('pitch-increase');
        this.pitchDecreaseBtn = document.getElementById('pitch-decrease');
        this.pitchValueDisplay = document.getElementById('pitch-value');

        this.sizeIncreaseBtn = document.getElementById('size-increase');
        this.sizeDecreaseBtn = document.getElementById('size-decrease');
        this.sizeValueDisplay = document.getElementById('size-value');

        this.sentenceCounter = document.getElementById('sentence-counter');
        this.previewPane = document.getElementById('preview-output');
        this.voiceSelect = document.getElementById('voice-select');

        this.audioPlayer.addEventListener('ended', () => {
            if (this.isPlaying && !this.isPaused && this.isSupertonic) {
                this.currentIndex++;
                this.speakNext();
            }
        });

        this.audioPlayer.addEventListener('error', (e) => {
            console.error('Audio playback error', e);
            this.stop();
        });

        this.bindEvents();
        this.loadVoices();
        
        window.onbeforeunload = () => {
            this.synth.cancel();
        };
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

        if (this.rateIncreaseBtn) this.rateIncreaseBtn.addEventListener('click', () => this.updateRate(0.1));
        if (this.rateDecreaseBtn) this.rateDecreaseBtn.addEventListener('click', () => this.updateRate(-0.1));

        if (this.pitchIncreaseBtn) this.pitchIncreaseBtn.addEventListener('click', () => this.updatePitch(0.1));
        if (this.pitchDecreaseBtn) this.pitchDecreaseBtn.addEventListener('click', () => this.updatePitch(-0.1));

        if (this.sizeIncreaseBtn) this.sizeIncreaseBtn.addEventListener('click', () => this.updateSize(10));
        if (this.sizeDecreaseBtn) this.sizeDecreaseBtn.addEventListener('click', () => this.updateSize(-10));

        if (this.voiceSelect) {
            this.voiceSelect.addEventListener('change', () => this.updateVoice());
        }
    }

    async loadVoices() {
        if (!this.voiceSelect) return;
        
        const populateSelect = (supertonicVoices, nativeVoices) => {
            // Retain previous selection if any
            const previousValue = this.voiceSelect.value;
            
            this.voiceSelect.innerHTML = '';
            
            // Supertonic group
            const stGroup = document.createElement('optgroup');
            stGroup.label = 'Supertonic 3 (AI)';
            supertonicVoices.forEach(voice => {
                const option = document.createElement('option');
                option.textContent = voice;
                option.value = 'st:' + voice;
                stGroup.appendChild(option);
            });
            if (stGroup.children.length > 0) {
                this.voiceSelect.appendChild(stGroup);
            }

            // Native group
            const nativeGroup = document.createElement('optgroup');
            nativeGroup.label = '브라우저 기본 음성';
            nativeVoices.forEach((voice, index) => {
                const option = document.createElement('option');
                option.textContent = `${voice.name} (${voice.lang})`;
                option.value = 'nt:' + index;
                nativeGroup.appendChild(option);
            });
            if (nativeGroup.children.length > 0) {
                this.voiceSelect.appendChild(nativeGroup);
            }
            
            if (previousValue && this.voiceSelect.querySelector(`option[value="${previousValue}"]`)) {
                this.voiceSelect.value = previousValue;
            } else if (stGroup.children.length > 0) {
                this.voiceSelect.value = stGroup.children[0].value;
            } else if (nativeGroup.children.length > 0) {
                // Pre-select a Korean voice if possible
                let koIdx = Array.from(nativeGroup.children).findIndex(opt => opt.textContent.includes('ko') || opt.textContent.includes('KO'));
                if (koIdx !== -1) {
                    this.voiceSelect.value = nativeGroup.children[koIdx].value;
                } else {
                    this.voiceSelect.value = nativeGroup.children[0].value;
                }
            }
            
            this.updateVoice();
        };

        let supertonicVoices = [];
        try {
            const res = await fetch('/api/voices');
            const data = await res.json();
            if (data.ok && data.voices) {
                supertonicVoices = data.voices;
            }
        } catch (e) {
            console.error('Failed to load Supertonic3 voices', e);
        }

        const nativeVoices = this.synth.getVoices();
        populateSelect(supertonicVoices, nativeVoices);

        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => {
                const newNativeVoices = this.synth.getVoices();
                populateSelect(supertonicVoices, newNativeVoices);
            };
        }
    }

    updateVoice() {
        const val = this.voiceSelect.value;
        if (!val) {
            this.isSupertonic = false;
            this.selectedVoice = null;
            return;
        }
        
        if (val.startsWith('st:')) {
            this.isSupertonic = true;
            this.selectedVoice = val.substring(3);
        } else if (val.startsWith('nt:')) {
            this.isSupertonic = false;
            const idx = parseInt(val.substring(3), 10);
            this.selectedVoice = this.synth.getVoices()[idx] || null;
        }
    }

    cleanTextForTTS(text) {
        return text.replace(/[*#`_\[\]]/g, '').trim();
    }

    splitIntoSentences(text) {
        return (text.match(/[^.!?\n]+[.!?\n\s]*|[^.!?\n]+$/g) || [])
            .map(s => s.trim())
            .filter(s => s.length > 0);
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

    updateRate(change) {
        this.rate = Math.max(0.5, Math.min(2.0, parseFloat((this.rate + change).toFixed(1))));
        this.rateValueDisplay.textContent = this.rate.toFixed(1);
        this.audioPlayer.playbackRate = this.rate;
    }

    updatePitch(change) {
        this.pitch = Math.max(0.1, Math.min(2.0, parseFloat((this.pitch + change).toFixed(1))));
        this.pitchValueDisplay.textContent = this.pitch.toFixed(1);
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

    play() {
        if (this.isPaused) {
            this.resume();
            return;
        }

        if (this.isPlaying) return;

        this.stop();

        const textContent = this.previewPane.innerText;
        this.sentences = this.splitIntoSentences(textContent);

        if (this.sentences.length === 0) return;

        this.currentIndex = 0;
        this.isPlaying = true;
        this.isPaused = false;

        this.updateControls();
        this.updateCounter();

        setTimeout(() => {
            this.speakNext();
        }, 50);
    }

    async speakNext() {
        if (!this.isPlaying || this.isPaused) return;

        if (this.currentIndex >= this.sentences.length) {
            this.stop();
            return;
        }

        const sentence = this.sentences[this.currentIndex];
        if (!sentence || sentence.trim().length === 0) {
            this.currentIndex++;
            this.speakNext();
            return;
        }

        this.highlightSentence(sentence);
        this.updateCounter();

        const cleanText = this.cleanTextForTTS(sentence);
        
        if (this.isSupertonic) {
            try {
                const response = await fetch('/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: cleanText,
                        voice: this.selectedVoice,
                        speed: this.rate
                    })
                });

                if (!response.ok) throw new Error('TTS API failed');
                
                const data = await response.json();
                if (data.ok && data.audio_url) {
                    if (!this.isPlaying || this.isPaused) return;
                    
                    this.audioPlayer.src = data.audio_url;
                    this.audioPlayer.playbackRate = this.rate;
                    await this.audioPlayer.play();
                } else {
                    throw new Error(data.error || 'TTS generation failed');
                }
            } catch (e) {
                console.error('TTS Error:', e);
                this.stop();
            }
        } else {
            // Web Speech API fallback
            this.utterance = new SpeechSynthesisUtterance(cleanText);
            this.utterance.rate = this.rate;
            this.utterance.pitch = this.pitch;
            if (this.selectedVoice) {
                this.utterance.voice = this.selectedVoice;
            }

            this.utterance.onend = () => {
                if (this.isPlaying && !this.isPaused && !this.isSupertonic) {
                    this.currentIndex++;
                    setTimeout(() => this.speakNext(), 10);
                }
            };

            this.utterance.onerror = (e) => {
                if (e.error === 'interrupted' || e.error === 'canceled') return;
                console.error('TTS Error:', e);
                this.stop();
            };

            this.synth.speak(this.utterance);
        }
    }

    pause() {
        if (this.isPlaying && !this.isPaused) {
            if (this.isSupertonic) {
                this.audioPlayer.pause();
            } else {
                this.synth.pause();
            }
            this.isPaused = true;
            this.updateControls();
        }
    }

    resume() {
        if (this.isPlaying && this.isPaused) {
            if (this.isSupertonic) {
                this.audioPlayer.play().catch(e => console.error(e));
            } else {
                this.synth.resume();
            }
            this.isPaused = false;
            this.updateControls();
        }
    }

    stop() {
        this.synth.cancel();
        this.audioPlayer.pause();
        this.audioPlayer.src = '';
        this.isPlaying = false;
        this.isPaused = false;
        this.currentIndex = 0;
        this.highlightSentence(null);
        this.updateControls();
        if (this.sentenceCounter) this.sentenceCounter.textContent = "0 / 0";
    }

    nextSentence() {
        if (!this.isPlaying) return;
        this.synth.cancel();
        this.audioPlayer.pause();
        if (this.currentIndex < this.sentences.length - 1) {
            this.currentIndex++;
            setTimeout(() => this.speakNext(), 50);
        } else {
            this.stop();
        }
    }

    prevSentence() {
        if (!this.isPlaying) return;
        this.synth.cancel();
        this.audioPlayer.pause();
        if (this.currentIndex > 0) {
            this.currentIndex--;
            setTimeout(() => this.speakNext(), 50);
        } else {
            setTimeout(() => this.speakNext(), 50);
        }
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
