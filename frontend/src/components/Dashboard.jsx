import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAIAgents } from '../contexts/AIAgentsContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bot, 
  LogOut, 
  Plus, 
  MessageSquare, 
  Trash2, 
  TrendingUp, 
  BarChart3, 
  DollarSign,
  Activity,
  Send,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const { agents, loading, createAgent, sendMessage, deleteAgent } = useAIAgents()
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [sendingMessage, setSendingMessage] = useState(false)
  const [creatingAgent, setCreatingAgent] = useState(false)

  const handleCreateAgent = async () => {
    setCreatingAgent(true)
    const result = await createAgent('trading-analyst')
    if (result.success) {
      // Agent created successfully
    }
    setCreatingAgent(false)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!message.trim() || !selectedAgent) return

    setSendingMessage(true)
    const userMessage = { type: 'user', content: message, timestamp: new Date() }
    setChatHistory(prev => [...prev, userMessage])

    const result = await sendMessage(selectedAgent.instance_id, message)
    
    if (result.success) {
      const aiResponse = { 
        type: 'ai', 
        content: result.response.message, 
        status: result.response.status,
        timestamp: new Date() 
      }
      setChatHistory(prev => [...prev, aiResponse])
    } else {
      const errorResponse = { 
        type: 'error', 
        content: result.error, 
        timestamp: new Date() 
      }
      setChatHistory(prev => [...prev, errorResponse])
    }

    setMessage('')
    setSendingMessage(false)
  }

  const handleDeleteAgent = async (agentId) => {
    if (selectedAgent?.instance_id === agentId) {
      setSelectedAgent(null)
      setChatHistory([])
    }
    await deleteAgent(agentId)
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">TradePro AI</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Welcome, {user?.email}</span>
              <Button 
                variant="ghost" 
                onClick={logout}
                className="text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Agents</p>
                  <p className="text-2xl font-bold text-white">{agents.length}</p>
                </div>
                <Bot className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Portfolio Value</p>
                  <p className="text-2xl font-bold text-white">$12,450</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Today's P&L</p>
                  <p className="text-2xl font-bold text-green-400">+$234.50</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Success Rate</p>
                  <p className="text-2xl font-bold text-white">94.7%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Agents Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">AI Agents</CardTitle>
                  <Button 
                    onClick={handleCreateAgent}
                    disabled={creatingAgent}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {creatingAgent ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Create Agent
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                  </div>
                ) : agents.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No agents created yet</p>
                    <p className="text-sm text-gray-500">Create your first AI trading agent</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {agents.map((agent) => (
                      <div 
                        key={agent.instance_id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedAgent?.instance_id === agent.instance_id
                            ? 'bg-blue-500/20 border-blue-500/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <Bot className="h-4 w-4 text-blue-400" />
                              <span className="text-white font-medium">
                                {agent.agent_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </div>
                            <Badge 
                              className={`mt-1 ${
                                agent.status === 'active' 
                                  ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                                  : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                              }`}
                            >
                              {agent.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedAgent(agent)
                              }}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteAgent(agent.instance_id)
                              }}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-2">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  {selectedAgent ? `Chat with ${selectedAgent.agent_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}` : 'Select an Agent'}
                </CardTitle>
                {selectedAgent && (
                  <CardDescription className="text-gray-300">
                    Agent ID: {selectedAgent.instance_id.slice(0, 8)}...
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {!selectedAgent ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">Select an AI agent to start chatting</p>
                      <p className="text-sm text-gray-500">Choose an agent from the left panel</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-black/20 rounded-lg">
                      {chatHistory.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-400">Start a conversation with your AI agent</p>
                        </div>
                      ) : (
                        chatHistory.map((msg, index) => (
                          <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              msg.type === 'user' 
                                ? 'bg-blue-600 text-white' 
                                : msg.type === 'error'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-white/10 text-white border border-white/20'
                            }`}>
                              <p className="text-sm">{msg.content}</p>
                              {msg.status && (
                                <Badge className="mt-1 text-xs bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                                  {msg.status}
                                </Badge>
                              )}
                              <p className="text-xs opacity-70 mt-1">{formatTimestamp(msg.timestamp)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Message Input */}
                    <form onSubmit={handleSendMessage} className="flex space-x-2">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                        disabled={sendingMessage}
                      />
                      <Button 
                        type="submit" 
                        disabled={sendingMessage || !message.trim()}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {sendingMessage ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Status Alert */}
        <div className="mt-8">
          <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo Mode:</strong> AI agents are running in simulation mode. 
              Configure your Omnara API key to enable full AI functionality.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
