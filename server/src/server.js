require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const creditEntryRoutes = require('./routes/creditEntries');
const openingBalanceRoutes = require('./routes/openingBalance');
const closingBalanceRoutes = require('./routes/closingBalance');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const activityLogRoutes = require('./routes/activityLogs');

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
const corsOptions = {
  origin: (origin, callback) => {
    // Allow any origin — update ALLOWED_ORIGINS in .env to restrict
    const allowed = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [];
    if (!origin || allowed.length === 0 || allowed.includes('*') || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'Credit Management API running ✅', timestamp: new Date() }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/credit-entries', creditEntryRoutes);
app.use('/api/opening-balance', openingBalanceRoutes);
app.use('/api/closing-balance', closingBalanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activity-logs', activityLogRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app;
