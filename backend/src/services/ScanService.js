const { execa } = require('execa');
const fs = require('fs-extra');
const path = require('path');
const simpleGit = require('simple-git');

class ScanService {
  constructor() {
    this.workDir = path.join(__dirname, '../../temp');
    this.ensureWorkDir();
  }

  async ensureWorkDir() {
    await fs.ensureDir(this.workDir);
  }

  async startScan(scanId, repoUrl, scanTypes) {
    console.log(`🔍 Starting scan ${scanId} for ${repoUrl}`);
    
    const scanDir = path.join(this.workDir, scanId);
    const repoDir = path.join(scanDir, 'repo');
    
    try {
      // Create scan directory
      await fs.ensureDir(scanDir);
      
      // Clone repository
      console.log(`📥 Cloning repository: ${repoUrl}`);
      await this.cloneRepository(repoUrl, repoDir);
      
      const results = {
        scanId,
        repoUrl,
        scanTypes,
        timestamp: new Date().toISOString(),
        findings: {}
      };

      // Run each requested scan type
      for (const scanType of scanTypes) {
        console.log(`🔎 Running ${scanType} scan...`);
        
        switch (scanType) {
          case 'semgrep':
            results.findings.semgrep = await this.runSemgrepScan(repoDir);
            break;
          case 'trivy':
            results.findings.trivy = await this.runTrivyScan(repoDir);
            break;
          default:
            console.warn(`Unknown scan type: ${scanType}`);
        }
      }

      // Calculate security score
      results.securityScore = this.calculateSecurityScore(results.findings);
      
      // Clean up
      await fs.remove(scanDir);
      
      console.log(`✅ Scan ${scanId} completed successfully`);
      return results;
      
    } catch (error) {
      console.error(`❌ Scan ${scanId} failed:`, error);
      
      // Clean up on error
      try {
        await fs.remove(scanDir);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      
      throw error;
    }
  }

  async cloneRepository(repoUrl, targetDir) {
    const git = simpleGit();
    await git.clone(repoUrl, targetDir, ['--depth', '1']);
  }

  async runSemgrepScan(repoDir) {
    try {
      const { stdout } = await execa('semgrep', [
        '--config=auto',
        '--json',
        '--quiet',
        repoDir
      ]);
      
      return JSON.parse(stdout);
    } catch (error) {
      // Semgrep returns non-zero exit code when findings are found
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout);
        } catch (parseError) {
          console.error('Failed to parse Semgrep output:', parseError);
          return { results: [], errors: [error.message] };
        }
      }
      
      console.error('Semgrep scan failed:', error);
      return { results: [], errors: [error.message] };
    }
  }

  async runTrivyScan(repoDir) {
    try {
      const { stdout } = await execa('trivy', [
        'fs',
        '--format=json',
        '--quiet',
        '--ignore-unfixed',
        '--severity=HIGH,CRITICAL',
        repoDir
      ]);
      
      return JSON.parse(stdout);
    } catch (error) {
      // Trivy returns non-zero exit code when findings are found
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout);
        } catch (parseError) {
          console.error('Failed to parse Trivy output:', parseError);
          return { Results: [], errors: [error.message] };
        }
      }
      
      console.error('Trivy scan failed:', error);
      return { Results: [], errors: [error.message] };
    }
  }

  calculateSecurityScore(findings) {
    let score = 100;
    let totalIssues = 0;

    // Count Semgrep findings
    if (findings.semgrep && findings.semgrep.results) {
      const semgrepIssues = findings.semgrep.results.length;
      totalIssues += semgrepIssues;
      score -= semgrepIssues * 5; // Deduct 5 points per SAST issue
    }

    // Count Trivy findings
    if (findings.trivy && findings.trivy.Results) {
      findings.trivy.Results.forEach(result => {
        if (result.Vulnerabilities) {
          const vulnCount = result.Vulnerabilities.length;
          totalIssues += vulnCount;
          score -= vulnCount * 3; // Deduct 3 points per vulnerability
        }
      });
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    return {
      score: Math.round(score),
      totalIssues,
      grade: this.getSecurityGrade(score)
    };
  }

  getSecurityGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}

module.exports = new ScanService();
