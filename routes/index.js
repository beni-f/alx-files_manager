const express = require('express');
const AppController = require('../controllers/AppController');

const router = express.Router();

const { getStatus } = AppController;
const { getStats } = AppController;

router.get('/status', getStatus);
router.get('/stats', getStats);

module.exports = router;
