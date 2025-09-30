const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory user storage (in production, use a proper database)
const users = new Map();
const sessions = new Map();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Check if user already exists
    if (users.has(email)) {
      return res.status(409).json({
        error: 'User already exists'
      });
    }

    // Create new user
    const userId = uuidv4();
    const user = {
      id: userId,
      name: name || email.split('@')[0],
      email,
      password, // In production, hash this password
      createdAt: new Date().toISOString()
    };

    users.set(email, user);

    // Create session
    const sessionId = uuidv4();
    sessions.set(sessionId, {
      userId,
      email,
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      user: {
        id: userId,
        name: user.name,
        email: user.email
      },
      sessionId,
      message: 'User registered successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = users.get(email);
    if (!user || user.password !== password) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Create session
    const sessionId = uuidv4();
    sessions.set(sessionId, {
      userId: user.id,
      email: user.email,
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      sessionId,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (sessionId && sessions.has(sessionId)) {
      sessions.delete(sessionId);
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: error.message
    });
  }
});

// Get user profile
router.get('/profile/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(401).json({
        error: 'Invalid session'
      });
    }

    const user = users.get(session.email);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: error.message
    });
  }
});

// Social login simulation (GitHub/Google)
router.post('/social-login', async (req, res) => {
  try {
    const { provider, email, name } = req.body;

    if (!provider || !email) {
      return res.status(400).json({
        error: 'Provider and email are required'
      });
    }

    let user = users.get(email);
    
    // Create user if doesn't exist
    if (!user) {
      const userId = uuidv4();
      user = {
        id: userId,
        name: name || `User from ${provider}`,
        email,
        provider,
        createdAt: new Date().toISOString()
      };
      users.set(email, user);
    }

    // Create session
    const sessionId = uuidv4();
    sessions.set(sessionId, {
      userId: user.id,
      email: user.email,
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      sessionId,
      message: `${provider} login successful`
    });

  } catch (error) {
    console.error('Social login error:', error);
    res.status(500).json({
      error: 'Social login failed',
      message: error.message
    });
  }
});

module.exports = router;
