const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const CreditEntry = require('../models/CreditEntry');
const { protect } = require('../middleware/auth');

// GET dashboard details (for frontend dashboard.js)
router.get('/', protect, async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments({ status: 'active' });
    const allCustomers = await Customer.find({ status: 'active' });
    
    // Calculate total outstanding balance
    const totalOutstanding = allCustomers.reduce((sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0), 0);

    // Calculate total credit and debit sum
    const transactions = await CreditEntry.find({ isDeleted: false });
    const totalCredit = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    const totalDebit = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);

    // Get top 5 customers by balance
    const topCustomers = await Customer.find({ status: 'active', currentBalance: { $gt: 0 } })
      .sort({ currentBalance: -1 })
      .limit(5);

    // Get recent 10 transactions
    const recentTransactions = await CreditEntry.find({ isDeleted: false })
      .populate('customerId', 'name customerCode')
      .populate('createdBy', 'name')
      .sort({ date: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        totalCustomers,
        totalCredit,
        totalDebit,
        totalOutstanding,
        recentTransactions,
        topCustomers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET dashboard stats (original compatibility endpoint)
router.get('/stats', protect, async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments({ status: 'active' });
    const allCustomers = await Customer.find({ status: 'active' });
    const totalCreditBalance = allCustomers.reduce((sum, c) => sum + c.currentBalance, 0);
    const outstandingAmount = allCustomers.filter(c => c.currentBalance > 0).reduce((sum, c) => sum + c.currentBalance, 0);

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const todayEntries = await CreditEntry.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd }, isDeleted: false,
    });

    // Last 30 days trend
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const trend = await CreditEntry.aggregate([
      { $match: { date: { $gte: thirtyDaysAgo }, isDeleted: false } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        credits: { $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] } },
        debits: { $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Monthly summary (last 6 months)
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const monthlySummary = await CreditEntry.aggregate([
      { $match: { date: { $gte: sixMonthsAgo }, isDeleted: false } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
        credits: { $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] } },
        debits: { $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] } },
      }},
      { $sort: { _id: 1 } }
    ]);

    // Recent 10 transactions
    const recentTransactions = await CreditEntry.find({ isDeleted: false })
      .populate('customerId', 'name customerCode')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: { totalCustomers, totalCreditBalance, outstandingAmount, todayEntries, trend, monthlySummary, recentTransactions },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
