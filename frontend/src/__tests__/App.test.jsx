import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from '../App'

// Mock fetch
global.fetch = vi.fn()

describe('App Component', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  it('renders the main dashboard', () => {
    render(<App />)
    
    expect(screen.getByText('CyberSecScan')).toBeInTheDocument()
    expect(screen.getByText('AI-Powered Security Platform')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('https://github.com/username/repository')).toBeInTheDocument()
  })

  it('has start scan button initially disabled', () => {
    render(<App />)
    
    const startButton = screen.getByRole('button', { name: /start scan/i })
    expect(startButton).toBeDisabled()
  })

  it('enables start scan button when repo URL is entered', () => {
    render(<App />)
    
    const input = screen.getByPlaceholderText('https://github.com/username/repository')
    const startButton = screen.getByRole('button', { name: /start scan/i })
    
    fireEvent.change(input, { target: { value: 'https://github.com/test/repo' } })
    
    expect(startButton).not.toBeDisabled()
  })

  it('starts scan when button is clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        scanId: 'test-scan-id',
        status: 'started',
        message: 'Scan initiated successfully'
      })
    })

    render(<App />)
    
    const input = screen.getByPlaceholderText('https://github.com/username/repository')
    const startButton = screen.getByRole('button', { name: /start scan/i })
    
    fireEvent.change(input, { target: { value: 'https://github.com/test/repo' } })
    fireEvent.click(startButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/scan/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoUrl: 'https://github.com/test/repo',
          scanTypes: ['semgrep', 'trivy']
        }),
      })
    })
  })

  it('displays scan progress when scan is running', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        scanId: 'test-scan-id',
        status: 'started'
      })
    })

    render(<App />)
    
    const input = screen.getByPlaceholderText('https://github.com/username/repository')
    const startButton = screen.getByRole('button', { name: /start scan/i })
    
    fireEvent.change(input, { target: { value: 'https://github.com/test/repo' } })
    fireEvent.click(startButton)
    
    await waitFor(() => {
      expect(screen.getByText('Scan Progress')).toBeInTheDocument()
    })
  })

  it('displays security score when scan is completed', async () => {
    const mockScanResults = {
      securityScore: {
        score: 85,
        grade: 'B',
        totalIssues: 5
      },
      findings: {
        semgrep: { results: [] },
        trivy: { Results: [] }
      }
    }

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          scanId: 'test-scan-id',
          status: 'started'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          scanId: 'test-scan-id',
          status: 'completed',
          progress: 100,
          results: mockScanResults
        })
      })

    render(<App />)
    
    const input = screen.getByPlaceholderText('https://github.com/username/repository')
    const startButton = screen.getByRole('button', { name: /start scan/i })
    
    fireEvent.change(input, { target: { value: 'https://github.com/test/repo' } })
    fireEvent.click(startButton)
    
    // Wait for the polling to complete
    await waitFor(() => {
      expect(screen.getByText('B')).toBeInTheDocument()
      expect(screen.getByText('85')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('shows tabs for findings, fixes, and PR when scan is completed', async () => {
    const mockScanResults = {
      securityScore: { score: 85, grade: 'B', totalIssues: 5 },
      findings: { semgrep: { results: [] }, trivy: { Results: [] } }
    }

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ scanId: 'test-scan-id', status: 'started' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          scanId: 'test-scan-id',
          status: 'completed',
          results: mockScanResults
        })
      })

    render(<App />)
    
    const input = screen.getByPlaceholderText('https://github.com/username/repository')
    const startButton = screen.getByRole('button', { name: /start scan/i })
    
    fireEvent.change(input, { target: { value: 'https://github.com/test/repo' } })
    fireEvent.click(startButton)
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /security findings/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /ai fixes/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /pull request/i })).toBeInTheDocument()
    })
  })
})
