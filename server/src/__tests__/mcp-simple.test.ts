import request from 'supertest';
import app from '../index';

describe('MCP API Simple Test', () => {
  it('should respond to MCP tools endpoint', async () => {
    // Simple test to check if the endpoint exists
    const response = await request(app)
      .post('/api/v1/mcp/tools');
    
    // We expect either 200 or an error, but not a 404
    expect([200, 400, 500]).toContain(response.status);
  });
});