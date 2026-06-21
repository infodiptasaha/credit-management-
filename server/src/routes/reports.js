const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const CreditEntry = require('../models/CreditEntry');
const OpeningBalance = require('../models/OpeningBalance');
const ClosingBalance = require('../models/ClosingBalance');
const { protect } = require('../middleware/auth');

// Customer Credit Summary
router.get('/credit-summary', protect, async (req, res) => {
  try {
    const customers = await Customer.find({ status: 'active' }).sort({ name: 1 });
    const data = customers.map(c => ({
      customerCode: c.customerCode, name: c.name, phone: c.phone,
      creditLimit: c.creditLimit, currentBalance: c.currentBalance,
      status: c.status,
    }));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Outstanding Balance Report
router.get('/outstanding', protect, async (req, res) => {
  try {
    const customers = await Customer.find({ status: 'active', currentBalance: { $gt: 0 } }).sort({ currentBalance: -1 });
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Date-wise Credit Report
router.get('/date-wise', protect, async (req, res) => {
  try {
    const { startDate, endDate, customerId } = req.query;
    const query = { isDeleted: false };
    if (customerId) query.customerId = customerId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }
    const entries = await CreditEntry.find(query)
      .populate('customerId', 'name customerCode phone')
      .populate('createdBy', 'name')
      .sort({ date: -1 });
    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Monthly Credit Report
router.get('/monthly', protect, async (req, res) => {
  try {
    const { year, month } = req.query;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    const entries = await CreditEntry.find({ date: { $gte: start, $lte: end }, isDeleted: false })
      .populate('customerId', 'name customerCode')
      .sort({ date: 1 });
    const summary = await CreditEntry.aggregate([
      { $match: { date: { $gte: start, $lte: end }, isDeleted: false } },
      { $group: {
        _id: '$customerId',
        totalCredits: { $sum: { $cond: [{ $eq: ['$type','credit'] }, '$amount', 0] } },
        totalDebits: { $sum: { $cond: [{ $eq: ['$type','debit'] }, '$amount', 0] } },
        count: { $sum: 1 }
      }}
    ]);
    res.json({ success: true, data: entries, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Customer Ledger
router.get('/ledger/:customerId', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const customer = await Customer.findById(req.params.customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
    const query = { customerId: req.params.customerId, isDeleted: false };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }
    const entries = await CreditEntry.find(query)
      .populate('createdBy', 'name')
      .sort({ date: 1, createdAt: 1 });
    const openingBalance = await OpeningBalance.findOne({ customerId: req.params.customerId }).sort({ date: -1 });
    res.json({ success: true, customer, entries, openingBalance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Opening Balance Report
router.get('/opening-balances', protect, async (req, res) => {
  try {
    const balances = await OpeningBalance.find()
      .populate('customerId', 'name customerCode phone')
      .populate('setBy', 'name')
      .sort({ date: -1 });
    res.json({ success: true, data: balances });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Closing Balance Report
router.get('/closing-balances', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }
    const balances = await ClosingBalance.find(query)
      .populate('customerId', 'name customerCode phone')
      .populate('generatedBy', 'name')
      .sort({ date: -1 });
    res.json({ success: true, data: balances });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Daily Collection Report
router.get('/daily-collection', protect, async (req, res) => {
  try {
    const { date } = req.query;
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59, 999);
    const entries = await CreditEntry.find({ date: { $gte: start, $lte: end }, isDeleted: false })
      .populate('customerId', 'name customerCode phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: 1 });
    const totalCredits = entries.filter(e => e.type === 'credit').reduce((s, e) => s + e.amount, 0);
    const totalDebits = entries.filter(e => e.type === 'debit').reduce((s, e) => s + e.amount, 0);
    res.json({ success: true, data: entries, totalCredits, totalDebits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
