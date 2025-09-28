import { createContext, useContext, useState, useEffect } from 'react'

const AIAgentsContext = createContext()

export const useAIAgents = () => {
  const context = useContext(AIAgentsContext)
  if (!context) {
    throw new Error('useAIAgents must be used within an AIAgentsProvider')
  }
  return context
}

export const AIAgentsProvider = ({ children }) => {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(false)

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/agents', {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents)
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const createAgent = async (agentType = 'trading-analyst') => {
    try {
      const response = await fetch('/api/ai/agents', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ agent_type: agentType })
      })

      if (response.ok) {
        const data = await response.json()
        await fetchAgents() // Refresh the list
        return { success: true, agent: data }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create agent')
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const sendMessage = async (agentId, message) => {
    try {
      const response = await fetch(`/api/ai/agents/${agentId}/message`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message })
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, response: data.response }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const deleteAgent = async (agentId) => {
    try {
      const response = await fetch(`/api/ai/agents/${agentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        await fetchAgents() // Refresh the list
        return { success: true }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete agent')
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  const value = {
    agents,
    loading,
    fetchAgents,
    createAgent,
    sendMessage,
    deleteAgent
  }

  return (
    <AIAgentsContext.Provider value={value}>
      {children}
    </AIAgentsContext.Provider>
  )
}
