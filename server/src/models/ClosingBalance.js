const mongoose = require('mongoose');

const closingBalanceSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  date: { type: Date, required: true },
  openingBalance: { type: Number, default: 0 },
  totalCredits: { type: Number, default: 0 },
  totalDebits: { type: Number, default: 0 },
  closingBalance: { type: Number, default: 0 },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('ClosingBalance', closingBalanceSchema);
