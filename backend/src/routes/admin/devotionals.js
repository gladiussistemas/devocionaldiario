const express = require('express');
const router = express.Router();
const devotionalController = require('../../controllers/admin/devotionalController');
const { authenticate, authorize } = require('../../middleware/auth');
const { body, query } = require('express-validator');
const { handleValidationErrors } = require('../../middleware/validator');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/admin/devotionals
 * @desc    Get all devotionals (including drafts)
 * @access  Private (editor, admin)
 */
router.get(
  '/',
  authorize('editor', 'admin'),
  devotionalController.getAll
);

/**
 * @route   GET /api/admin/devotionals/:id
 * @desc    Get devotional by ID
 * @access  Private (editor, admin)
 */
router.get(
  '/:id',
  authorize('editor', 'admin'),
  devotionalController.getById
);

/**
 * @route   POST /api/admin/devotionals
 * @desc    Create new devotional
 * @access  Private (editor, admin)
 */
router.post(
  '/',
  authorize('editor', 'admin'),
  [
    body('slug').notEmpty().withMessage('Slug is required'),
    body('publication_date').isDate().withMessage('Valid publication date is required'),
    body('contents').isArray({ min: 1 }).withMessage('At least one content is required'),
    body('contents.*.language').isIn(['pt', 'en']).withMessage('Language must be pt or en'),
    body('contents.*.title').notEmpty().withMessage('Title is required'),
    body('contents.*.content').notEmpty().withMessage('Content is required'),
    body('contents.*.prayer').notEmpty().withMessage('Prayer is required'),
    handleValidationErrors,
  ],
  devotionalController.create
);

/**
 * @route   PUT /api/admin/devotionals/:id
 * @desc    Update devotional
 * @access  Private (editor, admin)
 */
router.put(
  '/:id',
  authorize('editor', 'admin'),
  devotionalController.update
);

/**
 * @route   DELETE /api/admin/devotionals/:id
 * @desc    Delete devotional
 * @access  Private (admin)
 */
router.delete(
  '/:id',
  authorize('admin'),
  devotionalController.remove
);

/**
 * @route   PATCH /api/admin/devotionals/:id/publish
 * @desc    Publish/unpublish devotional
 * @access  Private (editor, admin)
 */
router.patch(
  '/:id/publish',
  authorize('editor', 'admin'),
  [
    body('is_published').isBoolean().withMessage('is_published must be boolean'),
    handleValidationErrors,
  ],
  devotionalController.togglePublish
);

module.exports = router;
