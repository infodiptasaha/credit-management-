const mongoose = require('mongoose');

const creditEntrySchema = new mongoose.Schema({
  transactionNo: { type: String, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  date: { type: Date, required: true, default: Date.now },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true, min: 0.01 },
  description: { type: String, trim: true },
  previousBalance: { type: Number, default: 0 },
  newBalance: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date },
  editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  editedAt: { type: Date },
}, { timestamps: true });

creditEntrySchema.pre('save', async function() {
  if (!this.transactionNo) {
    const count = await mongoose.model('CreditEntry').countDocuments();
    const year = new Date().getFullYear();
    this.transactionNo = `TXN-${year}-${String(count + 1).padStart(6, '0')}`;
  }
});

module.exports = mongoose.model('CreditEntry', creditEntrySchema);
