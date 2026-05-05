const express = require('express');
const {
  getOfflineManifest,
  getPackFile,
  getStyleAsset,
  getFontAsset,
} = require('./maps.controller');

const router = express.Router();

router.get('/offline-manifest', getOfflineManifest);
router.get('/packs/:version/*', getPackFile);
router.get('/styles/*', getStyleAsset);
router.get('/fonts/*', getFontAsset);

module.exports = router;