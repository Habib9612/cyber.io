const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const ScanService = require('../services/ScanService');
const AutoFixService = require('../services/AutoFixService');
const GitHubService = require('../services/GitHubService');

// Webhook secret for verifying GitHub signatures
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

// Middleware to verify GitHub webhook signatures
const verifySignature = (req, res, next) => {
  if (!WEBHOOK_SECRET) {
    console.warn('GitHub webhook secret not configured');
    return next();
  }

  const signature = req.get('X-Hub-Signature-256');
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(req.body, 'utf8')
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
};

// GitHub webhook endpoint
router.post('/github', express.raw({ type: 'application/json' }), verifySignature, async (req, res) => {
  try {
    const event = req.get('X-GitHub-Event');
    const payload = JSON.parse(req.body);

    console.log(`Received GitHub webhook: ${event}`);

    switch (event) {
      case 'push':
        await handlePushEvent(payload);
        break;
      
      case 'pull_request':
        await handlePullRequestEvent(payload);
        break;
      
      case 'installation':
        await handleInstallationEvent(payload);
        break;
      
      case 'repository':
        await handleRepositoryEvent(payload);
        break;
      
      default:
        console.log(`Unhandled event type: ${event}`);
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handlePushEvent(payload) {
  const { repository, ref, commits } = payload;
  
  // Only scan pushes to main/master branch
  if (!ref.endsWith('/main') && !ref.endsWith('/master')) {
    console.log('Skipping scan for non-main branch push');
    return;
  }

  // Skip if no commits or only merge commits
  if (!commits || commits.length === 0) {
    console.log('No commits to scan');
    return;
  }

  console.log(`Starting automated scan for push to ${repository.full_name}`);
  
  try {
    // Start security scan
    const scanId = `webhook-${Date.now()}`;
    const scanResults = await ScanService.startScan(
      scanId,
      repository.clone_url,
      ['semgrep', 'trivy']
    );

    // If vulnerabilities found, generate fixes and create PR
    if (scanResults.securityScore.totalIssues > 0) {
      console.log(`Found ${scanResults.securityScore.totalIssues} issues, generating fixes...`);
      
      const fixes = await AutoFixService.generateFixes(scanResults, '/tmp/scan-' + scanId);
      
      if (fixes.length > 0) {
        const prResult = await GitHubService.createFixPR(
          repository.clone_url,
          fixes,
          scanId
        );
        
        if (prResult) {
          console.log(`Created PR #${prResult.prNumber} with ${prResult.appliedFixes} fixes`);
        }
      }
    }
  } catch (error) {
    console.error('Automated scan failed:', error);
  }
}

async function handlePullRequestEvent(payload) {
  const { action, pull_request, repository } = payload;
  
  // Only scan when PR is opened or synchronized (new commits)
  if (action !== 'opened' && action !== 'synchronize') {
    return;
  }

  console.log(`Scanning PR #${pull_request.number} in ${repository.full_name}`);
  
  try {
    // Clone the PR branch for scanning
    const prBranch = pull_request.head.ref;
    const repoUrl = repository.clone_url;
    
    const scanId = `pr-${pull_request.number}-${Date.now()}`;
    const scanResults = await ScanService.startScan(scanId, repoUrl, ['semgrep', 'trivy']);
    
    // Post scan results as PR comment
    await postPRComment(repository, pull_request.number, scanResults);
    
  } catch (error) {
    console.error('PR scan failed:', error);
  }
}

async function handleInstallationEvent(payload) {
  const { action, installation, repositories } = payload;
  
  console.log(`GitHub App ${action} for installation ${installation.id}`);
  
  if (action === 'created') {
    console.log(`App installed on ${repositories?.length || 0} repositories`);
    // Could trigger initial scans for all repositories
  }
}

async function handleRepositoryEvent(payload) {
  const { action, repository } = payload;
  
  if (action === 'added') {
    console.log(`Repository ${repository.full_name} added to installation`);
    // Could trigger initial security scan
  }
}

async function postPRComment(repository, prNumber, scanResults) {
  const { securityScore, findings } = scanResults;
  
  let comment = `## 🔒 CyberSecScan Security Report\n\n`;
  comment += `**Security Score:** ${securityScore.score}/100 (Grade: ${securityScore.grade})\n`;
  comment += `**Issues Found:** ${securityScore.totalIssues}\n\n`;
  
  if (findings.semgrep?.results?.length > 0) {
    comment += `### 🔍 SAST Findings (${findings.semgrep.results.length})\n`;
    findings.semgrep.results.slice(0, 5).forEach(finding => {
      comment += `- **${finding.severity}**: ${finding.message} in \`${finding.path}\`\n`;
    });
    
    if (findings.semgrep.results.length > 5) {
      comment += `- ... and ${findings.semgrep.results.length - 5} more\n`;
    }
    comment += '\n';
  }
  
  if (findings.trivy?.Results?.length > 0) {
    const vulns = findings.trivy.Results.flatMap(r => r.Vulnerabilities || []);
    if (vulns.length > 0) {
      comment += `### 📦 Vulnerability Findings (${vulns.length})\n`;
      vulns.slice(0, 5).forEach(vuln => {
        comment += `- **${vuln.Severity}**: ${vuln.VulnerabilityID} in \`${vuln.PkgName}\`\n`;
      });
      
      if (vulns.length > 5) {
        comment += `- ... and ${vulns.length - 5} more\n`;
      }
    }
  }
  
  comment += `\n---\n*Automated security scan by [CyberSecScan](https://github.com/Habib9612/cyber.io)*`;
  
  // Post comment using GitHub API
  try {
    await GitHubService.createPRComment(repository.full_name, prNumber, comment);
  } catch (error) {
    console.error('Failed to post PR comment:', error);
  }
}

module.exports = router;
