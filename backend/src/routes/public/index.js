const express = require('express');
const router = express.Router();
const searchController = require('../../controllers/public/searchController');

// Import route modules
const devotionalsRouter = require('./devotionals');
const authorsRouter = require('./authors');
const themesRouter = require('./themes');
const searchRouter = require('./search');

// Mount routes
router.use('/devotionals', devotionalsRouter);
router.use('/authors', authorsRouter);
router.use('/themes', themesRouter);
router.use('/search', searchRouter);

// Stats endpoint
router.get('/stats', searchController.getStats);

module.exports = router;
