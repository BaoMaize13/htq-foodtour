/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const API_ENDPOINT = 'http://127.0.0.1:5000/tts';
const OUTPUT_DIR = path.resolve(__dirname, '../public/audio');

const VOICE_BY_LANG = {
  vi: 'male',
  en: 'male',
  fr: 'male',
  zh: 'female',
  ja: 'female',
};

const MOCK_POIS = [
  {
    poiId: 'POI_1',
    texts: {
      vi: 'Chào mừng bạn đến Quán Dim Sum Phố Cổ, nơi giữ trọn hương vị truyền thống.',
      en: 'Welcome to Old Quarter Dim Sum, preserving authentic traditional flavors.',
      fr: 'Bienvenue au Dim Sum du Vieux Quartier, gardien des saveurs traditionnelles.',
      zh: '欢迎来到老街点心馆，这里保留着地道的传统风味。',
      ja: '旧市街点心館へようこそ。ここでは伝統の味を大切にしています。',
    },
  },
  {
    poiId: 'POI_2',
    texts: {
      vi: 'Nhà Hàng Bắc Kinh nổi tiếng với món vịt quay chuẩn vị và lớp da giòn rụm.',
      en: 'Beijing Restaurant is famous for authentic roast duck with crispy skin.',
      fr: 'Le Restaurant Pékin est réputé pour son canard laqué authentique et croustillant.',
      zh: '北京饭店以正宗烤鸭和酥脆鸭皮而闻名。',
      ja: '北京レストランは本格的な北京ダックとパリパリの皮で有名です。',
    },
  },
  {
    poiId: 'POI_3',
    texts: {
      vi: 'Tiệm Bánh Nướng Trăng sử dụng công thức gia truyền suốt tám mươi năm.',
      en: 'Moon Bakery uses an eighty-year family recipe for its signature cakes.',
      fr: 'La Boulangerie de la Lune utilise une recette familiale transmise depuis quatre-vingts ans.',
      zh: '月亮糕饼店沿用八十年的家传配方制作招牌月饼。',
      ja: 'ムーンベーカリーは八十年続く家伝のレシピで看板菓子を作っています。',
    },
  },
  {
    poiId: 'POI_4',
    texts: {
      vi: 'Quán Phở Hoa Kiều kết hợp tinh hoa ẩm thực Việt và Hoa trong từng tô phở.',
      en: 'Hoa Kieu Pho House blends Vietnamese and Chinese culinary essence in every bowl.',
      fr: 'La Maison Pho Hoa Kieu marie les essences culinaires vietnamiennes et chinoises dans chaque bol.',
      zh: '华侨粉馆将越南与中华美食精华融合在每一碗粉里。',
      ja: '華僑フォーハウスは一杯ごとにベトナムと中華の味の魅力を融合しています。',
    },
  },
];

async function fetchAudioBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const arrBuffer = await response.arrayBuffer();
  return Buffer.from(arrBuffer);
}

async function bakeAudio() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const records = [];
  for (const poi of MOCK_POIS) {
    for (const lang of Object.keys(poi.texts)) {
      records.push({
        poiId: poi.poiId,
        lang,
        text: poi.texts[lang],
      });
    }
  }

  console.log(`[BAKE] Start baking ${records.length} audio files...`);

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const voice = VOICE_BY_LANG[record.lang];

    const query = new URLSearchParams({
      text: record.text,
      voice,
      lang: record.lang,
    });

    const url = `${API_ENDPOINT}?${query.toString()}`;
    const outputFile = path.join(OUTPUT_DIR, `${record.poiId}_${record.lang}.mp3`);

    try {
      const fileBuffer = await fetchAudioBuffer(url);
      fs.writeFileSync(outputFile, fileBuffer);
      console.log(`[${index + 1}/${records.length}] ✅ ${path.basename(outputFile)} (${voice})`);
    } catch (error) {
      console.error(`[${index + 1}/${records.length}] ❌ ${record.poiId}_${record.lang} failed -> ${error.message}`);
    }
  }

  console.log('[BAKE] Done.');
}

bakeAudio().catch((error) => {
  console.error('[BAKE] Fatal error:', error);
  process.exit(1);
});
