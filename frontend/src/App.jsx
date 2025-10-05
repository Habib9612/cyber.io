import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Shield, Scan, Bot, Github, LogOut, User, Settings as SettingsIcon, Home, Activity } from 'lucide-react'
import './App.css'

// API base URL - use relative paths for deployment
const API_BASE = '/api'

function App() {
  const [user, setUser] = useState(null)
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId'))
  const [loading, setLoading] = useState(false)
  const [scans, setScans] = useState([])
  const [currentScan, setCurrentScan] = useState(null)

  // Check if user is logged in on app start
  useEffect(() => {
    if (sessionId) {
      fetchUserProfile()
    }
  }, [sessionId])

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/profile/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        // Invalid session, clear it
        localStorage.removeItem('sessionId')
        setSessionId(null)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }

  // Login function
  const login = async (email, password) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      if (response.ok) {
        setUser(data.user)
        setSessionId(data.sessionId)
        localStorage.setItem('sessionId', data.sessionId)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    } finally {
      setLoading(false)
    }
  }

  // Register function
  const register = async (name, email, password) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      const data = await response.json()
      if (response.ok) {
        setUser(data.user)
        setSessionId(data.sessionId)
        localStorage.setItem('sessionId', data.sessionId)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setSessionId(null)
      localStorage.removeItem('sessionId')
    }
  }

  // Start scan function
  const startScan = async (repoUrl) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/scan/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, scanTypes: ['semgrep', 'trivy'] })
      })

      const data = await response.json()
      if (response.ok) {
        setCurrentScan({ id: data.scanId, status: 'started', repoUrl })
        // Poll for scan status
        pollScanStatus(data.scanId)
        return { success: true, scanId: data.scanId }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    } finally {
      setLoading(false)
    }
  }

  // Poll scan status
  const pollScanStatus = async (scanId) => {
    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE}/scan/status/${scanId}`)
        if (response.ok) {
          const data = await response.json()
          setCurrentScan(data)
          
          if (data.status === 'completed' || data.status === 'failed') {
            // Stop polling
            return
          } else {
            // Continue polling
            setTimeout(poll, 2000)
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }
    poll()
  }

  if (!user) {
    return <AuthPage onLogin={login} onRegister={register} loading={loading} />
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navigation user={user} onLogout={logout} />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard user={user} currentScan={currentScan} onStartScan={startScan} loading={loading} />} />
            <Route path="/scans" element={<ScanHistory scans={scans} />} />
            <Route path="/settings" element={<Settings user={user} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

// Authentication Page Component
function AuthPage({ onLogin, onRegister, loading }) {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const result = isLogin 
      ? await onLogin(formData.email, formData.password)
      : await onRegister(formData.name, formData.email, formData.password)

    if (!result.success) {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Cyber.io</h1>
          <p className="text-purple-200">AI-Powered Security Platform</p>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white">{isLogin ? 'Sign In' : 'Create Account'}</CardTitle>
            <CardDescription className="text-purple-200">
              {isLogin ? 'Welcome back to Cyber.io' : 'Join the security revolution'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <Label htmlFor="name" className="text-white">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                    placeholder="Your name"
                    required={!isLogin}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <Alert className="bg-red-500/20 border-red-500/50">
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-purple-300 hover:text-purple-100 text-sm"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Navigation Component
function Navigation({ user, onLogout }) {
  return (
    <nav className="bg-black/20 backdrop-blur-md border-b border-purple-500/20">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-purple-400" />
          <span className="text-xl font-bold text-white">Cyber.io</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-purple-200">Welcome, {user.name}</span>
          <Button variant="ghost" size="sm" onClick={onLogout} className="text-purple-300 hover:text-white">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  )
}

// Dashboard Component
function Dashboard({ user, currentScan, onStartScan, loading }) {
  const [repoUrl, setRepoUrl] = useState('')
  const [scanError, setScanError] = useState('')

  const handleStartScan = async (e) => {
    e.preventDefault()
    setScanError('')

    if (!repoUrl.trim()) {
      setScanError('Please enter a repository URL')
      return
    }

    const result = await onStartScan(repoUrl)
    if (!result.success) {
      setScanError(result.error)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Security Dashboard</h1>
        <p className="text-purple-200 text-lg">Scan your repositories for vulnerabilities and get AI-powered fixes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/10 backdrop-blur-md border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-200">Total Scans</CardTitle>
            <Scan className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">12</div>
            <p className="text-xs text-purple-300">+2 from last week</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-200">Vulnerabilities Fixed</CardTitle>
            <Bot className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">47</div>
            <p className="text-xs text-purple-300">AI-powered fixes</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-200">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">A+</div>
            <p className="text-xs text-purple-300">Excellent security</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/10 backdrop-blur-md border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Start New Scan</CardTitle>
          <CardDescription className="text-purple-200">
            Enter a GitHub repository URL to begin security analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStartScan} className="space-y-4">
            <div>
              <Label htmlFor="repo-url" className="text-white">Repository URL</Label>
              <Input
                id="repo-url"
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                placeholder="https://github.com/username/repository"
              />
            </div>

            {scanError && (
              <Alert className="bg-red-500/20 border-red-500/50">
                <AlertDescription className="text-red-200">{scanError}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? 'Starting Scan...' : 'Start Security Scan'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {currentScan && (
        <Card className="bg-white/10 backdrop-blur-md border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white">Current Scan</CardTitle>
            <CardDescription className="text-purple-200">
              {currentScan.repoUrl}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white">Status:</span>
              <Badge variant={currentScan.status === 'completed' ? 'default' : 'secondary'}>
                {currentScan.status}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white">Progress:</span>
                <span className="text-purple-200">{currentScan.progress || 0}%</span>
              </div>
              <Progress value={currentScan.progress || 0} className="bg-purple-900/50" />
            </div>

            {currentScan.status === 'completed' && currentScan.results && (
              <div className="mt-4 space-y-2">
                <h4 className="text-white font-semibold">Scan Results:</h4>
                {currentScan.results.semgrep && (
                  <div className="text-purple-200">
                    Semgrep: {currentScan.results.semgrep.summary?.total || 0} findings
                  </div>
                )}
                {currentScan.results.trivy && (
                  <div className="text-purple-200">
                    Trivy: {currentScan.results.trivy.summary?.total || 0} vulnerabilities
                  </div>
                )}
                {currentScan.securityScore && (
                  <div className="text-purple-200">
                    Security Score: {currentScan.securityScore.grade} ({currentScan.securityScore.score}/100)
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Scan History Component
function ScanHistory({ scans }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Scan History</h1>
      <Card className="bg-white/10 backdrop-blur-md border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Recent Scans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-purple-200">No scans available yet. Start your first scan!</div>
        </CardContent>
      </Card>
    </div>
  )
}

// Settings Component
function Settings({ user }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Settings</h1>
      <Card className="bg-white/10 backdrop-blur-md border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-white">Name</Label>
            <Input value={user.name} className="bg-white/10 border-purple-500/30 text-white" readOnly />
          </div>
          <div>
            <Label className="text-white">Email</Label>
            <Input value={user.email} className="bg-white/10 border-purple-500/30 text-white" readOnly />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default App
