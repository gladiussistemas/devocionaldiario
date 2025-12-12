const express = require('express');
const router = express.Router();
const themeController = require('../../controllers/public/themeController');
const { query } = require('express-validator');
const { handleValidationErrors } = require('../../middleware/validator');

/**
 * @route   GET /api/themes
 * @desc    Get all themes
 * @access  Public
 */
router.get(
  '/',
  [
    query('language').optional().isIn(['pt', 'en']).withMessage('Language must be pt or en'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    handleValidationErrors,
  ],
  themeController.getAll
);

/**
 * @route   GET /api/themes/:slug
 * @desc    Get theme by slug
 * @access  Public
 */
router.get(
  '/:slug',
  [
    query('language').optional().isIn(['pt', 'en']).withMessage('Language must be pt or en'),
    handleValidationErrors,
  ],
  themeController.getBySlug
);

module.exports = router;
