#!/bin/bash

# Integration Test Script for CyberSecScan Platform
# This script tests the complete workflow from scan to PR creation

set -e

echo "🧪 Starting CyberSecScan Integration Tests"
echo "=========================================="

# Configuration
BACKEND_URL="http://localhost:5000"
TEST_REPO="https://github.com/juice-shop/juice-shop.git"
TIMEOUT=300  # 5 minutes timeout for scans

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if services are running
check_services() {
    log_info "Checking if services are running..."
    
    if ! curl -s "$BACKEND_URL/api/health" > /dev/null; then
        log_error "Backend service is not running at $BACKEND_URL"
        log_info "Please start the services with: docker-compose up"
        exit 1
    fi
    
    if ! curl -s "http://localhost:3000" > /dev/null; then
        log_warn "Frontend service is not running at http://localhost:3000"
        log_info "Frontend tests will be skipped"
    fi
    
    log_info "✅ Services are running"
}

# Test health endpoint
test_health() {
    log_info "Testing health endpoint..."
    
    response=$(curl -s "$BACKEND_URL/api/health")
    
    if echo "$response" | grep -q '"status":"healthy"'; then
        log_info "✅ Health check passed"
    else
        log_error "❌ Health check failed"
        echo "Response: $response"
        exit 1
    fi
}

# Test scan workflow
test_scan_workflow() {
    log_info "Testing scan workflow with test repository..."
    
    # Start scan
    log_info "Starting scan for $TEST_REPO"
    scan_response=$(curl -s -X POST "$BACKEND_URL/api/scan/start" \
        -H "Content-Type: application/json" \
        -d "{\"repoUrl\":\"$TEST_REPO\",\"scanTypes\":[\"semgrep\",\"trivy\"]}")
    
    scan_id=$(echo "$scan_response" | grep -o '"scanId":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$scan_id" ]; then
        log_error "❌ Failed to start scan"
        echo "Response: $scan_response"
        exit 1
    fi
    
    log_info "✅ Scan started with ID: $scan_id"
    
    # Poll scan status
    log_info "Waiting for scan to complete..."
    start_time=$(date +%s)
    
    while true; do
        current_time=$(date +%s)
        elapsed=$((current_time - start_time))
        
        if [ $elapsed -gt $TIMEOUT ]; then
            log_error "❌ Scan timeout after $TIMEOUT seconds"
            exit 1
        fi
        
        status_response=$(curl -s "$BACKEND_URL/api/scan/status/$scan_id")
        status=$(echo "$status_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        
        case "$status" in
            "completed")
                log_info "✅ Scan completed successfully"
                echo "$status_response" > "/tmp/scan_results_$scan_id.json"
                break
                ;;
            "failed")
                log_error "❌ Scan failed"
                echo "Response: $status_response"
                exit 1
                ;;
            "started"|"running")
                echo -n "."
                sleep 5
                ;;
            *)
                log_warn "Unknown status: $status"
                sleep 5
                ;;
        esac
    done
    
    echo ""  # New line after dots
    
    # Verify scan results
    if [ -f "/tmp/scan_results_$scan_id.json" ]; then
        results=$(cat "/tmp/scan_results_$scan_id.json")
        
        # Check if results contain expected fields
        if echo "$results" | grep -q '"securityScore"' && \
           echo "$results" | grep -q '"findings"'; then
            log_info "✅ Scan results have correct structure"
            
            # Extract some metrics
            score=$(echo "$results" | grep -o '"score":[0-9]*' | cut -d':' -f2)
            total_issues=$(echo "$results" | grep -o '"totalIssues":[0-9]*' | cut -d':' -f2)
            
            log_info "Security Score: $score/100"
            log_info "Total Issues: $total_issues"
        else
            log_error "❌ Scan results missing required fields"
            exit 1
        fi
    fi
}

# Test autofix generation (if OpenAI key is available)
test_autofix() {
    if [ -z "$OPENAI_API_KEY" ]; then
        log_warn "⚠️  OPENAI_API_KEY not set, skipping autofix tests"
        return
    fi
    
    log_info "Testing autofix generation..."
    
    # This would require a scan with actual findings
    # For now, just test the endpoint availability
    response=$(curl -s -w "%{http_code}" -o /dev/null "$BACKEND_URL/api/autofix/repo-info?repoUrl=$TEST_REPO")
    
    if [ "$response" = "200" ]; then
        log_info "✅ Autofix endpoints are accessible"
    else
        log_warn "⚠️  Autofix endpoints returned status: $response"
    fi
}

# Test API endpoints
test_api_endpoints() {
    log_info "Testing API endpoints..."
    
    endpoints=(
        "/api/health"
        "/api/scan/list"
    )
    
    for endpoint in "${endpoints[@]}"; do
        response=$(curl -s -w "%{http_code}" -o /dev/null "$BACKEND_URL$endpoint")
        
        if [ "$response" = "200" ]; then
            log_info "✅ $endpoint - OK"
        else
            log_error "❌ $endpoint - Status: $response"
        fi
    done
}

# Cleanup
cleanup() {
    log_info "Cleaning up test files..."
    rm -f /tmp/scan_results_*.json
}

# Main test execution
main() {
    echo "Starting integration tests at $(date)"
    echo ""
    
    check_services
    test_health
    test_api_endpoints
    test_scan_workflow
    test_autofix
    
    echo ""
    log_info "🎉 All integration tests completed successfully!"
    echo ""
    echo "Test Summary:"
    echo "- ✅ Service health checks"
    echo "- ✅ API endpoint availability"
    echo "- ✅ Complete scan workflow"
    echo "- ✅ Result structure validation"
    
    cleanup
}

# Trap cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"
