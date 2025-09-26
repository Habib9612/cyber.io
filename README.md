# CyberSecScan - AI-Powered Security Platform

CyberSecScan is a comprehensive, AI-powered cybersecurity platform that automatically scans repositories for security vulnerabilities, generates intelligent fixes using AI, and creates pull requests with the remediation code. It combines multiple open-source security tools with advanced AI capabilities to provide a seamless security workflow for developers.

## 🚀 Features

### Core Capabilities
- **Multi-Scanner Integration**: Combines Semgrep (SAST), Trivy (dependency/container scanning), and more
- **AI-Powered Auto-Fixes**: Uses DeepSeek Coder models to generate intelligent security fixes
- **Automated Pull Requests**: Creates GitHub PRs with fixes and detailed explanations
- **Security Scoring**: Provides letter grades and numerical scores for repository security
- **Real-time Dashboard**: Modern React-based interface with live scan progress
- **CI/CD Integration**: Easy integration with GitHub Actions and other CI/CD pipelines

### Supported Scan Types
- **Static Application Security Testing (SAST)** via Semgrep
- **Dependency Vulnerability Scanning** via Trivy
- **Container Security Scanning** via Trivy
- **Secret Detection** via multiple scanners
- **Infrastructure as Code (IaC) Scanning** via Trivy

### AI-Enhanced Features
- **Intelligent Fix Generation**: Context-aware security fixes
- **Confidence Scoring**: AI confidence ratings for each fix
- **Explanation Generation**: Detailed explanations of security issues and fixes
- **Code Pattern Recognition**: Advanced pattern matching for vulnerability detection

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   AI Engine     │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (DeepSeek)    │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • Scan Service  │    │ • Fix Generator │
│ • Results View  │    │ • AutoFix API   │    │ • Code Analysis │
│ • PR Management │    │ • GitHub API    │    │ • Explanations  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Security Tools │
                       │                 │
                       │ • Semgrep       │
                       │ • Trivy         │
                       │ • Custom Rules  │
                       └─────────────────┘
```

## 🛠️ Installation & Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git
- GitHub Personal Access Token
- OpenAI API Key

### Quick Start with Docker

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Habib9612/cyber.io.git
   cd cyber.io
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

3. **Start the platform:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Environment Configuration

Create a `.env` file with the following variables:

```env
# DeepSeek Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-coder

# GitHub Configuration
GITHUB_TOKEN=your_github_token_here
GITHUB_USERNAME=your_github_username

# Application Configuration
NODE_ENV=production
PORT=5000
```

### Local Development Setup

1. **Backend setup:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend setup:**
   ```bash
   cd frontend
   pnpm install
   pnpm run dev
   ```

## 📖 Usage

### Basic Workflow

1. **Start a Scan:**
   - Enter a GitHub repository URL in the dashboard
   - Click "Start Scan" to begin the security analysis
   - Monitor real-time progress and results

2. **Review Findings:**
   - View detailed security findings organized by scanner type
   - See severity levels, affected files, and vulnerability descriptions
   - Check your repository's security score and grade

3. **Generate AI Fixes:**
   - Click "Generate Fixes" to create AI-powered remediation code
   - Review fix confidence scores and explanations
   - Preview the proposed changes

4. **Create Pull Request:**
   - Click "Create PR" to automatically generate a GitHub pull request
   - The PR includes all high-confidence fixes with detailed descriptions
   - Review and merge the PR to apply security improvements

### API Endpoints

#### Scan Management
- `POST /api/scan/start` - Start a new repository scan
- `GET /api/scan/status/:scanId` - Get scan progress and results
- `GET /api/scan/list` - List all scans

#### Auto-Fix & PR Creation
- `POST /api/autofix/generate/:scanId` - Generate AI fixes for scan results
- `POST /api/autofix/create-pr/:scanId` - Create GitHub PR with fixes
- `GET /api/autofix/repo-info` - Get repository information

#### Health & Monitoring
- `GET /api/health` - Health check endpoint

### Example API Usage

```javascript
// Start a scan
const response = await fetch('/api/scan/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    repoUrl: 'https://github.com/username/repository',
    scanTypes: ['semgrep', 'trivy']
  })
});

// Generate fixes
const fixResponse = await fetch(`/api/autofix/generate/${scanId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    repoUrl: 'https://github.com/username/repository',
    scanResults: scanData
  })
});
```

## 🔧 Configuration

### Scanner Configuration

The platform supports various configuration options for each scanner:

#### Semgrep Configuration
- Custom rule sets
- Language-specific rules
- Severity filtering
- File exclusions

#### Trivy Configuration
- Vulnerability databases
- Severity thresholds
- Package type filtering
- Container image scanning

### AI Configuration

Configure the AI fix generation:

```env
# AI Model Selection
DEEPSEEK_MODEL=deepseek-coder  # or deepseek-chat

# Fix Generation Settings
AI_CONFIDENCE_THRESHOLD=0.7
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.1
```

## 🚀 Deployment

### Production Deployment

1. **Using Docker Compose:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Environment Setup:**
   - Configure production environment variables
   - Set up SSL certificates
   - Configure reverse proxy (nginx/traefik)

3. **Scaling:**
   - Use Docker Swarm or Kubernetes for scaling
   - Configure load balancing for multiple backend instances
   - Set up Redis for scan state management

### CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run CyberSecScan
        run: |
          curl -X POST "https://your-cybersec-instance.com/api/scan/start" \
            -H "Content-Type: application/json" \
            -d '{"repoUrl": "${{ github.repository }}"}'
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Style

- Use ESLint and Prettier for code formatting
- Follow conventional commit messages
- Add JSDoc comments for functions
- Write tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Semgrep](https://semgrep.dev/) for static analysis
- [Trivy](https://trivy.dev/) for vulnerability scanning
- [OWASP](https://owasp.org/) for security best practices
- [DeepSeek](https://deepseek.com/) for AI capabilities

## 📞 Support

- 📧 Email: support@cyber.io
- 🐛 Issues: [GitHub Issues](https://github.com/Habib9612/cyber.io/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/Habib9612/cyber.io/discussions)

---

**CyberSecScan** - Making security accessible, automated, and intelligent.
