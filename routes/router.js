const express = require('express');
const { signup, login, logout } = require('../controllers/authController');
const validateToken = require('../middleware/userMiddleware');
const saveUserWallet = require('../controllers/savingController');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// authenticated user method
router.post('/saving', validateToken, saveUserWallet);

module.exports = router;