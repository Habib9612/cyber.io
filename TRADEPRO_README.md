# TradePro AI - AI-Powered Trading Platform

TradePro AI is a comprehensive trading platform that combines artificial intelligence with modern web technologies to provide intelligent trading agents, real-time analytics, and automated trading capabilities.

## 🚀 Features

### Core Capabilities
- **AI Trading Agents**: Deploy intelligent AI agents that analyze markets and execute trades 24/7
- **User Authentication**: Secure JWT-based authentication system with user registration and login
- **Real-time Dashboard**: Modern React-based interface with live trading data and agent management
- **Agent Management**: Create, message, and manage multiple AI trading agents
- **Responsive Design**: Beautiful, mobile-friendly interface built with Tailwind CSS and shadcn/ui

### Technical Features
- **Flask Backend**: RESTful API with SQLAlchemy ORM and SQLite database
- **React Frontend**: Modern React 18 with TypeScript support and Vite build system
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **CORS Support**: Configured for seamless frontend-backend communication
- **Database Integration**: SQLite database with user and agent data management
- **AI Integration**: Ready for Omnara AI framework integration (simulation mode included)

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- pnpm (recommended) or npm

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the backend server:**
   ```bash
   python src/main.py
   ```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Start the development server:**
   ```bash
   pnpm run dev
   ```

The frontend will be available at `http://localhost:5173`

## 📖 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### AI Agents Endpoints

#### Create Agent
```http
POST /api/ai/agents
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "agent_type": "trading-analyst"
}
```

#### Get All Agents
```http
GET /api/ai/agents
Authorization: Bearer <access_token>
```

#### Send Message to Agent
```http
POST /api/ai/agents/{agent_id}/message
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "message": "Analyze the current market trends"
}
```

## 🎯 Usage

### Getting Started

1. **Access the Application:**
   - Open your browser and navigate to `http://localhost:5173`
   - You'll see the TradePro AI landing page

2. **Create an Account:**
   - Click "Get Started" or "Sign Up"
   - Enter your email and password (minimum 8 characters)
   - Click "Create Account"

3. **Login:**
   - Use your credentials to log in
   - You'll be redirected to the dashboard

4. **Create AI Agents:**
   - In the dashboard, click "Create Agent"
   - Your new trading analyst agent will appear in the left panel

5. **Chat with Agents:**
   - Select an agent from the left panel
   - Type messages in the chat interface
   - The agent will respond (currently in simulation mode)

### Demo Credentials

For testing purposes, you can use:
- **Email:** demo@tradepro-ai.com
- **Password:** DemoPass123

## 🚀 Deployment

### Production Deployment

1. **Backend Deployment:**
   ```bash
   # Install production dependencies
   pip install gunicorn

   # Run with Gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 src.main:app
   ```

2. **Frontend Deployment:**
   ```bash
   # Build for production
   pnpm run build

   # Serve the built files
   pnpm run preview
   ```

---

**TradePro AI** - Revolutionizing trading with artificial intelligence.
