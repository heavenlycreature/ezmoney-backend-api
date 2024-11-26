const express = require('express');
const { signup, login, logout } = require('../controllers/authController');
const validateToken = require('../middleware/userMiddleware');
const {saveUserWallet, getUserMonthlyTransactions} = require('../controllers/savingController');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// authenticated user method
router.post('/:userId/transactions', validateToken, saveUserWallet);
router.get('/:userId/transactions/:month', validateToken, getUserMonthlyTransactions);

module.exports = router;