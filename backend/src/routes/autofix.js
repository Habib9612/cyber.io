const express = require('express');
const router = express.Router();
const AutoFixService = require('../services/AutoFixService');
const GitHubService = require('../services/GitHubService');
const ScanService = require('../services/ScanService');

// Generate fixes for scan results
router.post('/generate/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;
    const { repoUrl, scanResults } = req.body;

    if (!scanResults) {
      return res.status(400).json({
        error: 'Scan results are required'
      });
    }

    console.log(`🤖 Generating fixes for scan ${scanId}`);
    
    // Create temporary directory for the repository
    const tempDir = `/tmp/autofix-${scanId}`;
    
    // Clone repository for fix generation
    await ScanService.cloneRepository(repoUrl, tempDir);
    
    // Generate AI-powered fixes
    const fixes = await AutoFixService.generateFixes(scanResults, tempDir);
    
    // Clean up temporary directory
    await require('fs-extra').remove(tempDir);

    res.json({
      scanId,
      fixesGenerated: fixes.length,
      fixes: fixes.map(fix => ({
        type: fix.type,
        file: fix.file,
        issue: fix.issue,
        severity: fix.severity,
        confidence: fix.confidence,
        explanation: fix.explanation
      }))
    });

  } catch (error) {
    console.error('Error generating fixes:', error);
    res.status(500).json({
      error: 'Failed to generate fixes',
      message: error.message
    });
  }
});

// Create pull request with fixes
router.post('/create-pr/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;
    const { repoUrl, fixes } = req.body;

    if (!repoUrl || !fixes || fixes.length === 0) {
      return res.status(400).json({
        error: 'Repository URL and fixes are required'
      });
    }

    console.log(`🔀 Creating PR for scan ${scanId} with ${fixes.length} fixes`);

    // Create pull request with fixes
    const prResult = await GitHubService.createFixPR(repoUrl, fixes, scanId);

    if (!prResult) {
      return res.json({
        message: 'No high-confidence fixes to apply',
        appliedFixes: 0
      });
    }

    res.json({
      scanId,
      prUrl: prResult.prUrl,
      prNumber: prResult.prNumber,
      branch: prResult.branch,
      appliedFixes: prResult.appliedFixes,
      message: 'Pull request created successfully'
    });

  } catch (error) {
    console.error('Error creating PR:', error);
    res.status(500).json({
      error: 'Failed to create pull request',
      message: error.message
    });
  }
});

// Get repository information
router.get('/repo-info', async (req, res) => {
  try {
    const { repoUrl } = req.query;

    if (!repoUrl) {
      return res.status(400).json({
        error: 'Repository URL is required'
      });
    }

    const repoInfo = await GitHubService.getRepositoryInfo(repoUrl);
    res.json(repoInfo);

  } catch (error) {
    console.error('Error getting repository info:', error);
    res.status(500).json({
      error: 'Failed to get repository information',
      message: error.message
    });
  }
});

module.exports = router;
