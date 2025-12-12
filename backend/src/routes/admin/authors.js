const express = require('express');
const router = express.Router();
const authorController = require('../../controllers/admin/authorController');
const { authenticate, authorize } = require('../../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../../middleware/validator');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/admin/authors
 * @desc    Get all authors
 * @access  Private (editor, admin)
 */
router.get('/', authorize('editor', 'admin'), authorController.getAll);

/**
 * @route   GET /api/admin/authors/:id
 * @desc    Get author by ID
 * @access  Private (editor, admin)
 */
router.get('/:id', authorize('editor', 'admin'), authorController.getById);

/**
 * @route   POST /api/admin/authors
 * @desc    Create new author
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
  authorController.create
);

/**
 * @route   PUT /api/admin/authors/:id
 * @desc    Update author
 * @access  Private (editor, admin)
 */
router.put('/:id', authorize('editor', 'admin'), authorController.update);

/**
 * @route   DELETE /api/admin/authors/:id
 * @desc    Delete author
 * @access  Private (admin)
 */
router.delete('/:id', authorize('admin'), authorController.remove);

module.exports = router;
