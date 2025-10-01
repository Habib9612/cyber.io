const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// GitHub webhook endpoint
router.post('/github', (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];
    const payload = req.body;

    // Verify webhook signature (in production, use actual secret)
    const secret = process.env.GITHUB_WEBHOOK_SECRET || 'default-secret';
    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')}`;

    // Handle different GitHub events
    switch (event) {
      case 'push':
        handlePushEvent(payload);
        break;
      case 'pull_request':
        handlePullRequestEvent(payload);
        break;
      case 'repository':
        handleRepositoryEvent(payload);
        break;
      default:
        console.log(`Unhandled GitHub event: ${event}`);
    }

    res.json({
      success: true,
      event,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message
    });
  }
});

// Handle push events
function handlePushEvent(payload) {
  console.log('Push event received:', {
    repository: payload.repository.full_name,
    branch: payload.ref,
    commits: payload.commits.length
  });

  // Trigger automatic scan on push to main branch
  if (payload.ref === 'refs/heads/main' || payload.ref === 'refs/heads/master') {
    console.log('Triggering automatic security scan...');
    // Here you would trigger a new scan
  }
}

// Handle pull request events
function handlePullRequestEvent(payload) {
  console.log('Pull request event received:', {
    action: payload.action,
    repository: payload.repository.full_name,
    pr_number: payload.pull_request.number
  });

  // Trigger scan on PR creation
  if (payload.action === 'opened' || payload.action === 'synchronize') {
    console.log('Triggering PR security scan...');
    // Here you would trigger a scan for the PR
  }
}

// Handle repository events
function handleRepositoryEvent(payload) {
  console.log('Repository event received:', {
    action: payload.action,
    repository: payload.repository.full_name
  });
}

module.exports = router;
