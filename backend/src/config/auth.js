const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('./environment');

const SALT_ROUNDS = 12;

/**
 * Hash a password
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare password with hash
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiration,
  });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Decode token without verification (useful for checking expiration)
 */
function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  decodeToken,
  SALT_ROUNDS,
};
