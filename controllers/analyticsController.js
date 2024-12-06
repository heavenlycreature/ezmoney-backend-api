const { db } = require('../config/database');

// Utility functions for data transformation
const transformRecords = (records, type) =>
  records.filter(record => record.type === type).map(record => ({
    date: record.date,
    amount: record.amount,
    category: record.category,
    subCategory: record.subCategory,
  }));

const groupByCategory = (records, type) =>
  records
    .filter(record => record.type === type)
    .reduce((acc, record) => {
      const category = record.category;
      acc[category] = (acc[category] || 0) + record.amount;
      return acc;
    }, {});

/**
 * Get user financial trend
 */
async function getFinancialTrend(req, res) {
  try {
    const { userId, month } = req.params;

    const monthDocRef = db
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .doc(month);

    const monthSnapshot = await monthDocRef.get();
    const monthData = monthSnapshot.data() || {};
    const recordsRef = monthDocRef.collection('records');
    const recordSnapshot = await recordsRef.get();
    const records = recordSnapshot.docs.map(doc => doc.data()) || [];
    console.log(records);

    const incomeData = transformRecords(records, 'income');
    const expensesData = transformRecords(records, 'expenses');

    const financialTrend = {
      income: incomeData,
      expenses: expensesData,
      savings: monthData.saving || 0,
      totalIncome: monthData.totalIncome || 0,
      totalExpenses: monthData.totalExpenses || 0,
      netCashFlow: (monthData.totalIncome || 0) - (monthData.totalExpenses || 0),
    };

    res.status(200).json(financialTrend);
  } catch (error) {
    console.error('Financial Trend Error:', error);
    res.status(500).json({
      message: 'Failed to retrieve financial trend',
      error: error.message,
    });
  }
}

/**
 * Get income distribution
 */
async function getIncomeDistribution(req, res) {
  try {
    const { userId, month } = req.params;

    const recordsRef = db
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .doc(month)
      .collection('records');

    const snapshot = await recordsRef.get();
    const records = snapshot.docs.map(doc => doc.data());

    const incomeByCategory = groupByCategory(records, 'income');

    const incomeDistribution = {
      categories: Object.keys(incomeByCategory),
      amounts: Object.values(incomeByCategory),
      totalIncome: Object.values(incomeByCategory).reduce((a, b) => a + b, 0),
    };

    res.status(200).json(incomeDistribution);
  } catch (error) {
    console.error('Income Distribution Error:', error);
    res.status(500).json({
      message: 'Failed to retrieve income distribution',
      error: error.message,
    });
  }
}

/**
 * Get expenses distribution
 */
async function getExpensesDistribution(req, res) {
  try {
    const { userId, month } = req.params;

    const recordsRef = db
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .doc(month)
      .collection('records');

    const snapshot = await recordsRef.get();
    const records = snapshot.docs.map(doc => doc.data());

    const expensesByCategory = groupByCategory(records, 'expenses');

    const expensesDistribution = {
      categories: Object.keys(expensesByCategory),
      amounts: Object.values(expensesByCategory),
      totalExpenses: Object.values(expensesByCategory).reduce((a, b) => a + b, 0),
    };

    res.status(200).json(expensesDistribution);
  } catch (error) {
    console.error('Expenses Distribution Error:', error);
    res.status(500).json({
      message: 'Failed to retrieve expenses distribution',
      error: error.message,
    });
  }
}

/**
 * Get monthly financial summary
 */
async function getMonthlyFinancialSummary(req, res) {
  try {
    const { userId, month } = req.params;

    const recordsRef = db
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .doc(month)
      .collection('records');

    const snapshot = await recordsRef.get();
    const records = snapshot.docs.map(doc => doc.data());

    const incomeByCategory = groupByCategory(records, 'income');
    const expensesByCategory = groupByCategory(records, 'expenses');

    const monthlySummary = {
      totalIncome: Object.values(incomeByCategory).reduce((a, b) => a + b, 0),
      totalExpenses: Object.values(expensesByCategory).reduce((a, b) => a + b, 0),
      netCashFlow:
        Object.values(incomeByCategory).reduce((a, b) => a + b, 0) -
        Object.values(expensesByCategory).reduce((a, b) => a + b, 0),
      savings: 0,
      recommendedSavings: 0,
      incomeBreakdown: {
        categories: Object.keys(incomeByCategory),
        amounts: Object.values(incomeByCategory),
      },
      expensesBreakdown: {
        categories: Object.keys(expensesByCategory),
        amounts: Object.values(expensesByCategory),
      },
    };

    res.status(200).json(monthlySummary);
  } catch (error) {
    console.error('Monthly Summary Error:', error);
    res.status(500).json({
      message: 'Failed to retrieve monthly financial summary',
      error: error.message,
    });
  }
}


module.exports = {
  getFinancialTrend,
  getIncomeDistribution,
  getExpensesDistribution,
  getMonthlyFinancialSummary,
};
