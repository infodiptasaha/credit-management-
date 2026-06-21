require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const connectDB = require('./src/config/db');

const seed = async () => {
  await connectDB();
  try {
    const existing = await User.findOne({ username: 'admin' });
    if (existing) {
      console.log('✅ Admin user already exists. Skipping seed.');
      process.exit(0);
    }
    await User.create({
      username: 'admin',
      name: 'System Administrator',
      email: 'admin@creditmanagement.com',
      password: 'Admin@123',
      role: 'admin',
      isActive: true,
    });
    console.log('✅ Default admin created: username=admin, password=Admin@123');
    console.log('⚠️  Please change the password after first login!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seed();
