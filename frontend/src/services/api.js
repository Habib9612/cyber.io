const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.sessionId = localStorage.getItem('sessionId');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    if (response.sessionId) {
      this.sessionId = response.sessionId;
      localStorage.setItem('sessionId', response.sessionId);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  async register(name, email, password) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });

    if (response.sessionId) {
      this.sessionId = response.sessionId;
      localStorage.setItem('sessionId', response.sessionId);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  async socialLogin(provider, email, name) {
    const response = await this.request('/auth/social-login', {
      method: 'POST',
      body: { provider, email, name },
    });

    if (response.sessionId) {
      this.sessionId = response.sessionId;
      localStorage.setItem('sessionId', response.sessionId);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  async logout() {
    if (this.sessionId) {
      await this.request('/auth/logout', {
        method: 'POST',
        body: { sessionId: this.sessionId },
      });
    }

    this.sessionId = null;
    localStorage.removeItem('sessionId');
    localStorage.removeItem('user');
  }

  async getProfile() {
    if (!this.sessionId) {
      throw new Error('No active session');
    }

    return await this.request(`/auth/profile/${this.sessionId}`);
  }

  // Scan methods
  async startScan(repoUrl, scanTypes = ['semgrep', 'trivy']) {
    return await this.request('/scan/start', {
      method: 'POST',
      body: { repoUrl, scanTypes },
    });
  }

  async getScanStatus(scanId) {
    return await this.request(`/scan/status/${scanId}`);
  }

  async listScans() {
    return await this.request('/scan/list');
  }

  // AutoFix methods
  async generateFixes(scanId, repoUrl, scanResults) {
    return await this.request(`/autofix/generate/${scanId}`, {
      method: 'POST',
      body: { repoUrl, scanResults },
    });
  }

  async createPullRequest(scanId, repoUrl, fixes) {
    return await this.request(`/autofix/create-pr/${scanId}`, {
      method: 'POST',
      body: { repoUrl, fixes },
    });
  }

  async getRepositoryInfo(repoUrl) {
    return await this.request(`/autofix/repo-info?repoUrl=${encodeURIComponent(repoUrl)}`);
  }

  // Health check
  async healthCheck() {
    return await this.request('/health');
  }

  // Utility methods
  isAuthenticated() {
    return !!this.sessionId && !!localStorage.getItem('user');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  setSessionId(sessionId) {
    this.sessionId = sessionId;
    localStorage.setItem('sessionId', sessionId);
  }
}

export default new ApiService();
