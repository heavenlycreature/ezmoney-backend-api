const { userCollection } = require('../config/database');

const saveUserWallet = async (req, res) => {
    const { userId } = req.params;
    const { income, expenses, catIncome, catExpenses } = req.body;
    const date = new Date();
    const monthYear = date.toISOString().slice(0, 7);
    const isoDate = date.toISOString();

    if (!income && !expenses) {
        return res.status(400).json({
            success: false,
            message: 'Tolong input pemasukan/pengeluaran yang jelas'
        });
    }

    if (userId !== req.user.userId) {
        return res.status(403).json({
            success: false,
            message: 'Unauthorized access'
        });
    }

    try {
        // Verify user exists
        const userDoc = await userCollection.doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        // Get reference to user's monthly transactions subcollection
        const monthlyTransactionsRef = userCollection
        .doc(userId)
        .collection('transactions')
        .doc(monthYear)
        .collection('records');

        // Create transaction data
        const transactionData = {
        date: isoDate,
        catIncome: catIncome || '',
        catExpenses: catExpenses || '',
        income: income || 0,
        expenses: expenses || 0,
        createdAt: isoDate
        };

        // Add transaction to monthly transactions subcollection
        const newTransactionRef = await monthlyTransactionsRef.add(transactionData);

        // Get/update monthly summary
        const monthlySummaryRef = userCollection
        .doc(userId)
        .collection('transactions')
        .doc(monthYear);

        const monthlySummaryDoc = await monthlySummaryRef.get();

        let updatedSummary;
        if (!monthlySummaryDoc.exists) {
        // Create new monthly summary if it doesn't exist
        updatedSummary = {
            month: monthYear,
            totalIncome: income || 0,
            totalExpenses: expenses || 0,
            balance: (income || 0) - (expenses || 0),
            lastUpdated: isoDate
        };
        await monthlySummaryRef.set(updatedSummary);
        } else {
        // Update existing monthly summary
        const currentSummary = monthlySummaryDoc.data();
        updatedSummary = {
            ...currentSummary,
            totalIncome: currentSummary.totalIncome + (income || 0),
            totalExpenses: currentSummary.totalExpenses + (expenses || 0),
            balance: (currentSummary.totalIncome + (income || 0)) - 
                    (currentSummary.totalExpenses + (expenses || 0)),
            lastUpdated: isoDate
        };
        await monthlySummaryRef.update(updatedSummary);
        }

        return res.status(201).json({
        success: true,
        message: 'Transaction saved successfully',
        data: {
            transactionId: newTransactionRef.id,
            ...transactionData,
            currentBalance: updatedSummary.balance
        }
        });
    } catch (err) {
        console.error('Error saving wallet transaction:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to save transaction',
            error: err.message
        });
    }
}

const getUserMonthlyTransactions = async (req, res) => {
    try {
        const { userId, month } = req.params;
        const { limit = 10, startAfter } = req.query;

        // Validate month format
        const monthRegex = /^\d{4}-\d{2}$/;
        if (!monthRegex.test(month)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid month format. Use YYYY-MM format (e.g., 2024-11)'
            });
        }

        // Validate user authorization from token
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token missing or invalid'
            });
        }

        // Get monthly transactions
        const monthlySummaryRef = userCollection
            .doc(userId)
            .collection('transactions')
            .doc(month);

        const summaryDoc = await monthlySummaryRef.get();
        const summary = summaryDoc.exists ? summaryDoc.data() : null;

        // Get transactions with pagination
        const monthlyTransactionsRef = monthlySummaryRef.collection('records');
        let query = monthlyTransactionsRef
            .orderBy('date', 'desc')
            .limit(parseInt(limit));

        if (startAfter) {
            const startAfterDoc = await monthlyTransactionsRef.doc(startAfter).get();
            if (startAfterDoc.exists) {
                query = query.startAfter(startAfterDoc);
            }
        }

        const transactionsSnapshot = await query.get();
        const transactions = [];
        transactionsSnapshot.forEach(doc => {
            transactions.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return res.status(200).json({
            success: true,
            data: {
                summary: summary || {
                    month,
                    totalIncome: 0,
                    totalExpenses: 0,
                    balance: 0,
                    lastUpdated: null
                },
                transactions,
                lastDoc: transactions.length > 0 ? transactions[transactions.length - 1].id : null
            }
        });

    } catch (err) {
        console.error('Error in getUserMonthlyTransactions:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch monthly transactions',
            error: err.message
        });
    }
};

module.exports = {saveUserWallet, getUserMonthlyTransactions};