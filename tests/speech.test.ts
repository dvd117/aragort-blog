// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initSpeech } from '../src/scripts/speech';

type MockSpeech = EventTarget & {
  getVoices: ReturnType<typeof vi.fn>;
  speak: ReturnType<typeof vi.fn>;
  cancel: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  resume: ReturnType<typeof vi.fn>;
};

const localVoice = (lang = 'es-419', name = 'Voz local'): SpeechSynthesisVoice => ({
  lang,
  name,
  localService: true,
  default: false,
  voiceURI: name,
});

const remoteVoice = (lang = 'es-ES', name = 'Voz remota'): SpeechSynthesisVoice => ({
  ...localVoice(lang, name),
  localService: false,
});

function createSpeech(voices: () => SpeechSynthesisVoice[]): MockSpeech {
  return Object.assign(new EventTarget(), {
    getVoices: vi.fn(voices),
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  });
}

// happy-dom aliases PageTransitionEvent to Event and drops its init options.
function pageTransition(type: 'pagehide' | 'pageshow', persisted: boolean): Event {
  const event = new Event(type);
  Object.defineProperty(event, 'persisted', { value: persisted });
  return event;
}

function mountSpeech() {
  document.body.innerHTML = `
    <article class="post">
      <div class="prose"><p>Primera oración. Segunda oración.</p></div>
    </article>
    <section data-voz hidden>
      <button type="button" data-voz-play aria-pressed="false">Reproducir</button>
      <button type="button" data-voz-stop>Detener</button>
      <select data-voz-rate><option value="1" selected>1×</option><option value="1.5">1,5×</option></select>
      <p data-voz-status aria-live="polite"></p>
    </section>`;
  return {
    section: document.querySelector<HTMLElement>('[data-voz]')!,
    play: document.querySelector<HTMLButtonElement>('[data-voz-play]')!,
    stop: document.querySelector<HTMLButtonElement>('[data-voz-stop]')!,
    rate: document.querySelector<HTMLSelectElement>('[data-voz-rate]')!,
    status: document.querySelector<HTMLElement>('[data-voz-status]')!,
  };
}

