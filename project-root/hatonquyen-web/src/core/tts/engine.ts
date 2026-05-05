export type TTSLanguage = 'vi-VN' | 'en-US' | 'fr-FR' | 'zh-CN' | 'ja-JP';
type TTSMode = 'DEV' | 'PROD';

type TTSItem = {
  id?: string;
  text: string;
  language?: TTSLanguage;
  mode?: TTSMode;
  poiId?: string;
  destination?: string;
  fallbackAttempted?: boolean;
};

type TTSEngineState = {
  isPlaying: boolean;
  isPaused: boolean;
  currentText: string;
  lang: TTSLanguage;
  queueLength: number;
  currentSentenceIndex: number;
  totalSentences: number;
};

type Listener = (state: TTSEngineState) => void;

type QueueAudio = {
  audio: HTMLAudioElement;
  release: () => void;
};

const resolveApiBase = () => {
  const fromEnv = String(import.meta.env.VITE_API_BASE_URL || '').trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return 'http://127.0.0.1:5000';
};

const DEV_TTS_ENDPOINT = `${resolveApiBase()}/api/narrations/tts`;


const SHORT_LANG: Record<TTSLanguage, 'vi' | 'en' | 'fr' | 'zh' | 'ja'> = {
  'vi-VN': 'vi',
  'en-US': 'en',
  'fr-FR': 'fr',
  'zh-CN': 'zh',
  'ja-JP': 'ja',
};

class TTSEngine {
  private listeners: Listener[] = [];
  private currentItem: TTSItem | null = null;

  private currentAudioItem: QueueAudio | null = null;
  private audioQueue: QueueAudio[] = [];
  private abortControllers = new Set<AbortController>();

  private sessionId = 0;
  private prefetchCompleted = false;
  private nextCheckTimer: ReturnType<typeof setTimeout> | null = null;

