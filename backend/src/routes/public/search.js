const express = require('express');
const router = express.Router();
const searchController = require('../../controllers/public/searchController');
const { query } = require('express-validator');
const { handleValidationErrors } = require('../../middleware/validator');

/**
 * @route   GET /api/search
 * @desc    Search devotionals
 * @access  Public
 */
router.get(
  '/',
  [
    query('q').notEmpty().withMessage('Search query is required'),
    query('language').optional().isIn(['pt', 'en']).withMessage('Language must be pt or en'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    handleValidationErrors,
  ],
  searchController.search
);

module.exports = router;
