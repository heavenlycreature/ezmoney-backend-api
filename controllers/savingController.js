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

    const previousMonthsQuery = userCollection.doc(userId).collection('transactions').orderBy('lastUpdated', 'desc').limit(1);
    const previousMonthSnapshot = await previousMonthsQuery.get();

    let previousBalance = 0;
    let previousSavingBalance = 0;
    if (!previousMonthSnapshot.empty) {
      const previousMonthDoc = previousMonthSnapshot.docs[0];
      previousBalance = previousMonthDoc.data().balance || 0;
      previousSavingBalance = previousMonthDoc.data().savingBalance || 0;
    }

    const monthlySummaryRef = userCollection.doc(userId).collection('transactions').doc(monthYear);
    const monthlySummaryDoc = await monthlySummaryRef.get();

    let updatedSummary;
    let newSavingBalance = previousSavingBalance;

    if (category === 'saving') {
      newSavingBalance += parsedAmount;
    }

    if (!monthlySummaryDoc.exists) {
      updatedSummary = {
        month: humanizedMonth,
        totalIncome: type === 'income' ? parsedAmount : 0,
        totalExpenses: type === 'expenses' ? parsedAmount : 0,
        balance: previousBalance + (type === 'income' ? parsedAmount : -parsedAmount),
        saving: parsedSaving,
        savingBalance: newSavingBalance,
        recommendedSavings: type === 'income' ? Math.round(parsedAmount * (parsedSaving / 100)) : 0,
        savingRate: 0,
        lastUpdated: isoDate,
        previousMonthBalance: previousBalance
      };

      updatedSummary.savingRate = updatedSummary.recommendedSavings
        ? Math.round((newSavingBalance / updatedSummary.recommendedSavings) * 100)
        : 0;

      await monthlySummaryRef.set(updatedSummary);
    } else {
      const currentSummary = monthlySummaryDoc.data();

      const newTotalIncome = type === 'income' ? currentSummary.totalIncome + parsedAmount : currentSummary.totalIncome;
      const newTotalExpenses = type === 'expenses' ? currentSummary.totalExpenses + parsedAmount : currentSummary.totalExpenses;
      const newBalance = type === 'income' ? currentSummary.balance + parsedAmount : currentSummary.balance - parsedAmount;

      const finalSaving = parsedSaving || currentSummary.saving || 0;
      const recommendedSavings = type === 'income' && currentSummary.totalIncome === 0
        ? Math.round(parsedAmount * (finalSaving / 100))
        : currentSummary.recommendedSavings;

      updatedSummary = {
        ...currentSummary,
        totalIncome: newTotalIncome,
        totalExpenses: newTotalExpenses,
        balance: newBalance,
        saving: finalSaving,
        savingBalance: newSavingBalance,
        recommendedSavings,
        savingRate: recommendedSavings ? Math.round((newSavingBalance / recommendedSavings) * 100) : 0,
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
        recommendedSavings: updatedSummary.recommendedSavings,
        savingRate: updatedSummary.savingRate,
        savingBalance: updatedSummary.savingBalance
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
    return res.status(403).json({ status: 'fail', message: 'Unauthorized access' });
  }

  if (saving === undefined || saving < 1 || saving > 100) {
    return res.status(400).json({ status: 'fail', message: 'Saving must be a number between 1 and 100' });
  }

  const parsedSaving = Math.round(Number(saving));

  try {
    const currentDate = new Date();
    const monthYear = currentDate.toISOString().slice(0, 7);
    const monthlySummaryRef = userCollection.doc(userId).collection('transactions').doc(monthYear);

    const monthlySummaryDoc = await monthlySummaryRef.get();
    if (!monthlySummaryDoc.exists) {
      return res.status(404).json({ status: 'fail', message: 'Monthly summary not found' });
    }

    const currentSummary = monthlySummaryDoc.data();
    const newRecommendedSavings = Math.round(currentSummary.balance * (parsedSaving / 100));
    const newSavingRate = newRecommendedSavings ? Math.round((currentSummary.savingBalance / newRecommendedSavings) * 100) : 0;

    await monthlySummaryRef.update({
      saving: parsedSaving,
      recommendedSavings: newRecommendedSavings,
      savingRate: newSavingRate,
      lastUpdated: currentDate.toISOString()
    });

    return res.status(200).json({
      status: 'success',
      message: 'Saving recommendation updated successfully',
      data: {
        saving: parsedSaving,
        recommendedSavings: newRecommendedSavings,
        savingRate: newSavingRate
      }
    });
  } catch (err) {
    console.error('Error updating saving recommendation:', err);
    return res.status(500).json({ status: 'fail', message: 'Failed to update saving recommendation', error: err.message });
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
  
  const getUserTransactionsType = async (req, res) => {
    try {
      const { userId, month } = req.params;
      const { type } = req.query;
      
      // Validate month format
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(month)) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid month format',
        });
      }
      
      // Validate user authorization from token
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication token missing or invalid',
        });
      }
      
      // Validate transaction type
      if (type && !['income', 'expenses'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transaction type. Must be "income" or "expenses"',
        });
      }
      
      // Get monthly summary
      const monthlySummaryRef = userCollection
      .doc(userId)
      .collection('transactions')
      .doc(month);
  
      const summaryDoc = await monthlySummaryRef.get();
      const summary = summaryDoc.exists ? summaryDoc.data() : null;
      
      // Get transactions reference
      const monthlyTransactionsRef = monthlySummaryRef.collection('records');
      
      // Fetch all transactions and filter in memory
      const transactionsSnapshot = await monthlyTransactionsRef.orderBy('date', 'desc').get();
      
      const transactions = [];
      transactionsSnapshot.forEach(doc => {
        const docData = doc.data();
        // Filter by type if specified
        if (!type || docData.type === type) {
          transactions.push({
            id: doc.id,
            ...docData,
          });
        }
      });
  
      // Calculate summary based on filtered transactions
      const filteredSummary = summary ? { ...summary } : {
        month,
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        lastUpdated: null,
      };
      
      // If type is specified, adjust summary accordingly
      if (type === 'income') {
        filteredSummary.totalExpenses = 0;
      } else if (type === 'expenses') {
        filteredSummary.totalIncome = 0;
      }
      
      return res.status(200).json({
        success: true,
        data: {
          summary: filteredSummary,
          transactions,
          totalTransactions: transactions.length,
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
  const deleteTransactionsRecords = async (req, res) => {
    const { transactionId, month } = req.params;
    const { userId } = req.user;

    try {
        const userDocRef = userCollection.doc(userId);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        const transactionRef = userDocRef
            .collection('transactions')
            .doc(month)
            .collection('records')
            .doc(transactionId);

        const transactionDoc = await transactionRef.get();
        if (!transactionDoc.exists) {
            return res.status(404).json({ status: 'fail', message: 'Transaction not found' });
        }

        const transactionData = transactionDoc.data();
        const { type, amount, category } = transactionData;

        const monthlySummaryRef = userDocRef.collection('transactions').doc(month);
        const monthlySummaryDoc = await monthlySummaryRef.get();
        if (!monthlySummaryDoc.exists) {
            return res.status(404).json({ status: 'fail', message: 'Monthly summary not found' });
        }

        const currentSummary = monthlySummaryDoc.data();

        const isIncome = type === 'income';
        let updatedTotalIncome = currentSummary.totalIncome;
        let updatedTotalExpenses = currentSummary.totalExpenses;
        let updatedBalance = currentSummary.balance;

        if (isIncome) {
            updatedTotalIncome -= amount;
            updatedBalance = Math.max(0, updatedBalance - amount);
        } else {
            updatedTotalExpenses -= amount;
            updatedBalance = Math.max(0, updatedBalance + amount);
        }

        let updatedSavingBalance = currentSummary.savingBalance || 0;
        let updatedSavingRate = currentSummary.savingRate || 0;

        if (category === 'saving') {
            updatedSavingBalance = Math.max(0, updatedSavingBalance - amount);
            updatedSavingRate = updatedSavingBalance; // Assuming savingRate reflects savingBalance
        }

        const updatedSummary = {
            ...currentSummary,
            totalIncome: updatedTotalIncome,
            totalExpenses: updatedTotalExpenses,
            balance: updatedBalance,
            savingBalance: updatedSavingBalance,
            savingRate: updatedSavingRate,
            lastUpdated: new Date().toISOString(),
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
                updatedSummary,
            },
        });
    } catch (err) {
        console.error('Error deleting wallet transaction:', err);
        return res.status(500).json({
            status: 'fail',
            message: 'Failed to delete transaction',
            error: err.message,
        });
    }
};

module.exports = {saveUserWallet, getUserMonthlyTransactions, deleteTransactionsRecords, updateSavingRecommendation, getUserTransactionsType};
