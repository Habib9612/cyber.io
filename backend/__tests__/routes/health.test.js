const request = require('supertest');
const express = require('express');
const healthRoutes = require('../../src/routes/health');

const app = express();
app.use('/api/health', healthRoutes);

describe('Health Routes', () => {
  test('GET /api/health should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('memory');
    expect(response.body).toHaveProperty('version');
  });

  test('Health response should have correct structure', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(typeof response.body.uptime).toBe('number');
    expect(typeof response.body.memory).toBe('object');
    expect(response.body.memory).toHaveProperty('rss');
    expect(response.body.memory).toHaveProperty('heapTotal');
    expect(response.body.memory).toHaveProperty('heapUsed');
  });
});
