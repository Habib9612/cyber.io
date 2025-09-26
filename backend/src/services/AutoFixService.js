const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class AutoFixService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.AI_MODEL || 'gpt-4o-mini';
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
  }

  async generateFixes(scanResults, repoPath) {
    console.log('🤖 Starting AI-powered auto-fix generation...');
    
    const fixes = [];
    
    // Process Semgrep findings
    if (scanResults.semgrep && scanResults.semgrep.results) {
      for (const finding of scanResults.semgrep.results) {
        try {
          const fix = await this.generateSemgrepFix(finding, repoPath);
          if (fix) {
            fixes.push(fix);
          }
        } catch (error) {
          console.error('Error generating fix for Semgrep finding:', error);
        }
      }
    }

    // Process Trivy findings (focus on dependency updates)
    if (scanResults.trivy && scanResults.trivy.Results) {
      for (const result of scanResults.trivy.Results) {
        if (result.Vulnerabilities) {
          for (const vuln of result.Vulnerabilities) {
            try {
              const fix = await this.generateTrivyFix(vuln, result, repoPath);
              if (fix) {
                fixes.push(fix);
              }
            } catch (error) {
              console.error('Error generating fix for Trivy finding:', error);
            }
          }
        }
      }
    }

    return fixes;
  }

  async generateSemgrepFix(finding, repoPath) {
    const filePath = path.join(repoPath, finding.path);
    
    // Read the vulnerable file
    let fileContent;
    try {
      fileContent = await fs.readFile(filePath, 'utf8');
    } catch (error) {
      console.error(`Could not read file ${filePath}:`, error);
      return null;
    }

    // Extract the vulnerable code snippet
    const lines = fileContent.split('\n');
    const startLine = Math.max(0, finding.start.line - 5);
    const endLine = Math.min(lines.length, finding.end.line + 5);
    const codeSnippet = lines.slice(startLine, endLine).join('\n');

    const prompt = this.buildSecurityFixPrompt(finding, codeSnippet, filePath);
    
    try {
      const aiResponse = await this.callAI(prompt);
      const fixedCode = this.extractFixedCode(aiResponse);
      
      if (fixedCode) {
        return {
          type: 'semgrep',
          file: finding.path,
          issue: finding.message,
          severity: finding.severity,
          originalCode: this.extractVulnerableCode(finding, lines),
          fixedCode: fixedCode,
          confidence: this.calculateConfidence(aiResponse),
          explanation: this.extractExplanation(aiResponse)
        };
      }
    } catch (error) {
      console.error('AI fix generation failed:', error);
    }

    return null;
  }

  async generateTrivyFix(vulnerability, result, repoPath) {
    // Focus on dependency vulnerabilities that can be fixed by version updates
    if (vulnerability.FixedVersion && result.Type === 'npm') {
      return {
        type: 'trivy',
        file: 'package.json',
        issue: `${vulnerability.PkgName} has vulnerability ${vulnerability.VulnerabilityID}`,
        severity: vulnerability.Severity,
        packageName: vulnerability.PkgName,
        currentVersion: vulnerability.InstalledVersion,
        fixedVersion: vulnerability.FixedVersion,
        confidence: 0.9,
        explanation: `Update ${vulnerability.PkgName} from ${vulnerability.InstalledVersion} to ${vulnerability.FixedVersion} to fix ${vulnerability.VulnerabilityID}`
      };
    }

    return null;
  }

  buildSecurityFixPrompt(finding, codeSnippet, filePath) {
    return `You are a senior security engineer. Your task is to fix a security vulnerability in code.

VULNERABILITY DETAILS:
- File: ${filePath}
- Issue: ${finding.message}
- Severity: ${finding.severity}
- Rule ID: ${finding.check_id}

VULNERABLE CODE:
\`\`\`
${codeSnippet}
\`\`\`

INSTRUCTIONS:
1. Analyze the security vulnerability
2. Provide a secure fix that maintains functionality
3. Explain why the fix addresses the security issue
4. Rate your confidence in the fix (0.0 to 1.0)

RESPONSE FORMAT:
{
  "fixed_code": "// Your fixed code here",
  "explanation": "Explanation of the fix",
  "confidence": 0.85
}

Respond only with valid JSON.`;
  }

  async callAI(prompt) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await axios.post(this.apiUrl, {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert security engineer specializing in code vulnerability remediation. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  }

  extractFixedCode(aiResponse) {
    try {
      const parsed = JSON.parse(aiResponse);
      return parsed.fixed_code;
    } catch (error) {
      // Fallback: try to extract code from markdown blocks
      const codeMatch = aiResponse.match(/```[\w]*\n([\s\S]*?)\n```/);
      return codeMatch ? codeMatch[1] : null;
    }
  }

  extractExplanation(aiResponse) {
    try {
      const parsed = JSON.parse(aiResponse);
      return parsed.explanation;
    } catch (error) {
      return 'AI-generated security fix';
    }
  }

  calculateConfidence(aiResponse) {
    try {
      const parsed = JSON.parse(aiResponse);
      return parsed.confidence || 0.5;
    } catch (error) {
      return 0.5;
    }
  }

  extractVulnerableCode(finding, lines) {
    const startLine = finding.start.line - 1;
    const endLine = finding.end.line;
    return lines.slice(startLine, endLine).join('\n');
  }

  async applyFixes(fixes, repoPath) {
    console.log(`🔧 Applying ${fixes.length} fixes...`);
    
    const appliedFixes = [];
    
    for (const fix of fixes) {
      try {
        if (fix.type === 'semgrep') {
          await this.applySemgrepFix(fix, repoPath);
          appliedFixes.push(fix);
        } else if (fix.type === 'trivy') {
          await this.applyTrivyFix(fix, repoPath);
          appliedFixes.push(fix);
        }
      } catch (error) {
        console.error(`Failed to apply fix for ${fix.file}:`, error);
        fix.error = error.message;
      }
    }

    return appliedFixes;
  }

  async applySemgrepFix(fix, repoPath) {
    const filePath = path.join(repoPath, fix.file);
    const content = await fs.readFile(filePath, 'utf8');
    
    // Simple replacement - in production, use AST-based replacement
    const fixedContent = content.replace(fix.originalCode, fix.fixedCode);
    
    await fs.writeFile(filePath, fixedContent, 'utf8');
    console.log(`✅ Applied fix to ${fix.file}`);
  }

  async applyTrivyFix(fix, repoPath) {
    const packageJsonPath = path.join(repoPath, 'package.json');
    
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      
      // Update dependency version
      if (packageJson.dependencies && packageJson.dependencies[fix.packageName]) {
        packageJson.dependencies[fix.packageName] = fix.fixedVersion;
      }
      if (packageJson.devDependencies && packageJson.devDependencies[fix.packageName]) {
        packageJson.devDependencies[fix.packageName] = fix.fixedVersion;
      }
      
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
      console.log(`✅ Updated ${fix.packageName} to ${fix.fixedVersion}`);
    }
  }
}

module.exports = new AutoFixService();
