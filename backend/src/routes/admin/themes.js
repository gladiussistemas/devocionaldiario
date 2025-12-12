const express = require('express');
const router = express.Router();
const themeController = require('../../controllers/admin/themeController');
const { authenticate, authorize } = require('../../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../../middleware/validator');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/admin/themes
 * @desc    Get all themes
 * @access  Private (editor, admin)
 */
router.get('/', authorize('editor', 'admin'), themeController.getAll);

/**
 * @route   GET /api/admin/themes/:id
 * @desc    Get theme by ID
 * @access  Private (editor, admin)
 */
router.get('/:id', authorize('editor', 'admin'), themeController.getById);

/**
 * @route   POST /api/admin/themes
 * @desc    Create new theme
 * @access  Private (editor, admin)
 */
router.post(
  '/',
  authorize('editor', 'admin'),
  [
    body('slug').notEmpty().withMessage('Slug is required'),
    body('translations').isArray({ min: 1 }).withMessage('At least one translation is required'),
    body('translations.*.language').isIn(['pt', 'en']).withMessage('Language must be pt or en'),
    body('translations.*.name').notEmpty().withMessage('Name is required'),
    handleValidationErrors,
  ],
  themeController.create
);

/**
 * @route   PUT /api/admin/themes/:id
 * @desc    Update theme
 * @access  Private (editor, admin)
 */
router.put('/:id', authorize('editor', 'admin'), themeController.update);

/**
 * @route   DELETE /api/admin/themes/:id
 * @desc    Delete theme
 * @access  Private (admin)
 */
router.delete('/:id', authorize('admin'), themeController.remove);

module.exports = router;
