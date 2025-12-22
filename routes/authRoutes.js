const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const { authenticate } = require('../utils/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;