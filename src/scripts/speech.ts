/**
 * Leer en voz alta. Web Speech API only, with a local Spanish voice
 * (es-419 / es-VE first): no network speech services. If there is none,
 * the control stays visible and explains why it is unavailable. The sentence
 * being read is highlighted with the CSS Custom Highlight API (no DOM
 * changes), or its paragraph as a fallback.
 */
import { reduced } from './motion';

const PREFERRED = ['es-419', 'es-ve', 'es-us', 'es-mx', 'es-co', 'es-ar', 'es-cl', 'es-es'];
const UNSUPPORTED = 'Este navegador no admite la lectura en voz alta.';
const NO_LOCAL_VOICE = 'No hay una voz local en español disponible en este dispositivo.';
const PLAYBACK_ERROR = 'No se pudo reproducir el texto. Intenta de nuevo.';

let activeCleanup: (() => void) | undefined;

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const local = voices.filter((v) => v.localService && v.lang.toLowerCase().replace('_', '-').startsWith('es'));
  for (const p of PREFERRED) {
    const v = local.find((x) => x.lang.toLowerCase().replace('_', '-') === p);
    if (v) return v;
  }
  return local[0] ?? null;
}

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  try { return window.speechSynthesis ?? null; } catch { return null; }
}

function getVoices(synth: SpeechSynthesis): SpeechSynthesisVoice[] {
  try { return synth.getVoices(); } catch { return []; }
}

interface Sentence { block: HTMLElement; start: number; end: number; text: string; }

