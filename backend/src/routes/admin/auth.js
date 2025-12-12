const express = require('express');
const router = express.Router();
const authController = require('../../controllers/admin/authController');
const { authenticate } = require('../../middleware/auth');
const { authLimiter } = require('../../middleware/rateLimiter');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../../middleware/validator');

/**
 * @route   POST /api/admin/auth/login
 * @desc    Login admin user
 * @access  Public
 */
router.post(
  '/login',
  authLimiter, // Stricter rate limiting for auth
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors,
  ],
  authController.login
);

/**
 * @route   POST /api/admin/auth/logout
 * @desc    Logout admin user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   GET /api/admin/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, authController.me);

module.exports = router;
