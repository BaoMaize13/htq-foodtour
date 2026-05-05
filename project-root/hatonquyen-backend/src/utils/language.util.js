const LANGUAGE_CODE_REGEX = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/;

const normalizeLanguage = (value) => String(value || '').trim().toLowerCase();

module.exports = {
  LANGUAGE_CODE_REGEX,
  normalizeLanguage,
};
