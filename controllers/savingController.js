const { userCollection, db } = require('../config/database');

// Helper function to convert numeric month to human-readable month name
const getHumanizedMonthName = (monthIndex) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[monthIndex];
};

const saveUserWallet = async (req, res) => {
    const { userId } = req.params;
    const { type, category, subCategory, amount, note, saving } = req.body;

    if (userId !== req.user.userId) {
        return res.status(403).json({ status: 'fail', message: 'Unauthorized access' });
    }

    if (!type || !category || !amount) {
        return res.status(400).json({ status: 'fail', message: 'Please provide type, category, and amount' });
    }

    const parsedSaving = saving !== undefined ? Math.max(0, Math.min(100, Number(saving))) : 0;
    const parsedAmount = Math.abs(Number(amount));
    const currentDate = new Date();
    const monthYear = currentDate.toISOString().slice(0, 7);
    const isoDate = currentDate.toISOString();
    const humanizedMonth = getHumanizedMonthName(currentDate.getMonth());

    try {
        const userDoc = await userCollection.doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        const transactionData = {
            type,
            category,
            subCategory: subCategory || '',
            amount: parsedAmount,
            note: note || '',
            date: isoDate,
            createdAt: isoDate,
            saving: parsedSaving
        };

        const monthlyTransactionsRef = userCollection.doc(userId).collection('transactions').doc(monthYear).collection('records');
        const newTransactionRef = await monthlyTransactionsRef.add(transactionData);

        const monthlySummaryRef = userCollection.doc(userId).collection('transactions').doc(monthYear);
        const monthlySummaryDoc = await monthlySummaryRef.get();
        let updatedSummary;

        if (!monthlySummaryDoc.exists) {
            updatedSummary = {
                month: humanizedMonth,
                totalIncome: type === 'income' ? parsedAmount : 0,
                totalExpenses: type === 'expenses' ? parsedAmount : 0,
                balance: Math.max(0, type === 'income' ? parsedAmount : -parsedAmount),
                saving: parsedSaving,
                recommendedSavings: type === 'income' ? Math.round(parsedAmount * (parsedSaving / 100)) : 0,
                lastUpdated: isoDate
            };
            await monthlySummaryRef.set(updatedSummary);
        } else {
            const currentSummary = monthlySummaryDoc.data();
            const newTotalIncome = type === 'income' ? currentSummary.totalIncome + parsedAmount : currentSummary.totalIncome;
            const newTotalExpenses = type === 'expenses' ? currentSummary.totalExpenses + parsedAmount : currentSummary.totalExpenses;
            const newBalance = Math.max(
                0,
                type === 'income'
                    ? currentSummary.balance + parsedAmount
                    : currentSummary.balance - parsedAmount
            );
            const finalSaving = parsedSaving || currentSummary.saving || 0;
            const recommendedSavings =
                type === 'income' && currentSummary.totalIncome === 0
                    ? Math.round(parsedAmount * (finalSaving / 100))
                    : currentSummary.recommendedSavings;

            updatedSummary = {
                ...currentSummary,
                totalIncome: newTotalIncome,
                totalExpenses: newTotalExpenses,
                balance: newBalance,
                saving: finalSaving,
                recommendedSavings,
                lastUpdated: isoDate
            };

            await monthlySummaryRef.update(updatedSummary);
        }

        return res.status(201).json({
            status: 'success',
            message: 'Transaction saved successfully',
            data: {
                transactionId: newTransactionRef.id,
                ...transactionData,
                currentBalance: updatedSummary.balance,
                recommendedSavings: updatedSummary.recommendedSavings
            }
        });
    } catch (err) {
        console.error('Error saving wallet transaction:', err);
        return res.status(500).json({ status: 'fail', message: 'Failed to save transaction', error: err.message });
    }
};

  const updateSavingRecommendation = async (req, res) => {
    const { userId } = req.params;
    const { saving } = req.body;
  
    if (userId !== req.user.userId) {
      return res.status(403).json({
        status: 'fail',
        message: 'Unauthorized access',
      });
    }
  
    if (saving === undefined || saving < 1 || saving > 100) {
      return res.status(400).json({
        status: 'fail',
        message: 'Saving must be a number between 1 and 100',
      });
    }
  
    const parsedSaving = Math.round(Number(saving));
  
    try {
      const currentDate = new Date();
      const monthYear = currentDate.toISOString().slice(0, 7);
      const monthlySummaryRef = userCollection
        .doc(userId)
        .collection('transactions')
        .doc(monthYear);
  
      const monthlySummaryDoc = await monthlySummaryRef.get();
      if (!monthlySummaryDoc.exists) {
        return res.status(404).json({
          status: 'fail',
          message: 'Monthly summary not found',
        });
      }
  
      const currentSummary = monthlySummaryDoc.data();
      const newRecommendedSavings = Math.round(currentSummary.balance * (parsedSaving / 100));
  
      await monthlySummaryRef.update({
        saving: parsedSaving,
        recommendedSavings: newRecommendedSavings,
        lastUpdated: currentDate.toISOString(),
      });
  
      return res.status(200).json({
        status: 'success',
        message: 'Saving recommendation updated successfully',
        data: {
          saving: parsedSaving,
          recommendedSavings: newRecommendedSavings,
        },
      });
    } catch (err) {
      console.error('Error updating saving recommendation:', err);
      return res.status(500).json({
        status: 'fail',
        message: 'Failed to update saving recommendation',
        error: err.message,
      });
    }
  };
  

  const deleteTransactionsRecords = async (req, res) => {
    const { transactionId, month } = req.params;
    const { userId } = req.user;

    const userDoc = await userCollection.doc(userId).get();
    if (!userDoc.exists) {
        return res.status(404).json({ status: 'fail', message: 'User not found' });
    }

    try {
        const transactionRef = await userCollection
            .doc(userId)
            .collection('transactions')
            .doc(month)
            .collection('records')
            .doc(transactionId);

        const transactionDoc = await transactionRef.get();
        if (!transactionDoc.exists) {
            return res.status(404).json({ status: 'fail', message: 'Transaction not found' });
        }

        const transactionData = transactionDoc.data();
        const monthYear = month;

        const monthlySummaryRef = userCollection.doc(userId).collection('transactions').doc(monthYear);
        const monthlySummaryDoc = await monthlySummaryRef.get();
        if (!monthlySummaryDoc.exists) {
            return res.status(404).json({ status: 'fail', message: 'Monthly summary not found' });
        }

        const currentSummary = monthlySummaryDoc.data();
        const isIncome = transactionData.type === 'income';
        const amount = transactionData.amount;

        const updatedSummary = {
            ...currentSummary,
            totalIncome: isIncome ? currentSummary.totalIncome - amount : currentSummary.totalIncome,
            totalExpenses: isIncome ? currentSummary.totalExpenses : currentSummary.totalExpenses - amount,
            balance: Math.max(0, isIncome ? currentSummary.balance - amount : currentSummary.balance + amount),
            lastUpdated: new Date().toISOString()
        };

        const batch = db.batch();
        batch.delete(transactionRef);
        batch.update(monthlySummaryRef, updatedSummary);
        await batch.commit();

        return res.status(200).json({
            status: 'success',
            message: 'Transaction deleted successfully',
            data: {
                deletedTransactionId: transactionId,
                updatedSummary
            }
        });
    } catch (err) {
        console.error('Error deleting wallet transaction:', err);
        return res.status(500).json({ status: 'fail', message: 'Failed to delete transaction', error: err.message });
    }
};

