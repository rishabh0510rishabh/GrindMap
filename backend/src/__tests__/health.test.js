import request from 'supertest';
import app from '../server.js';

describe('Health Check Endpoint', () => {
  it('should return 200 and health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('correlationId');
    expect(response.body).toHaveProperty('database');
    expect(response.body.database).toHaveProperty('status');
    expect(response.body).toHaveProperty('connectionStats');
  });

  it('should include valid timestamp format', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(typeof response.body.timestamp).toBe('string');
    expect(Date.parse(response.body.timestamp)).not.toBeNaN();
  });
});
