const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const ScanService = require('../services/ScanService');

// Store active scans in memory (in production, use Redis or database)
const activScans = new Map();

// Start a new repository scan
router.post('/start', async (req, res) => {
  try {
    const { repoUrl, scanTypes = ['semgrep', 'trivy'] } = req.body;

    if (!repoUrl) {
      return res.status(400).json({
        error: 'Repository URL is required'
      });
    }

    const scanId = uuidv4();
    const scanJob = {
      id: scanId,
      repoUrl,
      scanTypes,
      status: 'started',
      startTime: new Date().toISOString(),
      progress: 0
    };

    activScans.set(scanId, scanJob);

    // Start the scan asynchronously
    ScanService.startScan(scanId, repoUrl, scanTypes)
      .then(results => {
        const scan = activScans.get(scanId);
        if (scan) {
          scan.status = 'completed';
          scan.endTime = new Date().toISOString();
          scan.results = results;
          scan.progress = 100;
        }
      })
      .catch(error => {
        const scan = activScans.get(scanId);
        if (scan) {
          scan.status = 'failed';
          scan.endTime = new Date().toISOString();
          scan.error = error.message;
          scan.progress = 0;
        }
      });

    res.json({
      scanId,
      status: 'started',
      message: 'Scan initiated successfully'
    });

  } catch (error) {
    console.error('Error starting scan:', error);
    res.status(500).json({
      error: 'Failed to start scan',
      message: error.message
    });
  }
});

// Get scan status and results
router.get('/status/:scanId', (req, res) => {
  const { scanId } = req.params;
  const scan = activScans.get(scanId);

  if (!scan) {
    return res.status(404).json({
      error: 'Scan not found'
    });
  }

  res.json(scan);
});

// List all scans
router.get('/list', (req, res) => {
  const scans = Array.from(activScans.values()).map(scan => ({
    id: scan.id,
    repoUrl: scan.repoUrl,
    status: scan.status,
    startTime: scan.startTime,
    endTime: scan.endTime,
    progress: scan.progress
  }));

  res.json({ scans });
});

module.exports = router;