const getUserMonthlyTransactions = async (req, res) => {
    try {
      const { userId, month } = req.params;
      const { limit = 10, startAfter, transactionId } = req.query;
  
      // Validate month format
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(month)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid month format. Use YYYY-MM format (e.g., 2024-11)',
        });
      }
  
      // Validate user authorization from token
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication token missing or invalid',
        });
      }
  
      // Get monthly summary
      const monthlySummaryRef = userCollection
        .doc(userId)
        .collection('transactions')
        .doc(month);
  
      const summaryDoc = await monthlySummaryRef.get();
      const summary = summaryDoc.exists ? summaryDoc.data() : null;
  
      // Get transactions with pagination or specific transaction
      const monthlyTransactionsRef = monthlySummaryRef.collection('records');
      let query = monthlyTransactionsRef.orderBy('date', 'desc');
  
      if (transactionId) {
        // Query for a specific transaction ID
        const specificTransactionDoc = await monthlyTransactionsRef.doc(transactionId).get();
        if (!specificTransactionDoc.exists) {
          return res.status(404).json({
            success: false,
            message: `Transaction with ID ${transactionId} not found`,
          });
        }
        return res.status(200).json({
          success: true,
          data: {
            summary: summary || {
              month,
              totalIncome: 0,
              totalExpenses: 0,
              balance: 0,
              lastUpdated: null,
            },
            transactions: [
              {
                id: specificTransactionDoc.id,
                ...specificTransactionDoc.data(),
              },
            ],
            lastDoc: specificTransactionDoc.id,
          },
        });
      }
  
      // Apply pagination if no specific transaction ID is provided
      query = query.limit(parseInt(limit));
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
          ...doc.data(),
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
            lastUpdated: null,
          },
          transactions,
          lastDoc: transactions.length > 0 ? transactions[transactions.length - 1].id : null,
        },
      });
    } catch (err) {
      console.error('Error in getUserMonthlyTransactions:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch monthly transactions',
        error: err.message,
      });
    }
  };
  
module.exports = {saveUserWallet, getUserMonthlyTransactions, deleteTransactionsRecords, updateSavingRecommendation};