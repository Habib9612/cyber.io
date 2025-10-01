const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// In-memory storage for fixes (in production, use a proper database)
const fixes = new Map();

// Generate AI fixes for scan results
router.post('/generate/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;
    const { repoUrl, scanResults } = req.body;

    if (!scanResults) {
      return res.status(400).json({
        error: 'Scan results are required'
      });
    }

    const fixId = uuidv4();
    const fixRecord = {
      id: fixId,
      scanId,
      repoUrl,
      status: 'generating',
      fixes: [],
      startTime: new Date().toISOString()
    };

    fixes.set(fixId, fixRecord);

    // Generate fixes asynchronously
    generateFixes(fixId, scanResults);

    res.json({
      fixId,
      status: 'generating',
      message: 'Fix generation started'
    });

  } catch (error) {
    console.error('Fix generation error:', error);
    res.status(500).json({
      error: 'Failed to generate fixes',
      message: error.message
    });
  }
});

// Get fix status and results
router.get('/status/:fixId', (req, res) => {
  try {
    const { fixId } = req.params;
    const fix = fixes.get(fixId);

    if (!fix) {
      return res.status(404).json({
        error: 'Fix not found'
      });
    }

    res.json(fix);

  } catch (error) {
    console.error('Fix status error:', error);
    res.status(500).json({
      error: 'Failed to get fix status',
      message: error.message
    });
  }
});

// Create GitHub PR with fixes
router.post('/create-pr/:fixId', async (req, res) => {
  try {
    const { fixId } = req.params;
    const { repoUrl } = req.body;

    const fix = fixes.get(fixId);
    if (!fix) {
      return res.status(404).json({
        error: 'Fix not found'
      });
    }

    if (fix.status !== 'completed') {
      return res.status(400).json({
        error: 'Fixes are not ready yet'
      });
    }

    // Mock PR creation (in production, use GitHub API)
    const prData = {
      number: Math.floor(Math.random() * 1000) + 1,
      title: 'Security fixes from Cyber.io',
      body: generatePRDescription(fix.fixes),
      url: `${repoUrl}/pull/${Math.floor(Math.random() * 1000) + 1}`,
      createdAt: new Date().toISOString()
    };

    fix.pullRequest = prData;

    res.json({
      success: true,
      pullRequest: prData,
      message: 'Pull request created successfully'
    });

  } catch (error) {
    console.error('PR creation error:', error);
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

    // Mock repository info (in production, use GitHub API)
    const repoInfo = {
      name: repoUrl.split('/').pop().replace('.git', ''),
      fullName: repoUrl.split('/').slice(-2).join('/').replace('.git', ''),
      description: 'A security-focused application',
      language: 'JavaScript',
      stars: Math.floor(Math.random() * 1000),
      forks: Math.floor(Math.random() * 100),
      lastUpdated: new Date().toISOString()
    };

    res.json(repoInfo);

  } catch (error) {
    console.error('Repo info error:', error);
    res.status(500).json({
      error: 'Failed to get repository information',
      message: error.message
    });
  }
});

// Generate fixes using AI
async function generateFixes(fixId, scanResults) {
  const fix = fixes.get(fixId);

  try {
    fix.status = 'processing';
    const generatedFixes = [];

    // Process Semgrep findings
    if (scanResults.semgrep && scanResults.semgrep.findings) {
      for (const finding of scanResults.semgrep.findings) {
        const fixSuggestion = await generateFixForFinding(finding, 'semgrep');
        if (fixSuggestion) {
          generatedFixes.push(fixSuggestion);
        }
      }
    }

    // Process Trivy vulnerabilities
    if (scanResults.trivy && scanResults.trivy.vulnerabilities) {
      for (const vuln of scanResults.trivy.vulnerabilities) {
        const fixSuggestion = await generateFixForVulnerability(vuln);
        if (fixSuggestion) {
          generatedFixes.push(fixSuggestion);
        }
      }
    }

    fix.fixes = generatedFixes;
    fix.status = 'completed';
    fix.endTime = new Date().toISOString();

  } catch (error) {
    console.error('Fix generation error:', error);
    fix.status = 'failed';
    fix.error = error.message;
    fix.endTime = new Date().toISOString();
  }
}

