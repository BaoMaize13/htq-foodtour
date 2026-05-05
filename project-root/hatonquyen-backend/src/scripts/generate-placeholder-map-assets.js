const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const projectRoot = process.cwd();
const mapsRoot = path.join(projectRoot, 'public', 'maps');
const cloudStyleDir = path.join(mapsRoot, 'styles', 'cloud');
const packVersion = '2026-04-27-core';
const packRoot = path.join(mapsRoot, 'packs', packVersion);
const offlineStyleDir = path.join(packRoot, 'styles', 'offline');
const hybridStyleDir = path.join(packRoot, 'styles', 'hybrid');
const fontsDir = path.join(mapsRoot, 'fonts');

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const sha256 = (content) =>
  crypto.createHash('sha256').update(content).digest('hex');

const byteSize = (content) => Buffer.byteLength(content, 'utf8');

const buildRasterStyle = (name) =>
  JSON.stringify(
    {
      version: 8,
      name,
      glyphs: '/api/maps/fonts/{fontstack}/{range}.pbf',
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [
        {
          id: 'osm',
          type: 'raster',
          source: 'osm',
        },
      ],
    },
    null,
    2
  ) + '\n';

const cloudStyle = buildRasterStyle('HTQ Cloud Raster');
const offlineStyle = buildRasterStyle('HTQ Offline Placeholder');
const hybridStyle = buildRasterStyle('HTQ Hybrid Placeholder');

const manifest = {
  defaultMode: 'cloud',
  latestPackVersion: packVersion,
  cloudStyleUrl: '/api/maps/styles/cloud/style.json',
  packs: [
    {
      version: packVersion,
      displayName: 'Ha Ton Quyen Placeholder Pack',
      files: [
        {
          path: 'styles/offline/style.json',
          url: `/api/maps/packs/${packVersion}/styles/offline/style.json`,
          sha256: sha256(offlineStyle),
          size: byteSize(offlineStyle),
        },
        {
          path: 'styles/hybrid/style.json',
          url: `/api/maps/packs/${packVersion}/styles/hybrid/style.json`,
          sha256: sha256(hybridStyle),
          size: byteSize(hybridStyle),
        },
      ],
    },
  ],
};

ensureDir(cloudStyleDir);
ensureDir(offlineStyleDir);
ensureDir(hybridStyleDir);
ensureDir(fontsDir);

fs.writeFileSync(
  path.join(mapsRoot, 'offline-manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
  'utf8'
);

fs.writeFileSync(
  path.join(cloudStyleDir, 'style.json'),
  cloudStyle,
  'utf8'
);

fs.writeFileSync(
  path.join(offlineStyleDir, 'style.json'),
  offlineStyle,
  'utf8'
);

fs.writeFileSync(
  path.join(hybridStyleDir, 'style.json'),
  hybridStyle,
  'utf8'
);

console.log('Generated placeholder map assets at:');
console.log(`- ${path.join(mapsRoot, 'offline-manifest.json')}`);
console.log(`- ${path.join(cloudStyleDir, 'style.json')}`);
console.log(`- ${path.join(offlineStyleDir, 'style.json')}`);
console.log(`- ${path.join(hybridStyleDir, 'style.json')}`);
console.log(`- ${fontsDir}`);
console.log('');
console.log('Note: This does NOT generate a real basemap.pmtiles file.');