function splitSentences(block: HTMLElement): Sentence[] {
  const text = block.textContent ?? '';
  const out: Sentence[] = [];
  const push = (start: number, end: number) => {
    const t = text.slice(start, end).trim();
    if (t) out.push({ block, start, end, text: t });
  };
  if ('Segmenter' in Intl) {
    for (const s of new Intl.Segmenter('es', { granularity: 'sentence' }).segment(text)) push(s.index, s.index + s.segment.length);
  } else {
    const re = /[^.!?…]+[.!?…]+["»”’)]*\s*|[^.!?…]+$/g;
    for (let m; (m = re.exec(text)); ) push(m.index, m.index + m[0].length);
  }
  return out;
}

function rangeFor(s: Sentence): Range | null {
  const walker = document.createTreeWalker(s.block, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let pos = 0;
  let started = false;
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const len = n.data.length;
    if (!started && s.start < pos + len) { range.setStart(n, s.start - pos); started = true; }
    if (started && s.end <= pos + len) { range.setEnd(n, s.end - pos); return range; }
    pos += len;
  }
  return null;
}

export function initSpeech(section: HTMLElement): void {
  activeCleanup?.();
  activeCleanup = undefined;

  const play = section.querySelector<HTMLButtonElement>('[data-voz-play]');
  const stop = section.querySelector<HTMLButtonElement>('[data-voz-stop]');
  const rate = section.querySelector<HTMLSelectElement>('[data-voz-rate]');
  const status = section.querySelector<HTMLElement>('[data-voz-status]');
  if (!play || !stop || !rate || !status) return;

  const synth = getSpeechSynthesis();
  const supported = Boolean(synth && typeof SpeechSynthesisUtterance === 'function');
  const blocks = [...document.querySelectorAll<HTMLElement>('.post .prose > :is(p, li, blockquote), .post .prose > :is(ul, ol) > li')];
  const sentences = blocks.flatMap(splitSentences);
  const canHighlight = typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight === 'function';

  let selectedVoice: SpeechSynthesisVoice | null = null;
  let availabilityMessage: string | null = supported ? NO_LOCAL_VOICE : UNSUPPORTED;
  let errorMessage: string | null = null;
  let index = 0;
  let mode: 'idle' | 'playing' | 'paused' = 'idle';
  let generation = 0;
  let lit: HTMLElement | null = null;

  const mark = (sentence: Sentence | null) => {
    lit?.classList.remove('is-speaking');
    lit = null;
    if (canHighlight) CSS.highlights.delete('voz');
    if (!sentence) return;
    const range = canHighlight ? rangeFor(sentence) : null;
    if (range) CSS.highlights.set('voz', new Highlight(range));
    else { sentence.block.classList.add('is-speaking'); lit = sentence.block; }
    const bounds = sentence.block.getBoundingClientRect();
    if (bounds.top < 0 || bounds.bottom > innerHeight) {
      sentence.block.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    }
  };

  const render = () => {
    const unavailable = !supported || !selectedVoice;
    play.disabled = unavailable;
    stop.disabled = unavailable;
    rate.disabled = unavailable;
    play.textContent = mode === 'playing' ? 'Pausa' : mode === 'paused' ? 'Continuar' : 'Reproducir';
    play.setAttribute('aria-pressed', String(mode === 'playing'));
    status.textContent = errorMessage
      ?? availabilityMessage
      ?? (mode === 'idle' ? '' : `${mode === 'playing' ? 'Leyendo' : 'En pausa'} · ${selectedVoice?.name ?? ''}`);
  };

  const cancelCurrent = () => {
    generation += 1;
    synth?.cancel();
  };

  const finish = () => {
    generation += 1;
    mode = 'idle';
    index = 0;
    errorMessage = null;
    mark(null);
    render();
  };

  const speak = (sentenceIndex: number) => {
    const sentence = sentences[sentenceIndex];
    if (!sentence) { finish(); return; }
    if (!synth || !selectedVoice) return;

    index = sentenceIndex;
    const currentGeneration = ++generation;
    const voice = selectedVoice;
    const utterance = new SpeechSynthesisUtterance(sentence.text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = Number(rate.value) || 1;
    utterance.onstart = () => {
      if (currentGeneration !== generation) return;
      mark(sentence);
    };
    utterance.onend = () => {
      if (currentGeneration !== generation || mode !== 'playing' || index !== sentenceIndex) return;
      speak(sentenceIndex + 1);
    };
    utterance.onerror = () => {
      if (currentGeneration !== generation) return;
      generation += 1;
      synth.cancel();
      mode = 'idle';
      mark(null);
      errorMessage = PLAYBACK_ERROR;
      render();
    };
    synth.speak(utterance);
  };

  const reset = () => {
    cancelCurrent();
    mode = 'idle';
    index = 0;
    errorMessage = null;
    mark(null);
    render();
  };

  const onPlay = () => {
    if (!synth || !supported || !selectedVoice) return;
    errorMessage = null;
    if (mode === 'playing') {
      mode = 'paused';
      synth.pause();
    } else if (mode === 'paused') {
      mode = 'playing';
      synth.resume();
    } else {
      mode = 'playing';
      cancelCurrent();
      speak(index);
    }
    render();
  };

  const onRateChange = () => {
    if (mode !== 'playing' || !synth || !selectedVoice) return;
    const sentenceIndex = index;
    cancelCurrent();
    speak(sentenceIndex);
    render();
  };

  const refreshAvailability = () => {
    if (!supported || !synth || mode !== 'idle') return;
    selectedVoice = pickVoice(getVoices(synth));
    availabilityMessage = selectedVoice ? null : NO_LOCAL_VOICE;
    render();
  };

  const onVoicesChanged = () => refreshAvailability();
  let cleanup: () => void;
  const onPageHide = () => {
    cancelCurrent();
    mode = 'idle';
    mark(null);
    cleanup();
    render();
  };
  cleanup = () => {
    if (synth) synth.removeEventListener('voiceschanged', onVoicesChanged);
    window.removeEventListener('pagehide', onPageHide);
    if (activeCleanup === cleanup) activeCleanup = undefined;
  };

  play.addEventListener('click', onPlay);
  stop.addEventListener('click', reset);
  rate.addEventListener('change', onRateChange);
  if (synth && supported) {
    synth.addEventListener('voiceschanged', onVoicesChanged);
    window.addEventListener('pagehide', onPageHide);
    activeCleanup = cleanup;
  }

  section.hidden = false;
  refreshAvailability();
  render();
}
