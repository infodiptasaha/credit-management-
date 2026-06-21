const express = require('express');
const router = express.Router();
const CreditEntry = require('../models/CreditEntry');
const Customer = require('../models/Customer');
const { protect, authorize } = require('../middleware/auth');

// GET all credit entries
router.get('/', protect, async (req, res) => {
  try {
    const { customerId, type, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = { isDeleted: false };
    if (customerId) query.customerId = customerId;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }
    const entries = await CreditEntry.find(query)
      .populate('customerId', 'name customerCode')
      .populate('createdBy', 'name username')
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await CreditEntry.countDocuments(query);
    res.json({ success: true, data: entries, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create credit entry
router.post('/', protect, authorize('admin', 'operator'), async (req, res) => {
  try {
    const { customerId, amount, type, date, description } = req.body;
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

    const previousBalance = customer.currentBalance;
    let newBalance;

    if (type === 'credit') {
      newBalance = previousBalance + Number(amount);
    } else {
      newBalance = previousBalance - Number(amount);
      if (newBalance < 0 && customer.creditLimit > 0 && Math.abs(newBalance) > customer.creditLimit) {
        return res.status(400).json({ success: false, message: 'Transaction exceeds available credit limit.' });
      }
    }

    const entry = await CreditEntry.create({
      customerId, amount: Number(amount), type, date, description,
      previousBalance, newBalance, createdBy: req.user._id,
    });

    customer.currentBalance = newBalance;
    await customer.save({ validateBeforeSave: false });

    const populated = await CreditEntry.findById(entry._id)
      .populate('customerId', 'name customerCode')
      .populate('createdBy', 'name username');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT update credit entry
router.put('/:id', protect, authorize('admin', 'operator'), async (req, res) => {
  try {
    const entry = await CreditEntry.findById(req.params.id);
    if (!entry || entry.isDeleted) return res.status(404).json({ success: false, message: 'Entry not found.' });

    const customer = await Customer.findById(entry.customerId);
    // Reverse old effect
    let balance = customer.currentBalance;
    if (entry.type === 'credit') balance -= entry.amount;
    else balance += entry.amount;

    // Apply new effect
    const { amount, type, description, date } = req.body;
    if (type === 'credit') balance += Number(amount);
    else balance -= Number(amount);

    const previousBalance = entry.type === 'credit'
      ? customer.currentBalance - entry.amount
      : customer.currentBalance + entry.amount;

    entry.amount = Number(amount);
    entry.type = type;
    entry.description = description;
    entry.date = date;
    entry.previousBalance = previousBalance;
    entry.newBalance = balance;
    entry.editedBy = req.user._id;
    entry.editedAt = new Date();
    await entry.save();

    customer.currentBalance = balance;
    await customer.save({ validateBeforeSave: false });

    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE (soft delete) credit entry
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const entry = await CreditEntry.findById(req.params.id);
    if (!entry || entry.isDeleted) return res.status(404).json({ success: false, message: 'Entry not found.' });

    const customer = await Customer.findById(entry.customerId);
    if (entry.type === 'credit') customer.currentBalance -= entry.amount;
    else customer.currentBalance += entry.amount;

    entry.isDeleted = true;
    entry.deletedBy = req.user._id;
    entry.deletedAt = new Date();
    await entry.save();
    await customer.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Entry deleted and balance reversed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
