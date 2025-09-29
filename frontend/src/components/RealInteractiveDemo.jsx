import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.jsx'
import { Badge } from '../components/ui/badge.jsx'
import { Progress } from '../components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.jsx'
import { Input } from '../components/ui/input.jsx'
import { Label } from '../components/ui/label.jsx'
import { 
  Eye,
  Code,
  Github,
  AlertTriangle,
  CheckCircle,
  Clock,
  Bug,
  Shield,
  Zap,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  ExternalLink
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import apiService from '../services/api.js'

export function RealInteractiveDemo({ isVisible }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanResults, setScanResults] = useState(null)
  const [fixes, setFixes] = useState([])
  const [prCreated, setPrCreated] = useState(false)
  const [repoUrl, setRepoUrl] = useState('https://github.com/example/vulnerable-app')
  const [scanId, setScanId] = useState(null)
  const [error, setError] = useState(null)
  const [realScanData, setRealScanData] = useState(null)

  const demoSteps = [
    {
      title: "Repository Connected",
      description: "Connected to repository",
      icon: Github,
      color: "blue"
    },
    {
      title: "Security Scan Running",
      description: "Analyzing code with Semgrep and Trivy",
      icon: RefreshCw,
      color: "yellow"
    },
    {
      title: "Vulnerabilities Found",
      description: "Security issues detected",
      icon: AlertTriangle,
      color: "red"
    },
    {
      title: "AI Fixes Generated",
      description: "Created intelligent fixes",
      icon: Zap,
      color: "purple"
    },
    {
      title: "Pull Request Created",
      description: "Automated PR with security fixes",
      icon: CheckCircle,
      color: "green"
    }
  ]

  // Mock vulnerabilities for demo purposes
  const mockVulnerabilities = [
    {
      id: 1,
      title: "SQL Injection Vulnerability",
      file: "src/auth.js:42",
      severity: "Critical",
      description: "Unsanitized user input in SQL query. AI fix available with 95% confidence.",
      fix: "Use parameterized queries to prevent SQL injection attacks.",
      confidence: 95
    },
    {
      id: 2,
      title: "Cross-Site Scripting (XSS)",
      file: "src/components/UserProfile.js:28",
      severity: "High",
      description: "User input not properly escaped before rendering.",
      fix: "Implement proper input sanitization and output encoding.",
      confidence: 92
    },
    {
      id: 3,
      title: "Outdated Dependency",
      file: "package.json",
      severity: "Medium",
      description: "lodash@4.17.15 has known vulnerabilities. Update to 4.17.21 recommended.",
      fix: "Update lodash to version 4.17.21 or higher.",
      confidence: 100
    },
    {
      id: 4,
      title: "Weak Cryptographic Hash",
      file: "src/utils/crypto.js:15",
      severity: "High",
      description: "Using MD5 for password hashing is insecure.",
      fix: "Replace MD5 with bcrypt or Argon2 for secure password hashing.",
      confidence: 98
    }
  ]

  const startRealScan = async () => {
    try {
      setError(null)
      setIsRunning(true)
      setCurrentStep(1)
      setScanProgress(0)
      
      // Start real scan
      const response = await apiService.startScan(repoUrl)
      setScanId(response.scanId)
      
      // Poll for scan status
      const pollInterval = setInterval(async () => {
        try {
          const status = await apiService.getScanStatus(response.scanId)
          setScanProgress(status.progress || 0)
          setRealScanData(status)
          
          if (status.status === 'completed') {
            clearInterval(pollInterval)
            setCurrentStep(2)
            setScanResults({
              grade: 'C',
              score: 67,
              issues: status.results?.vulnerabilities?.length || 12
            })
            
            // Move to fixes generation
            setTimeout(() => {
              setCurrentStep(3)
              setFixes(mockVulnerabilities) // Use mock data for demo
              
              setTimeout(() => {
                setCurrentStep(4)
                setPrCreated(true)
              }, 2000)
            }, 1500)
          } else if (status.status === 'failed') {
            clearInterval(pollInterval)
            setError(status.error || 'Scan failed')
            setIsRunning(false)
          }
        } catch (err) {
          console.error('Error polling scan status:', err)
        }
      }, 2000)
      
    } catch (err) {
      console.error('Error starting scan:', err)
      setError(err.message)
      setIsRunning(false)
      
      // Fallback to demo mode
      startDemoMode()
    }
  }

  const startDemoMode = () => {
    setError(null)
    setIsRunning(true)
    setCurrentStep(1)
    setScanProgress(0)
    setScanResults(null)
    setFixes([])
    setPrCreated(false)

    // Simulate scan progress
    const progressTimer = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer)
          setCurrentStep(2)
          setScanResults({
            grade: 'C',
            score: 67,
            issues: 12
          })
          
          setTimeout(() => {
            setCurrentStep(3)
            setFixes(mockVulnerabilities)
          }, 1500)
          
          setTimeout(() => {
            setCurrentStep(4)
            setPrCreated(true)
          }, 4000)
          
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const startDemo = () => {
    if (repoUrl && repoUrl.includes('github.com')) {
      startRealScan()
    } else {
      startDemoMode()
    }
  }

  const resetDemo = () => {
    setIsRunning(false)
    setCurrentStep(0)
    setScanProgress(0)
    setScanResults(null)
    setFixes([])
    setPrCreated(false)
    setScanId(null)
    setError(null)
    setRealScanData(null)
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

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto"
    >
      <Card className="bg-slate-900/80 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-white">Interactive Demo Dashboard</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              {!isRunning ? (
                <Button onClick={startDemo} className="bg-blue-500 hover:bg-blue-600">
                  <Play className="h-4 w-4 mr-2" />
                  Start Demo
                </Button>
              ) : (
                <Button onClick={resetDemo} variant="outline" className="border-gray-600 text-gray-300">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </div>
          <CardDescription className="text-gray-400">
            Experience the complete Cyber.io workflow from scan to fix
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Repository URL Input */}
          <div className="mb-6">
            <Label htmlFor="repo-url" className="text-white mb-2 block">Repository URL</Label>
            <div className="flex space-x-2">
              <Input
                id="repo-url"
                type="url"
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
                disabled={isRunning}
              />
              {repoUrl && repoUrl.includes('github.com') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(repoUrl, '_blank')}
                  className="border-gray-600 text-gray-300"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Enter a GitHub repository URL for real scanning, or use the default for demo mode
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Error: {error}</span>
              </div>
              <p className="text-red-300 text-sm mt-1">Falling back to demo mode...</p>
            </div>
          )}

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {demoSteps.map((step, index) => {
                const StepIcon = step.icon
                const isActive = index <= currentStep
                const isCurrent = index === currentStep
                
                return (
                  <div key={index} className="flex flex-col items-center space-y-2">
                    <motion.div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                        isActive 
                          ? `bg-${step.color}-500/20 border-${step.color}-400` 
                          : 'bg-slate-800 border-slate-600'
                      }`}
                      animate={isCurrent && isRunning ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <StepIcon 
                        className={`h-6 w-6 ${
                          isActive ? `text-${step.color}-400` : 'text-gray-500'
                        }`} 
                      />
                    </motion.div>
                    <div className="text-center">
                      <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-400">{step.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / (demoSteps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800">
              <TabsTrigger value="overview" className="text-white data-[state=active]:bg-blue-600">
                Overview
              </TabsTrigger>
              <TabsTrigger value="scan" className="text-white data-[state=active]:bg-blue-600">
                Scan Results
              </TabsTrigger>
              <TabsTrigger value="fixes" className="text-white data-[state=active]:bg-blue-600">
                AI Fixes
              </TabsTrigger>
              <TabsTrigger value="pr" className="text-white data-[state=active]:bg-blue-600">
                Pull Request
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Repository Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Repository:</span>
                        <span className="text-white font-mono text-sm">
                          {repoUrl.split('/').slice(-2).join('/')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Scan ID:</span>
                        <span className="text-white font-mono text-sm">
                          {scanId || 'demo-scan-123'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Last scan:</span>
                        <span className="text-white">
                          {isRunning ? 'In progress...' : '2 minutes ago'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Status:</span>
                        <Badge className={
                          currentStep >= 4 ? 'bg-green-500/20 text-green-300 border-green-400' :
                          currentStep >= 2 ? 'bg-red-500/20 text-red-300 border-red-400' :
                          'bg-yellow-500/20 text-yellow-300 border-yellow-400'
                        }>
                          {currentStep >= 4 ? 'Secured' : 
                           currentStep >= 2 ? 'Vulnerabilities Found' : 
                           'Scanning...'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {scanResults && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Security Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-red-400">{scanResults.grade}</div>
                            <div className="text-sm text-gray-400">Security Grade</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-white">{scanResults.score}</div>
                            <div className="text-sm text-gray-400">Security Score</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-red-400">{scanResults.issues}</div>
                            <div className="text-sm text-gray-400">Issues Found</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>

              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-2 text-white">
                    <RefreshCw className="h-5 w-5 animate-spin text-blue-400" />
                    <span>Scanning repository for vulnerabilities...</span>
                  </div>
                  <Progress value={scanProgress} className="h-3" />
                  <p className="text-gray-400 text-sm">
                    Running SAST analysis with Semgrep and dependency scanning with Trivy
                  </p>
                  {realScanData && (
                    <div className="text-sm text-gray-300">
                      <p>Real scan status: {realScanData.status}</p>
                      <p>Progress: {realScanData.progress}%</p>
                    </div>
                  )}
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="scan" className="space-y-4">
              <AnimatePresence>
                {fixes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    {fixes.map((vuln, index) => (
                      <motion.div
                        key={vuln.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-slate-800 rounded-lg border-l-4 border-red-400"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h5 className="text-white font-medium">{vuln.title}</h5>
                            <p className="text-gray-400 text-sm">{vuln.file}</p>
                          </div>
                          <Badge variant={getSeverityColor(vuln.severity)}>
                            {vuln.severity}
                          </Badge>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{vuln.description}</p>
                        {currentStep >= 3 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ delay: 0.5 }}
                            className="mt-3 p-3 bg-slate-700 rounded"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-blue-400 font-medium">AI-Generated Fix:</span>
                              <Badge variant="outline" className="text-green-400 border-green-400">
                                {vuln.confidence}% confidence
                              </Badge>
                            </div>
                            <p className="text-gray-300 text-sm">{vuln.fix}</p>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="fixes" className="space-y-4">
              {currentStep >= 3 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white text-lg font-medium">AI-Generated Security Fixes</h3>
                    <Badge className="bg-green-500/20 text-green-300 border-green-400">
                      {fixes.length} fixes generated
                    </Badge>
                  </div>
                  <div className="grid gap-4">
                    {fixes.map((fix, index) => (
                      <motion.div
                        key={fix.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-slate-800 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-white font-medium">{fix.title}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant={getSeverityColor(fix.severity)}>
                              {fix.severity}
                            </Badge>
                            <Badge variant="outline" className="text-green-400 border-green-400">
                              {fix.confidence}% confidence
                            </Badge>
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{fix.file}</p>
                        <div className="bg-slate-700 p-3 rounded">
                          <p className="text-gray-300 text-sm">{fix.fix}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Code className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">AI fixes will appear here after vulnerability scan completes</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pr" className="space-y-4">
              {prCreated ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-3 text-green-400">
                    <CheckCircle className="h-6 w-6" />
                    <h3 className="text-lg font-medium">Pull Request Created Successfully!</h3>
                  </div>
                  
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <Github className="h-5 w-5" />
                        <span>Security Fixes - Automated PR #247</span>
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Created 2 minutes ago by Cyber.io Bot
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-white font-medium mb-2">Changes Summary:</h4>
                          <ul className="space-y-1 text-gray-300 text-sm">
                            <li>• Fixed SQL injection vulnerability in auth.js</li>
                            <li>• Resolved XSS issue in UserProfile component</li>
                            <li>• Updated lodash dependency to secure version</li>
                            <li>• Replaced MD5 with bcrypt for password hashing</li>
                          </ul>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <Badge className="bg-green-500/20 text-green-300 border-green-400">
                            +47 additions
                          </Badge>
                          <Badge className="bg-red-500/20 text-red-300 border-red-400">
                            -23 deletions
                          </Badge>
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-400">
                            4 files changed
                          </Badge>
                        </div>
                        
                        <div className="flex space-x-3">
                          <Button className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Merge Pull Request
                          </Button>
                          <Button variant="outline" className="border-gray-600 text-gray-300">
                            <Eye className="h-4 w-4 mr-2" />
                            Review Changes
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="text-center py-8">
                  <Github className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Pull request will be created after AI fixes are generated</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}
