const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  };

  res.json(healthData);
});

module.exports = router;