// Generate fix for Semgrep finding
async function generateFixForFinding(finding, scanner) {
  try {
    // Mock AI-generated fix (in production, use actual AI API)
    const fixes = {
      'javascript.lang.security.audit.xss.direct-response-write': {
        description: 'Sanitize user input to prevent XSS attacks',
        code: `// Before: res.write(userInput);
// After: 
const sanitizeHtml = require('sanitize-html');
res.write(sanitizeHtml(userInput));`,
        confidence: 0.9
      },
      'javascript.express.security.audit.express-cookie-session-no-httponly': {
        description: 'Add httpOnly flag to cookie configuration',
        code: `// Before: app.use(session({ secret: 'secret' }));
// After:
app.use(session({ 
  secret: 'secret',
  cookie: { httpOnly: true, secure: true }
}));`,
        confidence: 0.95
      }
    };

    const fixTemplate = fixes[finding.rule_id] || {
      description: `Fix for ${finding.message}`,
      code: '// AI-generated fix would be provided here',
      confidence: 0.7
    };

    return {
      id: uuidv4(),
      scanner,
      ruleId: finding.rule_id,
      severity: finding.severity,
      file: finding.path,
      line: finding.line,
      description: fixTemplate.description,
      originalCode: '// Original vulnerable code',
      fixedCode: fixTemplate.code,
      confidence: fixTemplate.confidence,
      explanation: `This fix addresses the ${finding.severity.toLowerCase()} severity issue: ${finding.message}`
    };

  } catch (error) {
    console.error('Error generating fix for finding:', error);
    return null;
  }
}

// Generate fix for Trivy vulnerability
async function generateFixForVulnerability(vuln) {
  try {
    return {
      id: uuidv4(),
      scanner: 'trivy',
      vulnerabilityId: vuln.VulnerabilityID,
      severity: vuln.Severity,
      package: vuln.PkgName,
      currentVersion: vuln.InstalledVersion,
      fixedVersion: vuln.FixedVersion,
      description: `Update ${vuln.PkgName} to fix ${vuln.VulnerabilityID}`,
      originalCode: `"${vuln.PkgName}": "${vuln.InstalledVersion}"`,
      fixedCode: `"${vuln.PkgName}": "${vuln.FixedVersion}"`,
      confidence: 0.98,
      explanation: `${vuln.Title}. Update to version ${vuln.FixedVersion} to resolve this ${vuln.Severity.toLowerCase()} severity vulnerability.`
    };

  } catch (error) {
    console.error('Error generating fix for vulnerability:', error);
    return null;
  }
}

// Generate PR description
function generatePRDescription(fixes) {
  let description = '# 🔒 Security Fixes from Cyber.io\n\n';
  description += 'This pull request contains automated security fixes generated by AI.\n\n';
  description += '## 📋 Summary\n\n';
  description += `- **Total fixes**: ${fixes.length}\n`;
  description += `- **High confidence fixes**: ${fixes.filter(f => f.confidence > 0.8).length}\n`;
  description += `- **Average confidence**: ${(fixes.reduce((sum, f) => sum + f.confidence, 0) / fixes.length * 100).toFixed(1)}%\n\n`;

  description += '## 🛠️ Fixes Applied\n\n';
  fixes.forEach((fix, index) => {
    description += `### ${index + 1}. ${fix.description}\n`;
    description += `- **File**: \`${fix.file || fix.package}\`\n`;
    description += `- **Severity**: ${fix.severity}\n`;
    description += `- **Confidence**: ${(fix.confidence * 100).toFixed(1)}%\n`;
    description += `- **Explanation**: ${fix.explanation}\n\n`;
  });

  description += '---\n';
  description += '*Generated by [Cyber.io](https://cyber.io) - AI-Powered Security Platform*';

  return description;
}

module.exports = router;
