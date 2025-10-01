const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const simpleGit = require('simple-git');

// In-memory storage for scans (in production, use a proper database)
const scans = new Map();

// Start a new scan
router.post('/start', async (req, res) => {
  try {
    const { repoUrl, scanTypes = ['semgrep', 'trivy'] } = req.body;

    if (!repoUrl) {
      return res.status(400).json({
        error: 'Repository URL is required'
      });
    }

    const scanId = uuidv4();
    const tempDir = path.join(__dirname, '../../temp', scanId);

    // Initialize scan record
    const scanRecord = {
      id: scanId,
      repoUrl,
      scanTypes,
      status: 'started',
      progress: 0,
      results: {},
      startTime: new Date().toISOString(),
      tempDir
    };

    scans.set(scanId, scanRecord);

    // Start scanning process asynchronously
    performScan(scanId, repoUrl, scanTypes, tempDir);

    res.json({
      scanId,
      status: 'started',
      message: 'Scan initiated successfully'
    });

  } catch (error) {
    console.error('Scan start error:', error);
    res.status(500).json({
      error: 'Failed to start scan',
      message: error.message
    });
  }
});

// Get scan status and results
router.get('/status/:scanId', (req, res) => {
  try {
    const { scanId } = req.params;
    const scan = scans.get(scanId);

    if (!scan) {
      return res.status(404).json({
        error: 'Scan not found'
      });
    }

    res.json(scan);

  } catch (error) {
    console.error('Scan status error:', error);
    res.status(500).json({
      error: 'Failed to get scan status',
      message: error.message
    });
  }
});

// List all scans
router.get('/list', (req, res) => {
  try {
    const scanList = Array.from(scans.values()).map(scan => ({
      id: scan.id,
      repoUrl: scan.repoUrl,
      status: scan.status,
      progress: scan.progress,
      startTime: scan.startTime,
      endTime: scan.endTime
    }));

    res.json({
      scans: scanList,
      total: scanList.length
    });

  } catch (error) {
    console.error('Scan list error:', error);
    res.status(500).json({
      error: 'Failed to get scan list',
      message: error.message
    });
  }
});

// Perform the actual scanning
async function performScan(scanId, repoUrl, scanTypes, tempDir) {
  const scan = scans.get(scanId);
  
  try {
    // Update status
    scan.status = 'cloning';
    scan.progress = 10;

    // Create temp directory
    await fs.ensureDir(tempDir);

    // Clone repository
    const git = simpleGit();
    await git.clone(repoUrl, tempDir);

    scan.status = 'scanning';
    scan.progress = 30;

    const results = {};

    // Run Semgrep scan
    if (scanTypes.includes('semgrep')) {
      try {
        scan.progress = 50;
        const semgrepResult = await runSemgrep(tempDir);
        results.semgrep = semgrepResult;
      } catch (error) {
        results.semgrep = { error: error.message };
      }
    }

    // Run Trivy scan
    if (scanTypes.includes('trivy')) {
      try {
        scan.progress = 70;
        const trivyResult = await runTrivy(tempDir);
        results.trivy = trivyResult;
      } catch (error) {
        results.trivy = { error: error.message };
      }
    }

    // Complete scan
    scan.status = 'completed';
    scan.progress = 100;
    scan.results = results;
    scan.endTime = new Date().toISOString();

    // Calculate security score
    scan.securityScore = calculateSecurityScore(results);

    // Clean up temp directory
    setTimeout(() => {
      fs.remove(tempDir).catch(console.error);
    }, 300000); // Clean up after 5 minutes

  } catch (error) {
    console.error('Scan error:', error);
    scan.status = 'failed';
    scan.error = error.message;
    scan.endTime = new Date().toISOString();
  }
}

// Run Semgrep scan
async function runSemgrep(repoPath) {
  try {
    // Mock Semgrep results for demo (replace with actual semgrep command)
    return {
      findings: [
        {
          rule_id: 'javascript.lang.security.audit.xss.direct-response-write',
          severity: 'WARNING',
          message: 'Potential XSS vulnerability detected',
          path: 'src/app.js',
          line: 42,
          confidence: 'HIGH'
        },
        {
          rule_id: 'javascript.express.security.audit.express-cookie-session-no-httponly',
          severity: 'INFO',
          message: 'Cookie session without httpOnly flag',
          path: 'src/server.js',
          line: 15,
          confidence: 'MEDIUM'
        }
      ],
      summary: {
        total: 2,
        high: 0,
        medium: 1,
        low: 1
      }
    };
  } catch (error) {
    throw new Error(`Semgrep scan failed: ${error.message}`);
  }
}

// Run Trivy scan
async function runTrivy(repoPath) {
  try {
    // Mock Trivy results for demo (replace with actual trivy command)
    return {
      vulnerabilities: [
        {
          VulnerabilityID: 'CVE-2021-44228',
          PkgName: 'log4j-core',
          InstalledVersion: '2.14.1',
          FixedVersion: '2.15.0',
          Severity: 'CRITICAL',
          Title: 'Apache Log4j2 JNDI features do not protect against attacker controlled LDAP'
        },
        {
          VulnerabilityID: 'CVE-2022-23307',
          PkgName: 'log4j-core',
          InstalledVersion: '2.14.1',
          FixedVersion: '2.17.1',
          Severity: 'HIGH',
          Title: 'Apache Log4j2 deserialization of untrusted data'
        }
      ],
      summary: {
        total: 2,
        critical: 1,
        high: 1,
        medium: 0,
        low: 0
      }
    };
  } catch (error) {
    throw new Error(`Trivy scan failed: ${error.message}`);
  }
}

// Calculate security score based on findings
function calculateSecurityScore(results) {
  let score = 100;
  let grade = 'A';

  // Deduct points for Semgrep findings
  if (results.semgrep && results.semgrep.findings) {
    results.semgrep.findings.forEach(finding => {
      switch (finding.severity) {
        case 'ERROR':
          score -= 15;
          break;
        case 'WARNING':
          score -= 10;
          break;
        case 'INFO':
          score -= 5;
          break;
      }
    });
  }

  // Deduct points for Trivy vulnerabilities
  if (results.trivy && results.trivy.vulnerabilities) {
    results.trivy.vulnerabilities.forEach(vuln => {
      switch (vuln.Severity) {
        case 'CRITICAL':
          score -= 20;
          break;
        case 'HIGH':
          score -= 15;
          break;
        case 'MEDIUM':
          score -= 10;
          break;
        case 'LOW':
          score -= 5;
          break;
      }
    });
  }

  // Determine grade
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return {
    score: Math.max(0, score),
    grade,
    timestamp: new Date().toISOString()
  };
}

module.exports = router;
