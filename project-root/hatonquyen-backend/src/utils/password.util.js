const bcrypt = require('bcrypt');

const DEFAULT_SALT_ROUNDS = 10;

const getSaltRounds = () => {
  const configuredValue = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS, 10);

  if (Number.isInteger(configuredValue) && configuredValue >= 8 && configuredValue <= 15) {
    return configuredValue;
  }

  return DEFAULT_SALT_ROUNDS;
};

const hashPassword = async (plainPassword) => {
  if (typeof plainPassword !== 'string' || plainPassword.length === 0) {
    throw new Error('Password must be a non-empty string');
  }

  return bcrypt.hash(plainPassword, getSaltRounds());
};

const comparePassword = async (plainPassword, passwordHash) => {
  if (typeof plainPassword !== 'string' || typeof passwordHash !== 'string') {
    return false;
  }

  return bcrypt.compare(plainPassword, passwordHash);
};

module.exports = {
  hashPassword,
  comparePassword,
  getSaltRounds,
};
