const express = require('express');
const router = express.Router();
const ClosingBalance = require('../models/ClosingBalance');
const CreditEntry = require('../models/CreditEntry');
const Customer = require('../models/Customer');
const { protect, authorize } = require('../middleware/auth');

// GET closing balances
router.get('/', protect, async (req, res) => {
  try {
    const { customerId, date } = req.query;
    const query = {};
    if (customerId) query.customerId = customerId;
    if (date) {
      const d = new Date(date);
      query.date = { $gte: new Date(d.setHours(0,0,0,0)), $lte: new Date(d.setHours(23,59,59,999)) };
    }
    const balances = await ClosingBalance.find(query)
      .populate('customerId', 'name customerCode')
      .populate('generatedBy', 'name username')
      .sort({ date: -1 });
    res.json({ success: true, data: balances });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST calculate and save closing balance
router.post('/calculate', protect, authorize('admin', 'operator'), async (req, res) => {
  try {
    const { customerId, date } = req.body;
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const entries = await CreditEntry.find({
      customerId,
      date: { $gte: startOfDay, $lte: endOfDay },
      isDeleted: false,
    });

    const totalCredits = entries.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);
    const totalDebits = entries.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);

    // Opening = current balance before today's entries
    const openingBalance = customer.currentBalance - totalCredits + totalDebits;
    const closingBalance = openingBalance + totalCredits - totalDebits;

    const existing = await ClosingBalance.findOne({ customerId, date: { $gte: startOfDay, $lte: endOfDay } });
    let closing;
    if (existing) {
      existing.openingBalance = openingBalance;
      existing.totalCredits = totalCredits;
      existing.totalDebits = totalDebits;
      existing.closingBalance = closingBalance;
      existing.generatedBy = req.user._id;
      closing = await existing.save();
    } else {
      closing = await ClosingBalance.create({
        customerId, date, openingBalance, totalCredits, totalDebits,
        closingBalance, generatedBy: req.user._id,
      });
    }
    res.json({ success: true, data: closing });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