  public isPlaying = false;
  public isPaused = false;
  public currentText = '';
  public lang: TTSLanguage = 'vi-VN';
  public currentSentenceIndex = 0;
  public totalSentences = 0;

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getState(): TTSEngineState {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentText: this.currentText,
      lang: this.lang,
      queueLength: this.audioQueue.length,
      currentSentenceIndex: this.currentSentenceIndex,
      totalSentences: this.totalSentences,
    };
  }

  setLang(lang: TTSLanguage) {
    this.lang = lang;
    this.notify();
  }

  interrupt(text: string, destination = '') {
    this.stop();
    this.speak({
      text,
      destination,
      language: this.lang,
      mode: 'DEV',
    });
  }

  enqueue(text: string, destination = '') {
    this.interrupt(text, destination);
  }

  clearQueue() {
    this.stop();
  }

  splitIntoSentences(text: string): string[] {
    if (!text?.trim()) return [];

    const normalized = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
    const rawChunks = normalized
      .split(/(?<=[\.!?,;:\n。！？，、])/g)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    const MAX_CHUNK_LEN = 160;
    const chunks: string[] = [];

    rawChunks.forEach((chunk) => {
      if (chunk.length <= MAX_CHUNK_LEN) {
        chunks.push(chunk);
        return;
      }

      const words = chunk.split(' ');
      let current = '';

      words.forEach((word) => {
        const next = current ? `${current} ${word}` : word;
        if (next.length > MAX_CHUNK_LEN) {
          if (current) chunks.push(current);
          current = word;
        } else {
          current = next;
        }
      });

      if (current) chunks.push(current);
    });

    return chunks.length ? chunks : [normalized];
  }

  async speak(item: TTSItem) {
    const language = item.language || this.lang;
    this.lang = language;

    const mode = item.mode || 'DEV';
    const text = item.text || '';

    const nextItem: TTSItem = {
      ...item,
      text,
      language,
      mode,
      fallbackAttempted: item.fallbackAttempted || false,
    };

    this.currentItem = nextItem;

    if (mode === 'DEV') {
      await this.speakDevChunked(nextItem);
      return;
    }

    this.speakProd(nextItem);
  }

  play() {
    if (this.currentAudioItem && this.isPaused) {
      this.currentAudioItem.audio.play().then(() => {
        this.isPlaying = true;
        this.isPaused = false;
        this.notify();
      }).catch(() => {
        this.failPlayback('Resume play failed.');
      });
      return;
    }

    if (this.currentItem) {
      this.speak(this.currentItem);
    }
  }

  pause() {
    if (!this.currentAudioItem) return;

    if (this.isPlaying) {
      this.currentAudioItem.audio.pause();
      this.isPlaying = false;
      this.isPaused = true;
      this.notify();
      return;
    }

    if (this.isPaused) {
      this.play();
    }
  }

  stop() {
    this.sessionId += 1;
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();

    if (this.nextCheckTimer) {
      clearTimeout(this.nextCheckTimer);
      this.nextCheckTimer = null;
    }

    if (this.currentAudioItem) {
      this.currentAudioItem.audio.pause();
      this.currentAudioItem.audio.currentTime = 0;
      this.currentAudioItem.release();
      this.currentAudioItem = null;
    }

    this.audioQueue.forEach((item) => item.release());
    this.audioQueue = [];

    this.prefetchCompleted = false;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentText = '';
    this.currentSentenceIndex = 0;
    this.totalSentences = 0;

    this.notify();
  }

  private async speakDevChunked(item: TTSItem) {
    this.stop();

    const session = ++this.sessionId;
    const language = item.language || this.lang;
    const sentences = this.splitIntoSentences(item.text);

    if (!sentences.length) {
      this.failPlayback('No text to speak in DEV mode.');
      return;
    }

    this.totalSentences = sentences.length;
    this.currentSentenceIndex = 0;
    this.currentText = item.destination || item.text.slice(0, 80);
    this.notify();

    const firstAudio = await this.fetchDevAudio(sentences[0], language, session);
    if (!firstAudio || session !== this.sessionId) {
      this.failPlayback('Không thể tải audio preview từ backend TTS.');
      return;
    }

    this.playChunk(firstAudio, 1, this.totalSentences, session);

    this.prefetchCompleted = false;
    this.prefetchInBackground(sentences.slice(1), language, session)
      .then(() => {
        if (session === this.sessionId) {
          this.prefetchCompleted = true;
        }
      })
      .catch(() => {
        if (session === this.sessionId) {
          this.prefetchCompleted = true;
        }
      });
  }

  private speakProd(item: TTSItem) {
    const url = this.resolveProdUrl(item);
    if (!url) {
      this.failPlayback('Cannot resolve audio URL for PROD item.');
      return;
    }

    this.stop();
    const session = ++this.sessionId;

    this.totalSentences = 1;
    this.currentSentenceIndex = 0;
    this.currentText = item.destination || item.text.slice(0, 80);
    this.notify();

    const audio = new Audio(url);
    const audioItem: QueueAudio = {
      audio,
      release: () => undefined,
    };

    this.playChunk(audioItem, 1, 1, session, item);
  }

  private async prefetchInBackground(
    sentences: string[],
    language: TTSLanguage,
    session: number,
  ) {
    for (const sentence of sentences) {
      if (session !== this.sessionId) return;

      const queueAudio = await this.fetchDevAudio(sentence, language, session);
      if (!queueAudio || session !== this.sessionId) return;

      this.audioQueue.push(queueAudio);
      this.notify();
    }
  }

  private async fetchDevAudio(
    text: string,
    language: TTSLanguage,
    session: number,
  ): Promise<QueueAudio | null> {
    if (session !== this.sessionId) return null;

    try {
      const url = new URL(DEV_TTS_ENDPOINT);
      url.searchParams.set('text', text);
      url.searchParams.set('lang', SHORT_LANG[language]);
      url.searchParams.set('voice', 'female');

      const response = await fetch(url.toString());
      if (response.ok) {
        const blob = await response.blob();
        if (blob.size > 0) {
          const objectUrl = URL.createObjectURL(blob);
          const audio = new Audio(objectUrl);

          return {
            audio,
            release: () => {
              audio.pause();
              audio.src = '';
              URL.revokeObjectURL(objectUrl);
            },
          };
        }
      }
    } catch (error) {
      console.error('[TTS] Failed to fetch backend preview audio:', error);
    }

    return null;
  }

  private playChunk(
    queueAudio: QueueAudio,
    sentenceIndex: number,
    total: number,
    session: number,
    sourceItem?: TTSItem,
  ) {
    if (session !== this.sessionId) {
      queueAudio.release();
      return;
    }

    if (this.currentAudioItem) {
      this.currentAudioItem.release();
    }

    this.currentAudioItem = queueAudio;
    this.currentSentenceIndex = sentenceIndex;
    this.totalSentences = total;

    this.currentText = sourceItem?.destination || sourceItem?.text.slice(0, 80) || this.currentText;

    queueAudio.audio.onended = () => {
      if (session !== this.sessionId) {
        queueAudio.release();
        return;
      }

      queueAudio.release();
      this.playNextChunk(session);
    };

    queueAudio.audio.onerror = () => {
      if (session !== this.sessionId) {
        queueAudio.release();
        return;
      }

      queueAudio.release();

      if (sourceItem?.mode === 'PROD' && !sourceItem.fallbackAttempted && sourceItem.text) {
        this.speak({
          ...sourceItem,
          mode: 'DEV',
          fallbackAttempted: true,
        });
        return;
      }

      this.failPlayback('Audio playback error.');
    };

    this.isPlaying = true;
    this.isPaused = false;
    this.notify();

    queueAudio.audio.play().catch(() => {
      // Tự động Fallback sang DEV mode nếu file PROD bị lỗi (VD: 404 Not Found)
      if (sourceItem?.mode === 'PROD' && !sourceItem.fallbackAttempted && sourceItem.text) {
        this.speak({
          ...sourceItem,
          mode: 'DEV',
          fallbackAttempted: true,
        });
        return;
      }
      this.failPlayback('Audio play failed.');
    });
  }

  private playNextChunk(session: number) {
    if (session !== this.sessionId) return;

    if (this.audioQueue.length > 0) {
      const next = this.audioQueue.shift()!;
      this.playChunk(next, this.currentSentenceIndex + 1, this.totalSentences, session);
      return;
    }

    if (!this.prefetchCompleted) {
      if (this.nextCheckTimer) clearTimeout(this.nextCheckTimer);
      this.nextCheckTimer = setTimeout(() => this.playNextChunk(session), 40);
      return;
    }

    this.currentAudioItem = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentText = '';
    this.currentSentenceIndex = 0;
    this.totalSentences = 0;
    this.notify();
  }

  private resolveProdUrl(item: TTSItem) {
    const language = item.language || this.lang;
    if (!item.poiId) return null;

    const shortLang = SHORT_LANG[language];
    return `/audio/${item.poiId}_${shortLang}.mp3`;
  }

  private failPlayback(reason: string) {
    console.warn(`[TTS] ${reason}`);
    this.stop();
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }
}

export const ttsEngine = new TTSEngine();
