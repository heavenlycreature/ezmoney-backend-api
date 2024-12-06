const express = require('express');
const { signup, login, logout } = require('../controllers/authController');
const validateToken = require('../middleware/userMiddleware');
const {saveUserWallet, getUserMonthlyTransactions, deleteTransactionsRecords, updateSavingRecommendation, getUserTransactionsType} = require('../controllers/savingController');
const { getFinancialTrend, getIncomeDistribution, getExpensesDistribution, getMonthlyFinancialSummary, getMultiMonthTrend } = require('../controllers/analyticsController');
const router = express.Router();

router.get('/', (req, res) => {
    res.status(200).json({
        "message": "selamat kamu berhasil ter connect ke api"
    });
});

router.post('/register', signup);
router.post('/login', login);
router.post('/logout', logout);

// authenticated user method
router.post('/transactions/:userId', validateToken, saveUserWallet);
router.get('/transactions/:userId/:month', validateToken, getUserMonthlyTransactions);
router.get('/transactions/list/:userId/:month', validateToken, getUserTransactionsType)
router.put('/transactions/:userId/update-saving', validateToken, updateSavingRecommendation);
router.delete('/transactions/:transactionId/:month', validateToken, deleteTransactionsRecords);

// Financial analytics routes
router.get('/analytics/financial-trend/:userId/:month', validateToken, getFinancialTrend);
router.get('/analytics/income-distribution/:userId/:month', validateToken, getIncomeDistribution);
router.get('/analytics/expenses-distribution/:userId/:month', validateToken, getExpensesDistribution);
router.get('/analytics/monthly-summary/:userId/:month', validateToken, getMonthlyFinancialSummary);

module.exports = router;