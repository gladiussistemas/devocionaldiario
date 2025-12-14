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
    body('publish_date').isDate().withMessage('Valid publish date is required'),
    body('day_number').optional().isInt().withMessage('Day number must be an integer'),
    body('estimated_duration_minutes').optional().isInt().withMessage('Duration must be an integer'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('contents').isArray({ min: 1 }).withMessage('At least one content is required'),
    body('contents.*.language').isIn(['pt', 'en']).withMessage('Language must be pt or en'),
    body('contents.*.title').notEmpty().withMessage('Title is required'),
    body('contents.*.teaching_content').notEmpty().withMessage('Teaching content is required'),
    body('contents.*.closing_prayer').notEmpty().withMessage('Closing prayer is required'),
    body('contents.*.quote_author').optional().isString(),
    body('contents.*.quote_text').optional().isString(),
    body('contents.*.reflection_questions').optional().isArray().withMessage('Reflection questions must be an array'),
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

/**
 * @route   POST /api/admin/devotionals/translate
 * @desc    Translate devotional content from PT to EN using DeepL
 * @access  Private (editor, admin)
 */
router.post(
  '/translate',
  authorize('editor', 'admin'),
  [
    body('content').isObject().withMessage('Content object is required'),
    body('biblical_references').optional().isArray(),
    handleValidationErrors,
  ],
  devotionalController.translate
);

module.exports = router;
