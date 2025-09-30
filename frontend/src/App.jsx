import { useState, useEffect } from 'react'
import { Button } from './components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card.jsx'
import { Input } from './components/ui/input.jsx'
import { Badge } from './components/ui/badge.jsx'
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
  RefreshCw,
  ArrowRight,
  Play,
  Star,
  Users,
  Lock,
  Cpu,
  Eye,
  Mail,
  User,
  LogOut
} from 'lucide-react'
import { motion } from 'framer-motion'
import { AuthModal } from './components/AuthModal.jsx'
import { RealInteractiveDemo } from './components/RealInteractiveDemo.jsx'
import apiService from './services/api.js'
import cyberLogo from './assets/cyber-logo.jpg'
import heroBg from './assets/hero-bg.jpg'
import './App.css'

function App() {
  const [email, setEmail] = useState('')
  const [user, setUser] = useState(null)
  const [showDemo, setShowDemo] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Check for existing session on app load
  useEffect(() => {
    const existingUser = apiService.getCurrentUser()
    if (existingUser && apiService.isAuthenticated()) {
      setUser(existingUser)
    }
  }, [])

  const handleEmailSignup = (e) => {
    e.preventDefault()
    if (email) {
      alert(`Thank you for signing up with ${email}! We'll be in touch soon.`)
      setEmail('')
    }
  }

  const handleLogin = (userData) => {
    setUser(userData)
    setShowAuthModal(false)
  }

  const handleLogout = async () => {
    try {
      await apiService.logout()
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
      // Still clear user state even if API call fails
      setUser(null)
    }
  }

  const openAuthModal = () => {
    setShowAuthModal(true)
  }

  const toggleDemo = () => {
    setShowDemo(!showDemo)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <img src={cyberLogo} alt="Cyber.io" className="h-10 w-10 rounded-lg" />
              <div>
                <h1 className="text-xl font-bold text-white">Cyber.io</h1>
                <p className="text-xs text-blue-300">AI-Powered Security</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="hidden md:flex items-center space-x-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <a href="#features" className="text-white hover:text-blue-300 transition-colors">Features</a>
              <a href="#demo" className="text-white hover:text-blue-300 transition-colors">Demo</a>
              <a href="#pricing" className="text-white hover:text-blue-300 transition-colors">Pricing</a>
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-white text-sm">Welcome, {user.name}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={openAuthModal}
                  className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white"
                >
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              )}
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 to-purple-900/50" />
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-blue-500/20 text-blue-300 border-blue-400">
              <Zap className="h-3 w-3 mr-1" />
              AI-Powered Security Platform
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              AI-Powered Security,
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Effortlessly Automated
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Cyber.io scans your code, finds vulnerabilities, and creates fixes automatically. 
              Ship secure code, faster than ever before.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg"
                onClick={toggleDemo}
              >
                <Play className="h-5 w-5 mr-2" />
                Try Demo
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg"
              >
                <Github className="h-5 w-5 mr-2" />
                View on GitHub
              </Button>
            </div>
            
            <div className="flex items-center justify-center space-x-8 text-gray-400">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-400" />
                <span>10k+ Developers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-400" />
                <span>99.9% Uptime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              A Comprehensive Security Platform for Modern Development
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Combine the power of multiple security tools with AI intelligence to create an unmatched security workflow.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all duration-300 h-full">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-white">Comprehensive Code Analysis</CardTitle>
                  <CardDescription className="text-gray-400">
                    We combine the power of multiple open-source security tools like Semgrep and Trivy to provide deep and accurate analysis of your codebase.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span>SAST with Semgrep</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span>Dependency scanning with Trivy</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span>Container security analysis</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all duration-300 h-full">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Cpu className="h-6 w-6 text-purple-400" />
                  </div>
                  <CardTitle className="text-white">Intelligent, Automated Fixes</CardTitle>
                  <CardDescription className="text-gray-400">
                    Our AI engine, powered by advanced language models, doesn't just find vulnerabilities—it fixes them with ready-to-merge pull requests.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span>AI-powered fix generation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span>High-confidence corrections</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span>Detailed explanations</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Card className="bg-slate-800/50 border-slate-700 hover:border-green-500/50 transition-all duration-300 h-full">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                    <GitBranch className="h-6 w-6 text-green-400" />
                  </div>
                  <CardTitle className="text-white">Automated Security Workflow</CardTitle>
                  <CardDescription className="text-gray-400">
                    Integrate Cyber.io into your CI/CD pipeline with ease. Get automated pull requests with detailed explanations, right in your GitHub repository.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span>GitHub integration</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span>CI/CD pipeline support</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span>Automated PR creation</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      {showDemo && (
        <section id="demo" className="py-20 bg-slate-800/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-white mb-6">See Cyber.io in Action</h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Try our interactive demo to experience the power of AI-driven security. No signup required.
              </p>
            </motion.div>

            <RealInteractiveDemo isVisible={showDemo} />
          </div>
        </section>
      )}

      {/* Email Signup Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900/50 to-purple-900/50">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Secure Your Code?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who trust Cyber.io to keep their applications secure.
            </p>
            
            <form onSubmit={handleEmailSignup} className="max-w-md mx-auto flex gap-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                required
              />
              <Button 
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Mail className="h-4 w-4 mr-2" />
                Get Started
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img src={cyberLogo} alt="Cyber.io" className="h-8 w-8 rounded" />
              <div>
                <h3 className="text-white font-bold">Cyber.io</h3>
                <p className="text-gray-400 text-sm">AI-Powered Security Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
              <a href="#" className="hover:text-white transition-colors">Pricing</a>
              <a href="#" className="hover:text-white transition-colors">About Us</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-gray-400">
            <p>&copy; 2025 Cyber.io. All rights reserved. Making security accessible, automated, and intelligent.</p>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onLogin={handleLogin}
      />
    </div>
  )
}

export default App