beforeEach(() => {
  vi.useRealTimers();
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
  vi.stubGlobal('CSS', {});
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
  vi.stubGlobal('SpeechSynthesisUtterance', class {
    text: string;
    constructor(text: string) { this.text = text; }
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('read aloud availability', () => {
  it('explains when the browser does not support speech synthesis', () => {
    const mounted = mountSpeech();
    vi.stubGlobal('speechSynthesis', undefined);

    initSpeech(mounted.section);

    expect(mounted.section.hidden).toBe(false);
    expect(mounted.play.disabled).toBe(true);
    expect(mounted.stop.disabled).toBe(true);
    expect(mounted.rate.disabled).toBe(true);
    expect(mounted.status.textContent).toBe('Este navegador no admite la lectura en voz alta.');
  });

  it('explains when no local Spanish voice is available', () => {
    const mounted = mountSpeech();
    const synth = createSpeech(() => []);
    vi.stubGlobal('speechSynthesis', synth);

    initSpeech(mounted.section);

    expect(mounted.section.hidden).toBe(false);
    expect(mounted.play.disabled).toBe(true);
    expect(mounted.status.textContent).toBe('No hay una voz local en español disponible en este dispositivo.');
  });

  it('does not enable playback for a remote Spanish voice', () => {
    const mounted = mountSpeech();
    const synth = createSpeech(() => [remoteVoice()]);
    vi.stubGlobal('speechSynthesis', synth);

    initSpeech(mounted.section);

    expect(mounted.play.disabled).toBe(true);
    expect(mounted.status.textContent).toBe('No hay una voz local en español disponible en este dispositivo.');
  });

  it('enables playback when a local Spanish voice arrives after initialization', () => {
    vi.useFakeTimers();
    const mounted = mountSpeech();
    let voices: SpeechSynthesisVoice[] = [];
    const synth = createSpeech(() => voices);
    vi.stubGlobal('speechSynthesis', synth);

    initSpeech(mounted.section);
    expect(mounted.play.disabled).toBe(true);

    setTimeout(() => {
      voices = [localVoice()];
      synth.dispatchEvent(new Event('voiceschanged'));
    }, 2000);
    vi.advanceTimersByTime(2000);

    expect(mounted.play.disabled).toBe(false);
    expect(mounted.status.textContent).toBe('');
  });
});

function mountReadySpeech() {
  const mounted = mountSpeech();
  const voice = localVoice();
  const synth = createSpeech(() => [voice]);
  vi.stubGlobal('speechSynthesis', synth);
  initSpeech(mounted.section);
  return { ...mounted, synth, voice };
}

describe('read aloud playback lifecycle', () => {
  it('returns to a retryable idle state and announces playback errors', () => {
    const mounted = mountReadySpeech();
    mounted.play.click();
    const utterance = mounted.synth.speak.mock.calls[0][0];
    utterance.onstart();
    expect(document.querySelector('.prose p')!.classList.contains('is-speaking')).toBe(true);

    utterance.onerror(new Event('error'));

    expect(mounted.play.textContent).toBe('Reproducir');
    expect(mounted.play.getAttribute('aria-pressed')).toBe('false');
    expect(mounted.play.disabled).toBe(false);
    expect(mounted.status.textContent).toBe('No se pudo reproducir el texto. Intenta de nuevo.');
    expect(document.querySelector('.prose p')!.classList.contains('is-speaking')).toBe(false);

    mounted.play.click();
    expect(mounted.synth.speak).toHaveBeenCalledTimes(2);
    expect(mounted.status.textContent).toContain('Leyendo');
  });

  it('pauses, resumes, and restarts the current sentence at a changed rate', () => {
    const mounted = mountReadySpeech();
    mounted.play.click();
    const first = mounted.synth.speak.mock.calls[0][0];

    mounted.play.click();
    expect(mounted.synth.pause).toHaveBeenCalledTimes(1);
    expect(mounted.play.textContent).toBe('Continuar');
    mounted.play.click();
    expect(mounted.synth.resume).toHaveBeenCalledTimes(1);
    expect(mounted.play.textContent).toBe('Pausa');

    mounted.rate.value = '1.5';
    mounted.rate.dispatchEvent(new Event('change', { bubbles: true }));
    expect(mounted.synth.cancel).toHaveBeenCalledTimes(2);
    expect(mounted.synth.speak).toHaveBeenCalledTimes(2);
    const replacement = mounted.synth.speak.mock.calls[1][0];
    expect(replacement.rate).toBe(1.5);
    expect(replacement.voice).toBe(mounted.voice);
    first.onend();
    expect(mounted.synth.speak).toHaveBeenCalledTimes(2);
    expect(mounted.play.textContent).toBe('Pausa');
  });

  it('stops playback, clears highlighting, and ignores the stale end callback', () => {
    const mounted = mountReadySpeech();
    mounted.play.click();
    const utterance = mounted.synth.speak.mock.calls[0][0];
    utterance.onstart();
    mounted.stop.click();

    expect(mounted.synth.cancel).toHaveBeenCalledTimes(2);
    expect(mounted.play.textContent).toBe('Reproducir');
    expect(document.querySelector('.prose p')!.classList.contains('is-speaking')).toBe(false);
    utterance.onend();
    expect(mounted.synth.speak).toHaveBeenCalledTimes(1);
  });

  it('advances through sentences and resets after the final sentence', () => {
    const mounted = mountReadySpeech();
    mounted.play.click();
    const first = mounted.synth.speak.mock.calls[0][0];
    first.onend();
    expect(mounted.synth.speak).toHaveBeenCalledTimes(2);
    const second = mounted.synth.speak.mock.calls[1][0];
    second.onend();
    expect(mounted.synth.speak).toHaveBeenCalledTimes(2);
    expect(mounted.play.textContent).toBe('Reproducir');
    expect(mounted.play.getAttribute('aria-pressed')).toBe('false');
    expect(mounted.status.textContent).toBe('');
  });

  it('does not swap the active voice when voices change during playback', () => {
    const mounted = mountSpeech();
    let voices = [localVoice('es-419', 'Primera voz')];
    const synth = createSpeech(() => voices);
    vi.stubGlobal('speechSynthesis', synth);
    initSpeech(mounted.section);
    mounted.play.click();
    const first = synth.speak.mock.calls[0][0];

    voices = [localVoice('es-ES', 'Otra voz')];
    synth.dispatchEvent(new Event('voiceschanged'));
    mounted.rate.value = '1.5';
    mounted.rate.dispatchEvent(new Event('change', { bubbles: true }));

    expect(first.voice.name).toBe('Primera voz');
    expect(synth.speak.mock.calls[1][0].voice.name).toBe('Primera voz');
  });

  it('cancels playback and removes voice listeners on page exit', () => {
    const mounted = mountReadySpeech();
    mounted.play.click();
    const utterance = mounted.synth.speak.mock.calls[0][0];

    window.dispatchEvent(new Event('pagehide'));

    expect(mounted.synth.cancel).toHaveBeenCalledTimes(2);
    expect(mounted.play.textContent).toBe('Reproducir');
    expect(mounted.play.getAttribute('aria-pressed')).toBe('false');
    utterance.onend();
    expect(mounted.synth.speak).toHaveBeenCalledTimes(1);
  });

  it('does not enable a voice that arrives after page exit', () => {
    const mounted = mountSpeech();
    let voices: SpeechSynthesisVoice[] = [];
    const synth = createSpeech(() => voices);
    vi.stubGlobal('speechSynthesis', synth);
    initSpeech(mounted.section);
    window.dispatchEvent(new Event('pagehide'));

    voices = [localVoice()];
    synth.dispatchEvent(new Event('voiceschanged'));
    expect(mounted.play.disabled).toBe(true);
  });

  it('cancels playback on every exit after cached-page restoration', () => {
    const mounted = mountReadySpeech();

    for (let visit = 0; visit < 3; visit += 1) {
      mounted.play.click();
      const utterance = mounted.synth.speak.mock.calls[visit][0];
      utterance.onstart();
      const cancellations = mounted.synth.cancel.mock.calls.length;

      window.dispatchEvent(pageTransition('pagehide', true));

      expect(mounted.synth.cancel).toHaveBeenCalledTimes(cancellations + 1);
      expect(mounted.play.textContent).toBe('Reproducir');
      expect(document.querySelector('.prose p')!.classList.contains('is-speaking')).toBe(false);
      utterance.onend();
      expect(mounted.synth.speak).toHaveBeenCalledTimes(visit + 1);
      window.dispatchEvent(pageTransition('pageshow', true));
    }

    // A later permanent exit still tears down voice discovery.
    window.dispatchEvent(pageTransition('pagehide', false));
    mounted.synth.getVoices.mockReturnValue([]);
    mounted.synth.dispatchEvent(new Event('voiceschanged'));
    expect(mounted.play.disabled).toBe(false);
  });

  it('discovers a local voice arriving after cached-page restoration', () => {
    const mounted = mountSpeech();
    let voices: SpeechSynthesisVoice[] = [];
    const synth = createSpeech(() => voices);
    vi.stubGlobal('speechSynthesis', synth);
    initSpeech(mounted.section);
    window.dispatchEvent(pageTransition('pagehide', true));
    window.dispatchEvent(pageTransition('pageshow', true));

    voices = [localVoice()];
    synth.dispatchEvent(new Event('voiceschanged'));

    expect(mounted.play.disabled).toBe(false);
    mounted.play.click();
    expect(synth.speak.mock.calls[0][0].voice).toBe(voices[0]);
  });

  it.each([
    { before: [], after: [localVoice()], disabled: false },
    { before: [localVoice()], after: [remoteVoice()], disabled: true },
  ])('refreshes voices changed while cached (disabled: $disabled)', ({ before, after, disabled }) => {
    const mounted = mountSpeech();
    let voices = before;
    const synth = createSpeech(() => voices);
    vi.stubGlobal('speechSynthesis', synth);
    initSpeech(mounted.section);
    window.dispatchEvent(pageTransition('pagehide', true));

    voices = after;
    // The page was frozen; do not rely on receiving a voiceschanged event.
    window.dispatchEvent(pageTransition('pageshow', true));

    expect(mounted.play.disabled).toBe(disabled);
    expect(mounted.stop.disabled).toBe(disabled);
    expect(mounted.rate.disabled).toBe(disabled);
    expect(mounted.status.textContent).toBe(disabled
      ? 'No hay una voz local en español disponible en este dispositivo.'
      : '');
  });
});
