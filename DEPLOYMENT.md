# CyberSecScan Deployment Guide

This guide provides comprehensive instructions for deploying the CyberSecScan platform in various environments.

## 🚀 Quick Start (Local Development)

### Prerequisites
- Docker and Docker Compose
- Git
- Node.js 18+ (for local development)
- GitHub Personal Access Token
- OpenAI API Key

### 1. Clone and Configure

```bash
git clone https://github.com/Habib9612/cyber.io.git
cd cyber.io
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file:

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

### 3. Start Services

```bash
# Development mode
docker-compose up --build

# Production mode
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

## 🏗️ Production Deployment

### Docker Swarm Deployment

1. **Initialize Swarm**
   ```bash
   docker swarm init
   ```

2. **Deploy Stack**
   ```bash
   docker stack deploy -c docker-compose.prod.yml cybersec
   ```

3. **Scale Services**
   ```bash
   docker service scale cybersec_backend=3
   docker service scale cybersec_frontend=2
   ```

### Kubernetes Deployment

1. **Create Namespace**
   ```bash
   kubectl create namespace cybersec
   ```

2. **Apply Configurations**
   ```bash
   kubectl apply -f k8s/
   ```

3. **Verify Deployment**
   ```bash
   kubectl get pods -n cybersec
   kubectl get services -n cybersec
   ```

### Cloud Platform Deployment

#### AWS ECS

1. **Create Task Definitions**
   - Use the provided `aws-ecs-task-definition.json`
   - Configure environment variables in AWS Parameter Store

2. **Create ECS Service**
   ```bash
   aws ecs create-service \
     --cluster cybersec-cluster \
     --service-name cybersec-service \
     --task-definition cybersec-task \
     --desired-count 2
   ```

#### Google Cloud Run

1. **Build and Push Images**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/cybersec-backend backend/
   gcloud builds submit --tag gcr.io/PROJECT_ID/cybersec-frontend frontend/
   ```

2. **Deploy Services**
   ```bash
   gcloud run deploy cybersec-backend \
     --image gcr.io/PROJECT_ID/cybersec-backend \
     --platform managed \
     --region us-central1
   ```

#### Azure Container Instances

1. **Create Resource Group**
   ```bash
   az group create --name cybersec-rg --location eastus
   ```

2. **Deploy Container Group**
   ```bash
   az container create \
     --resource-group cybersec-rg \
     --file azure-container-group.yaml
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DEEPSEEK_API_KEY` | DeepSeek API key for AI fixes | Yes | - |
| `GITHUB_TOKEN` | GitHub personal access token | Yes | - |
| `GITHUB_USERNAME` | GitHub username | Yes | - |
| `DEEPSEEK_MODEL` | DeepSeek model to use | No | `deepseek-coder` |
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Backend server port | No | `5000` |
| `GITHUB_WEBHOOK_SECRET` | Webhook secret for GitHub | No | - |

### Security Configuration

1. **SSL/TLS Setup**
   ```bash
   # Generate self-signed certificates for development
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout ssl/key.pem -out ssl/cert.pem
   ```

2. **Firewall Rules**
   ```bash
   # Allow only necessary ports
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw deny 5000/tcp  # Block direct backend access
   ```

3. **Rate Limiting**
   - Configured in `nginx.conf`
   - API: 10 requests/second
   - General: 30 requests/second

### Database Configuration (Optional)

For production deployments, consider adding a database:

1. **PostgreSQL**
   ```yaml
   postgres:
     image: postgres:15
     environment:
       POSTGRES_DB: cybersec
       POSTGRES_USER: cybersec
       POSTGRES_PASSWORD: ${DB_PASSWORD}
     volumes:
       - postgres_data:/var/lib/postgresql/data
   ```

2. **Redis for Caching**
   ```yaml
   redis:
     image: redis:7-alpine
     volumes:
       - redis_data:/data
   ```

## 📊 Monitoring and Logging

### Health Checks

The platform includes built-in health checks:

- Backend: `GET /api/health`
- Frontend: `GET /health`

### Logging Configuration

1. **Structured Logging**
   ```javascript
   // Add to backend/src/utils/logger.js
   const winston = require('winston');
   
   const logger = winston.createLogger({
     level: 'info',
     format: winston.format.json(),
     transports: [
       new winston.transports.File({ filename: 'error.log', level: 'error' }),
       new winston.transports.File({ filename: 'combined.log' })
     ]
   });
   ```

2. **Log Aggregation**
   ```yaml
   # Add to docker-compose.prod.yml
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```

### Monitoring with Prometheus

1. **Add Metrics Endpoint**
   ```javascript
   // backend/src/routes/metrics.js
   const promClient = require('prom-client');
   
   const register = new promClient.Registry();
   const httpRequestDuration = new promClient.Histogram({
     name: 'http_request_duration_seconds',
     help: 'Duration of HTTP requests in seconds',
     labelNames: ['method', 'route', 'status_code']
   });
   ```

2. **Prometheus Configuration**
   ```yaml
   # prometheus.yml
   scrape_configs:
     - job_name: 'cybersec-backend'
       static_configs:
         - targets: ['backend:5000']
   ```

## 🔄 CI/CD Pipeline

### GitHub Actions

The platform includes automated CI/CD:

1. **Continuous Integration**
   - Runs tests on every PR
   - Security scanning with Semgrep and Trivy
   - Code quality checks

2. **Continuous Deployment**
   - Builds Docker images on main branch
   - Pushes to container registry
   - Deploys to staging/production

### Manual Deployment

```bash
# Build and tag images
docker build -t cybersec-backend:latest backend/
docker build -t cybersec-frontend:latest frontend/

# Push to registry
docker tag cybersec-backend:latest your-registry/cybersec-backend:latest
docker push your-registry/cybersec-backend:latest

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 🧪 Testing

### Integration Tests

Run the complete test suite:

```bash
# Start services
docker-compose up -d

# Run integration tests
./test-integration.sh

# Run unit tests
cd backend && npm test
cd frontend && pnpm test
```

### Load Testing

```bash
# Install artillery
npm install -g artillery

# Run load tests
artillery run load-test.yml
```

## 🚨 Troubleshooting

### Common Issues

1. **Backend not starting**
   ```bash
   # Check logs
   docker-compose logs backend
   
   # Verify environment variables
   docker-compose exec backend env | grep -E "(OPENAI|GITHUB)"
   ```

2. **Scan failures**
   ```bash
   # Check scanner availability
   docker-compose exec backend semgrep --version
   docker-compose exec backend trivy --version
   ```

3. **Frontend build errors**
   ```bash
   # Clear cache and rebuild
   cd frontend
   rm -rf node_modules dist
   pnpm install
   pnpm build
   ```

### Performance Optimization

1. **Backend Optimization**
   - Use Redis for scan result caching
   - Implement connection pooling
   - Add request queuing for heavy scans

2. **Frontend Optimization**
   - Enable gzip compression
   - Implement code splitting
   - Use CDN for static assets

3. **Database Optimization**
   - Add indexes for frequently queried fields
   - Implement read replicas
   - Use connection pooling

## 📞 Support

For deployment issues:

1. Check the [troubleshooting guide](TROUBLESHOOTING.md)
2. Review logs and error messages
3. Open an issue on [GitHub](https://github.com/Habib9612/cyber.io/issues)
4. Contact support at support@cyber.io

---

**Note**: This deployment guide assumes familiarity with Docker, container orchestration, and cloud platforms. For production deployments, ensure proper security measures, monitoring, and backup strategies are in place.
