const express = require('express');
const router = express.Router();
const devotionalController = require('../../controllers/public/devotionalController');
const { query } = require('express-validator');
const { handleValidationErrors } = require('../../middleware/validator');

/**
 * @route   GET /api/devotionals
 * @desc    Get all devotionals with filters
 * @access  Public
 */
router.get(
  '/',
  [
    query('language').optional().isIn(['pt', 'en']).withMessage('Language must be pt or en'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('date').optional().isDate().withMessage('Date must be in YYYY-MM-DD format'),
    query('start_date').optional().isDate().withMessage('Start date must be in YYYY-MM-DD format'),
    query('end_date').optional().isDate().withMessage('End date must be in YYYY-MM-DD format'),
    handleValidationErrors,
  ],
  devotionalController.getAll
);

/**
 * @route   GET /api/devotionals/today
 * @desc    Get today's devotional
 * @access  Public
 */
router.get(
  '/today',
  [
    query('language').optional().isIn(['pt', 'en']).withMessage('Language must be pt or en'),
    handleValidationErrors,
  ],
  devotionalController.getToday
);

/**
 * @route   GET /api/devotionals/random
 * @desc    Get random devotional
 * @access  Public
 */
router.get(
  '/random',
  [
    query('language').optional().isIn(['pt', 'en']).withMessage('Language must be pt or en'),
    query('theme').optional().isString().withMessage('Theme must be a string'),
    handleValidationErrors,
  ],
  devotionalController.getRandom
);

/**
 * @route   GET /api/devotionals/:slug
 * @desc    Get devotional by slug
 * @access  Public
 */
router.get(
  '/:slug',
  [
    query('language').optional().isIn(['pt', 'en']).withMessage('Language must be pt or en'),
    handleValidationErrors,
  ],
  devotionalController.getBySlug
);

/**
 * @route   GET /api/devotionals/:slug/:language
 * @desc    Get devotional by slug and language
 * @access  Public
 */
router.get(
  '/:slug/:language',
  devotionalController.getBySlugAndLanguage
);

/**
 * @route   GET /api/devotionals/sync
 * @desc    Get devotionals formatted for GlowUp app synchronization
 * @access  Public
 */
router.get(
  '/sync',
  [
    query('format').optional().isIn(['glowup']).withMessage('Format must be glowup'),
    query('language').optional().isIn(['pt', 'en']).withMessage('Language must be pt or en'),
    query('from_date').optional().isDate().withMessage('From date must be in YYYY-MM-DD format'),
    query('to_date').optional().isDate().withMessage('To date must be in YYYY-MM-DD format'),
    query('published_only').optional().isBoolean().withMessage('Published only must be a boolean'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    handleValidationErrors,
  ],
  devotionalController.sync
);

module.exports = router;
