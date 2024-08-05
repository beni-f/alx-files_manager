const express = require('express');
const { getStats, getStatus } = require('../controllers/AppController');
const { postNew } = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');

const router = express.Router();

router.get('/status', getStatus);
router.get('/stats', getStats);
router.post('/users', postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', AuthController.getMe);

module.exports = router;
