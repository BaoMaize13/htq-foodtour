const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const googleTTS = require('google-tts-api');

const AUDIO_DIR = path.resolve(process.cwd(), 'public/uploads/audio');
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

const downloadBuffer = (url) =>
  new Promise(async (resolve, reject) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        reject(new Error(`TTS download failed with status ${response.status}`));
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      resolve(Buffer.from(arrayBuffer));
    } catch (error) {
      reject(error);
    } finally {
      clearTimeout(timeout);
    }
  });

const normalizeLanguage = (value) => {
  const normalized = String(value || 'vi').toLowerCase();
  if (normalized.startsWith('vi')) return 'vi';
  if (normalized.startsWith('en')) return 'en';
  if (normalized.startsWith('zh')) return 'zh-CN';
  if (normalized.startsWith('ja')) return 'ja';
  if (normalized.startsWith('fr')) return 'fr';
  return 'vi';
};

const buildAudioUrl = ({ protocol, host, filename }) => `${protocol}://${host}/uploads/audio/${filename}`;

const synthesizeBuffer = async ({ text, language, speed: requestedSpeed }) => {
  const lang = normalizeLanguage(language);
  const voice = 'female_1';

  const parsedSpeed = Number(requestedSpeed);
  const speed = Number.isFinite(parsedSpeed) ? Math.min(1.3, Math.max(0.75, parsedSpeed)) : 1.12;
  const ttsUrl = googleTTS.getAudioUrl(text, {
    lang,
    slow: false,
    host: 'https://translate.google.com',
    timeout: 10000,
    speed,
  });

  return downloadBuffer(ttsUrl);
};

const synthesizeAndSaveAudio = async ({ text, language, speed, protocol, host }) => {
  const normalizedText = String(text || '').trim() || 'Audio tour';

  const buffer = await synthesizeBuffer({ text: normalizedText, language, speed });
  const filename = `${Date.now()}-${crypto.randomUUID()}.mp3`;
  const filepath = path.join(AUDIO_DIR, filename);

  await fs.promises.writeFile(filepath, buffer);

  return {
    filename,
    filepath,
    size: buffer.length,
    url: buildAudioUrl({ protocol, host, filename }),
  };
};

module.exports = {
  synthesizeAndSaveAudio,
  synthesizeBuffer,
};
