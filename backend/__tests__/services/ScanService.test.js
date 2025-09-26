const ScanService = require('../../src/services/ScanService');

// Mock external dependencies
jest.mock('execa');
jest.mock('fs-extra');
jest.mock('simple-git');

const { execa } = require('execa');
const fs = require('fs-extra');
const simpleGit = require('simple-git');

describe('ScanService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateSecurityScore', () => {
    test('should return perfect score for no findings', () => {
      const findings = {
        semgrep: { results: [] },
        trivy: { Results: [] }
      };

      const score = ScanService.calculateSecurityScore(findings);

      expect(score.score).toBe(100);
      expect(score.grade).toBe('A');
      expect(score.totalIssues).toBe(0);
    });

    test('should deduct points for semgrep findings', () => {
      const findings = {
        semgrep: { 
          results: [
            { severity: 'HIGH' },
            { severity: 'MEDIUM' }
          ] 
        },
        trivy: { Results: [] }
      };

      const score = ScanService.calculateSecurityScore(findings);

      expect(score.score).toBe(90); // 100 - (2 * 5)
      expect(score.grade).toBe('A');
      expect(score.totalIssues).toBe(2);
    });

    test('should deduct points for trivy findings', () => {
      const findings = {
        semgrep: { results: [] },
        trivy: { 
          Results: [{
            Vulnerabilities: [
              { severity: 'HIGH' },
              { severity: 'CRITICAL' },
              { severity: 'MEDIUM' }
            ]
          }]
        }
      };

      const score = ScanService.calculateSecurityScore(findings);

      expect(score.score).toBe(91); // 100 - (3 * 3)
      expect(score.grade).toBe('A');
      expect(score.totalIssues).toBe(3);
    });

    test('should not go below 0 score', () => {
      const findings = {
        semgrep: { 
          results: Array(50).fill({ severity: 'HIGH' }) // 50 * 5 = 250 points
        },
        trivy: { Results: [] }
      };

      const score = ScanService.calculateSecurityScore(findings);

      expect(score.score).toBe(0);
      expect(score.grade).toBe('F');
      expect(score.totalIssues).toBe(50);
    });
  });

  describe('getSecurityGrade', () => {
    test('should return correct grades for different scores', () => {
      expect(ScanService.getSecurityGrade(95)).toBe('A');
      expect(ScanService.getSecurityGrade(85)).toBe('B');
      expect(ScanService.getSecurityGrade(75)).toBe('C');
      expect(ScanService.getSecurityGrade(65)).toBe('D');
      expect(ScanService.getSecurityGrade(55)).toBe('F');
      expect(ScanService.getSecurityGrade(0)).toBe('F');
    });
  });

  describe('runSemgrepScan', () => {
    test('should parse successful semgrep output', async () => {
      const mockOutput = JSON.stringify({
        results: [
          { message: 'Test finding', severity: 'HIGH' }
        ]
      });

      execa.mockResolvedValue({ stdout: mockOutput });

      const result = await ScanService.runSemgrepScan('/test/path');

      expect(result).toEqual({
        results: [
          { message: 'Test finding', severity: 'HIGH' }
        ]
      });
      expect(execa).toHaveBeenCalledWith('semgrep', [
        '--config=auto',
        '--json',
        '--quiet',
        '/test/path'
      ]);
    });

    test('should handle semgrep errors gracefully', async () => {
      const error = new Error('Semgrep failed');
      error.stdout = JSON.stringify({ results: [], errors: ['Test error'] });
      
      execa.mockRejectedValue(error);

      const result = await ScanService.runSemgrepScan('/test/path');

      expect(result).toEqual({
        results: [],
        errors: ['Test error']
      });
    });
  });

  describe('runTrivyScan', () => {
    test('should parse successful trivy output', async () => {
      const mockOutput = JSON.stringify({
        Results: [
          { 
            Vulnerabilities: [
              { VulnerabilityID: 'CVE-2023-1234', Severity: 'HIGH' }
            ]
          }
        ]
      });

      execa.mockResolvedValue({ stdout: mockOutput });

      const result = await ScanService.runTrivyScan('/test/path');

      expect(result).toEqual({
        Results: [
          { 
            Vulnerabilities: [
              { VulnerabilityID: 'CVE-2023-1234', Severity: 'HIGH' }
            ]
          }
        ]
      });
      expect(execa).toHaveBeenCalledWith('trivy', [
        'fs',
        '--format=json',
        '--quiet',
        '--ignore-unfixed',
        '--severity=HIGH,CRITICAL',
        '/test/path'
      ]);
    });
  });
});
