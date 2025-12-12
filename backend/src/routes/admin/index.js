const express = require('express');
const router = express.Router();

// Import route modules
const authRouter = require('./auth');
const devotionalsRouter = require('./devotionals');
const authorsRouter = require('./authors');
const themesRouter = require('./themes');

// Mount routes
router.use('/auth', authRouter);
router.use('/devotionals', devotionalsRouter);
router.use('/authors', authorsRouter);
router.use('/themes', themesRouter);

module.exports = router;
