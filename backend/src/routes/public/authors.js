const express = require('express');
const router = express.Router();
const authorController = require('../../controllers/public/authorController');
const { query } = require('express-validator');
const { handleValidationErrors } = require('../../middleware/validator');

/**
 * @route   GET /api/authors
 * @desc    Get all authors
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
  authorController.getAll
);

/**
 * @route   GET /api/authors/:slug
 * @desc    Get author by slug
 * @access  Public
 */
router.get(
  '/:slug',
  [
    query('language').optional().isIn(['pt', 'en']).withMessage('Language must be pt or en'),
    handleValidationErrors,
  ],
  authorController.getBySlug
);

module.exports = router;
