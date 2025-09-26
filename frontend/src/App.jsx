import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { 
  Shield, 
  Search, 
  GitBranch, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Code, 
  Bug,
  Zap,
  Github,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import './App.css'

function App() {
  const [repoUrl, setRepoUrl] = useState('')
  const [currentScan, setCurrentScan] = useState(null)
  const [scanHistory, setScanHistory] = useState([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState(null)
  const [fixes, setFixes] = useState([])
  const [prResult, setPrResult] = useState(null)

  const startScan = async () => {
    if (!repoUrl.trim()) return

    setIsScanning(true)
    setScanResults(null)
    setFixes([])
    setPrResult(null)

    try {
      const response = await fetch('http://localhost:5000/api/scan/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          scanTypes: ['semgrep', 'trivy']
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setCurrentScan(data)
        pollScanStatus(data.scanId)
      } else {
        throw new Error(data.error || 'Failed to start scan')
      }
    } catch (error) {
      console.error('Error starting scan:', error)
      setIsScanning(false)
    }
  }

  const pollScanStatus = async (scanId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/scan/status/${scanId}`)
        const data = await response.json()

        setCurrentScan(data)

        if (data.status === 'completed') {
          clearInterval(pollInterval)
          setIsScanning(false)
          setScanResults(data.results)
          setScanHistory(prev => [data, ...prev])
        } else if (data.status === 'failed') {
          clearInterval(pollInterval)
          setIsScanning(false)
          console.error('Scan failed:', data.error)
        }
      } catch (error) {
        console.error('Error polling scan status:', error)
        clearInterval(pollInterval)
        setIsScanning(false)
      }
    }, 2000)
  }

  const generateFixes = async () => {
    if (!scanResults || !currentScan) return

    try {
      const response = await fetch(`http://localhost:5000/api/autofix/generate/${currentScan.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoUrl,
          scanResults
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setFixes(data.fixes)
      } else {
        throw new Error(data.error || 'Failed to generate fixes')
      }
    } catch (error) {
      console.error('Error generating fixes:', error)
    }
  }

  const createPR = async () => {
    if (!fixes.length || !currentScan) return

    try {
      const response = await fetch(`http://localhost:5000/api/autofix/create-pr/${currentScan.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoUrl,
          fixes
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setPrResult(data)
      } else {
        throw new Error(data.error || 'Failed to create PR')
      }
    } catch (error) {
      console.error('Error creating PR:', error)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const getSecurityGrade = (score) => {
    if (score >= 90) return { grade: 'A', color: 'text-green-600' }
    if (score >= 80) return { grade: 'B', color: 'text-blue-600' }
    if (score >= 70) return { grade: 'C', color: 'text-yellow-600' }
    if (score >= 60) return { grade: 'D', color: 'text-orange-600' }
    return { grade: 'F', color: 'text-red-600' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CyberSecScan</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">AI-Powered Security Platform</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              v1.0.0
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Scan Input */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Repository Scanner</span>
            </CardTitle>
            <CardDescription>
              Enter a GitHub repository URL to start a comprehensive security scan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Input
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="flex-1"
                disabled={isScanning}
              />
              <Button 
                onClick={startScan} 
                disabled={isScanning || !repoUrl.trim()}
                className="min-w-[120px]"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Start Scan
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Scan Status */}
        {currentScan && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Scan Progress</span>
                </div>
                <Badge variant={currentScan.status === 'completed' ? 'default' : 'secondary'}>
                  {currentScan.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Repository: {repoUrl}</span>
                    <span>{currentScan.progress || 0}%</span>
                  </div>
                  <Progress value={currentScan.progress || 0} className="h-2" />
                </div>
                {currentScan.status === 'completed' && scanResults && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getSecurityGrade(scanResults.securityScore?.score || 0).color}`}>
                        {getSecurityGrade(scanResults.securityScore?.score || 0).grade}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Security Grade</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {scanResults.securityScore?.score || 0}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Security Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">
                        {scanResults.securityScore?.totalIssues || 0}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Issues Found</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scan Results */}
        {scanResults && (
          <Tabs defaultValue="findings" className="mb-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="findings">Security Findings</TabsTrigger>
              <TabsTrigger value="fixes">AI Fixes</TabsTrigger>
              <TabsTrigger value="pr">Pull Request</TabsTrigger>
            </TabsList>

            <TabsContent value="findings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bug className="h-5 w-5" />
                    <span>SAST Findings (Semgrep)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scanResults.findings?.semgrep?.results?.length > 0 ? (
                    <div className="space-y-3">
                      {scanResults.findings.semgrep.results.map((finding, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900 dark:text-white">
                                {finding.message}
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {finding.path}:{finding.start?.line}
                              </p>
                            </div>
                            <Badge variant={getSeverityColor(finding.severity)}>
                              {finding.severity}
                            </Badge>
                          </div>
                          <code className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded block">
                            {finding.check_id}
                          </code>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400">No SAST findings detected</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Vulnerability Scan (Trivy)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scanResults.findings?.trivy?.Results?.length > 0 ? (
                    <div className="space-y-3">
                      {scanResults.findings.trivy.Results.map((result, index) => (
                        <div key={index}>
                          {result.Vulnerabilities?.map((vuln, vIndex) => (
                            <div key={vIndex} className="border rounded-lg p-4 mb-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-medium text-slate-900 dark:text-white">
                                    {vuln.VulnerabilityID}
                                  </h4>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {vuln.PkgName} ({vuln.InstalledVersion})
                                  </p>
                                </div>
                                <Badge variant={getSeverityColor(vuln.Severity)}>
                                  {vuln.Severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                                {vuln.Title}
                              </p>
                              {vuln.FixedVersion && (
                                <Badge variant="outline" className="text-xs">
                                  Fix: {vuln.FixedVersion}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400">No vulnerabilities detected</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fixes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>AI-Generated Fixes</span>
                    </div>
                    <Button onClick={generateFixes} disabled={!scanResults || fixes.length > 0}>
                      <Code className="h-4 w-4 mr-2" />
                      Generate Fixes
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fixes.length > 0 ? (
                    <div className="space-y-4">
                      {fixes.map((fix, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900 dark:text-white">
                                {fix.file}
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {fix.issue}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={getSeverityColor(fix.severity)}>
                                {fix.severity}
                              </Badge>
                              <Badge variant="outline">
                                {Math.round(fix.confidence * 100)}% confidence
                              </Badge>
                            </div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800 rounded p-3">
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {fix.explanation}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400">
                      Click "Generate Fixes" to create AI-powered security fixes
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pr" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <GitBranch className="h-5 w-5" />
                      <span>Pull Request</span>
                    </div>
                    <Button 
                      onClick={createPR} 
                      disabled={!fixes.length || prResult}
                    >
                      <Github className="h-4 w-4 mr-2" />
                      Create PR
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {prResult ? (
                    <div className="space-y-4">
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Pull request created successfully with {prResult.appliedFixes} security fixes!
                        </AlertDescription>
                      </Alert>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">PR #{prResult.prNumber}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Branch: {prResult.branch}
                          </p>
                        </div>
                        <Button asChild variant="outline">
                          <a href={prResult.prUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View PR
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400">
                      Generate fixes first, then create a pull request with the security improvements
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}

export default App
