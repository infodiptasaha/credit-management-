const mongoose = require('mongoose');

const openingBalanceSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  amount: { type: Number, required: true, default: 0 },
  date: { type: Date, required: true },
  remarks: { type: String, trim: true },
  setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('OpeningBalance', openingBalanceSchema);
