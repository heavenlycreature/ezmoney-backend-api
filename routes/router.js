const express = require('express');
const { signup, login, logout } = require('../controllers/authController');
const validateToken = require('../middleware/userMiddleware');
const {saveUserWallet, getUserMonthlyTransactions, deleteTransactionsRecords, updateSavingRecommendation} = require('../controllers/savingController');
const router = express.Router();

router.get('/', (req, res) => {
    res.status(200).json({
        "message": "selamat kamu berhasil ter connect ke api"
    });
});

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// authenticated user method
router.post('/transactions/:userId', validateToken, saveUserWallet);
router.get('/transactions/:userId/:month', validateToken, getUserMonthlyTransactions);
router.put('/transactions/:userId/update-saving', validateToken, updateSavingRecommendation);
router.delete('/transactions/:transactionId/:month', validateToken, deleteTransactionsRecords);

module.exports = router;