const express = require('express');
const router = express.Router();
const OpeningBalance = require('../models/OpeningBalance');
const Customer = require('../models/Customer');
const { protect, authorize } = require('../middleware/auth');

// GET opening balances
router.get('/', protect, async (req, res) => {
  try {
    const { customerId } = req.query;
    const query = {};
    if (customerId) query.customerId = customerId;
    const balances = await OpeningBalance.find(query)
      .populate('customerId', 'name customerCode')
      .populate('setBy', 'name username')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: balances });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST set opening balance
router.post('/', protect, authorize('admin', 'operator'), async (req, res) => {
  try {
    const { customerId, amount, date, remarks } = req.body;
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

    const balance = await OpeningBalance.create({
      customerId, amount: Number(amount), date, remarks, setBy: req.user._id,
    });
    customer.currentBalance = Number(amount);
    await customer.save({ validateBeforeSave: false });

    res.status(201).json({ success: true, data: balance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT update opening balance
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const balance = await OpeningBalance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!balance) return res.status(404).json({ success: false, message: 'Opening balance not found.' });
    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
