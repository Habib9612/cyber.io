const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs-extra');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../static')));

// Import routes
const scanRoutes = require('./routes/scan');
const healthRoutes = require('./routes/health');
const autofixRoutes = require('./routes/autofix');
const webhookRoutes = require('./routes/webhook');
const authRoutes = require('./routes/auth');

// Use routes
app.use('/api/scan', scanRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/autofix', autofixRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/auth', authRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CyberSecScan Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../static/index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 CyberSecScan Backend listening at http://localhost:${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
