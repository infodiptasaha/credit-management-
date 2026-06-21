const ActivityLog = require('../models/ActivityLog');

const logActivity = (action, entity) => async (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode < 400 && req.user) {
      try {
        await ActivityLog.create({
          userId: req.user._id,
          username: req.user.username,
          action,
          entity,
          entityId: req.params.id || res.locals.entityId,
          details: res.locals.logDetails || {},
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
        });
      } catch (err) {
        console.error('Activity log error:', err.message);
      }
    }
  });
  next();
};

module.exports = { logActivity };
