const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerCode: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, trim: true },
  creditLimit: { type: Number, default: 0, min: 0 },
  currentBalance: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

customerSchema.pre('save', async function() {
  if (!this.customerCode) {
    const count = await mongoose.model('Customer').countDocuments();
    this.customerCode = `CUST-${String(count + 1).padStart(5, '0')}`;
  }
});

module.exports = mongoose.model('Customer', customerSchema);
