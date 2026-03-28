// ─────────────────────────────────────────────────────────────────────────────
// speech.js — Voice input (STT) and read-aloud (TTS) via Web Speech API
//
// STT: SpeechRecognition — mic button injected into .input-wrap
//   Click once to start, click again (or wait for silence) to stop.
//   Final transcript is auto-sent via the onFinalTranscript callback.
//
// TTS: SpeechSynthesis — speak button injected into each agent message header
//   Added by addSpeakButton() after streaming finishes (called from typewriter.js).
//   Click to play, click again to stop.
//
// Both features degrade silently when the API isn't available.
// ─────────────────────────────────────────────────────────────────────────────

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const SS = window.speechSynthesis;

let recognition = null;
let isListening = false;

// ── Mic icon SVG ──────────────────────────────────────────────────────────────

const MIC_ICON = `
  <svg class="icon-mic" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
    <rect x="9" y="2" width="6" height="13" rx="3"/>
    <path d="M5 10a7 7 0 0 0 14 0"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
    <line x1="8"  y1="22" x2="16" y2="22"/>
  </svg>
  <svg class="icon-stop-mic" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
    <rect x="6" y="6" width="12" height="12" rx="1"/>
  </svg>`;

// ── Speaker icon SVG ──────────────────────────────────────────────────────────

const SPEAK_ICON = `
  <svg class="icon-speak" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>
  <svg class="icon-stop-speak" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
    <rect x="6" y="6" width="12" height="12" rx="1"/>
  </svg>`;

// ── STT helpers ───────────────────────────────────────────────────────────────

const ERROR_HINTS = {
  network:     'Chrome requires internet for voice input. Try Safari for on-device recognition.',
  'not-allowed': 'Microphone access denied. Check System Settings → Privacy → Microphone.',
  'no-speech':   'No speech detected — try speaking closer to the mic.',
};

function showMicError(micBtn, errorCode) {
  const msg = ERROR_HINTS[errorCode] ?? `Voice input error: ${errorCode}`;
  micBtn.classList.add('error');
  micBtn.title = msg;
  // Flash the error class off after 3s, restore normal title
  setTimeout(() => {
    micBtn.classList.remove('error');
    micBtn.title = 'Voice input';
  }, 3000);
}

// ── STT ───────────────────────────────────────────────────────────────────────

function setupMicButton(onFinal) {
  const inputWrap = document.querySelector('.input-wrap');
  const sendBtn   = document.getElementById('send-btn');
  if (!inputWrap || !sendBtn) return;

  const micBtn  = document.createElement('button');
  micBtn.id     = 'mic-btn';
  micBtn.type   = 'button';
  micBtn.title  = SR ? 'Voice input' : 'Voice input not supported in this browser';
  micBtn.setAttribute('aria-label', 'Voice input');
  micBtn.innerHTML = MIC_ICON;

  if (!SR) micBtn.disabled = true;

  inputWrap.insertBefore(micBtn, sendBtn);
  if (!SR) return;

  micBtn.addEventListener('click', () => {
    if (isListening) {
      recognition?.stop();
    } else {
      startListening(micBtn, onFinal);
    }
  });
}

function startListening(micBtn, onFinal) {
  if (isListening) return;
  const input = document.getElementById('input');

  let gotFinal = false; // guards against Chrome's spurious post-success network error

  recognition = new SR();
  recognition.continuous     = false;
  recognition.interimResults = true;
  recognition.lang           = 'en-CA';

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add('recording');
  };

  recognition.onresult = e => {
    const transcript = Array.from(e.results)
      .map(r => r[0].transcript)
      .join('');
    input.value = transcript;
    input.dispatchEvent(new Event('input')); // trigger auto-resize

    if (e.results[e.results.length - 1].isFinal) {
      gotFinal = true;
      onFinal(transcript);
    }
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove('recording');
  };

  recognition.onerror = e => {
    // Chrome fires a spurious 'network' error after a successful recognition —
    // ignore it if we already received a final transcript.
    if (e.error === 'network' && gotFinal) return;
    isListening = false;
    micBtn.classList.remove('recording');
    console.warn('[speech] STT error:', e.error);
    showMicError(micBtn, e.error);
  };

  recognition.start();
}

// ── TTS ───────────────────────────────────────────────────────────────────────

function setupTTSListener() {
  document.getElementById('messages')?.addEventListener('click', e => {
    const btn = e.target.closest('.speak-btn');
    if (!btn || !SS) return;

    const body = btn.closest('.msg-agent')?.querySelector('.msg-agent-body');
    if (!body) return;

    // Toggle off if this button is already speaking
    if (btn.classList.contains('speaking')) {
      SS.cancel();
      btn.classList.remove('speaking');
      return;
    }

    // Stop anything already playing
    SS.cancel();
    document.querySelectorAll('.speak-btn.speaking')
      .forEach(b => b.classList.remove('speaking'));

    const utterance = new SpeechSynthesisUtterance(body.innerText);
    utterance.lang  = 'en-CA';
    utterance.rate  = 1.05;

    btn.classList.add('speaking');
    utterance.onend   = () => btn.classList.remove('speaking');
    utterance.onerror = () => btn.classList.remove('speaking');

    SS.speak(utterance);
  });
}

// ── Speak button — injected after streaming completes ─────────────────────────

/**
 * Appends a speak (TTS) button to the given .msg-agent element's header.
 * Called by typewriter.js after finalizeMessage() completes.
 * No-op when SpeechSynthesis is unavailable or button already exists.
 */
export function addSpeakButton(msgAgentEl) {
  if (!SS || !msgAgentEl) return;
  const header = msgAgentEl.querySelector('.msg-agent-header');
  if (!header || header.querySelector('.speak-btn')) return;

  const btn = document.createElement('button');
  btn.className = 'speak-btn';
  btn.type      = 'button';
  btn.title     = 'Read aloud';
  btn.setAttribute('aria-label', 'Read aloud');
  btn.innerHTML = SPEAK_ICON;
  header.appendChild(btn);
}

// ── Brave detection ───────────────────────────────────────────────────────────

async function isBrave() {
  return !!(navigator.brave && await navigator.brave.isBrave().catch(() => false));
}

// ── Init ──────────────────────────────────────────────────────────────────────

/**
 * Sets up the mic button (STT) and TTS delegated listener.
 * Mic button is skipped in Brave — SpeechRecognition exists but Brave blocks
 * the Google speech endpoint, making it non-functional.
 * TTS (read-aloud) is set up regardless since SpeechSynthesis works in Brave.
 * @param {function(string): void} onFinalTranscript - called with the final spoken text
 */
export async function initSpeech(onFinalTranscript) {
  if (!await isBrave()) setupMicButton(onFinalTranscript);
  setupTTSListener();
}
