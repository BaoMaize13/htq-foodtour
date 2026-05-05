const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const MAPS_ROOT = path.resolve(
  process.cwd(),
  process.env.MAPS_ROOT || 'public/maps'
);

const MANIFEST_FILE = path.join(MAPS_ROOT, 'offline-manifest.json');
const PACKS_ROOT = path.join(MAPS_ROOT, 'packs');
const STYLES_ROOT = path.join(MAPS_ROOT, 'styles');
const FONTS_ROOT = path.join(MAPS_ROOT, 'fonts');

const resolveSafePath = (rootPath, relativePath) => {
  const normalized = String(relativePath || '')
    .replace(/^[/\\]+/, '')
    .replace(/\\/g, '/');

  const resolved = path.resolve(rootPath, normalized);
  const safeRoot = path.resolve(rootPath);

  if (resolved !== safeRoot && !resolved.startsWith(`${safeRoot}${path.sep}`)) {
    return null;
  }

  return resolved;
};

const fileExists = async (filePath) => {
  try {
    const stat = await fsp.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
};

const defaultManifest = () => ({
  defaultMode: 'hybrid',
  latestPackVersion: '',
  cloudStyleUrl: '/api/maps/styles/cloud/style.json',
  packs: [],
});

const readManifest = async () => {
  try {
    const exists = await fileExists(MANIFEST_FILE);

    if (!exists) {
      return defaultManifest();
    }

    const raw = await fsp.readFile(MANIFEST_FILE, 'utf8');
    const parsed = JSON.parse(raw);

    return {
      ...defaultManifest(),
      ...parsed,
      packs: Array.isArray(parsed?.packs) ? parsed.packs : [],
    };
  } catch {
    return defaultManifest();
  }
};

const sendResolvedFile = async (res, absolutePath) => {
  const exists = await fileExists(absolutePath);

  if (!exists) {
    return res.status(404).json({
      code: 'MAP_FILE_NOT_FOUND',
      message: 'Map file not found',
    });
  }

  return res.sendFile(absolutePath);
};

const getOfflineManifest = async (req, res, next) => {
  try {
    const manifest = await readManifest();

    return res.status(200).json({
      message: 'Offline manifest fetched successfully',
      data: manifest,
    });
  } catch (error) {
    return next(error);
  }
};

const getPackFile = async (req, res, next) => {
  try {
    const version = String(req.params.version || '').trim();
    const relativePath = req.params[0];

    if (!version || !relativePath) {
      return res.status(400).json({
        code: 'INVALID_MAP_PACK_REQUEST',
        message: 'version and file path are required',
      });
    }

    const versionRoot = resolveSafePath(PACKS_ROOT, version);

    if (!versionRoot) {
      return res.status(400).json({
        code: 'INVALID_MAP_PACK_VERSION',
        message: 'Invalid pack version',
      });
    }

    const absolutePath = resolveSafePath(versionRoot, relativePath);

    if (!absolutePath) {
      return res.status(400).json({
        code: 'INVALID_MAP_PACK_PATH',
        message: 'Invalid pack file path',
      });
    }

    return sendResolvedFile(res, absolutePath);
  } catch (error) {
    return next(error);
  }
};

const getStyleAsset = async (req, res, next) => {
  try {
    const relativePath = req.params[0];

    if (!relativePath) {
      return res.status(400).json({
        code: 'INVALID_MAP_STYLE_REQUEST',
        message: 'Style path is required',
      });
    }

    const absolutePath = resolveSafePath(STYLES_ROOT, relativePath);

    if (!absolutePath) {
      return res.status(400).json({
        code: 'INVALID_MAP_STYLE_PATH',
        message: 'Invalid style path',
      });
    }

    return sendResolvedFile(res, absolutePath);
  } catch (error) {
    return next(error);
  }
};

const getFontAsset = async (req, res, next) => {
  try {
    const relativePath = req.params[0];

    if (!relativePath) {
      return res.status(400).json({
        code: 'INVALID_MAP_FONT_REQUEST',
        message: 'Font path is required',
      });
    }

    const absolutePath = resolveSafePath(FONTS_ROOT, relativePath);

    if (!absolutePath) {
      return res.status(400).json({
        code: 'INVALID_MAP_FONT_PATH',
        message: 'Invalid font path',
      });
    }

    return sendResolvedFile(res, absolutePath);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getOfflineManifest,
  getPackFile,
  getStyleAsset,
  getFontAsset,
};