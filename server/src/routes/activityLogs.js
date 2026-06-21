const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, userId } = req.query;
    const query = userId ? { userId } : {};
    const logs = await ActivityLog.find(query)
      .populate('userId', 'name username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await ActivityLog.countDocuments(query);
    res.json({ success: true, data: logs, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
