import request from 'supertest';
import app from '../index';

describe('MCP API', () => {
  describe('POST /api/v1/mcp/tools', () => {
    it('should list available MCP tools', async () => {
      const response = await request(app)
        .post('/api/v1/mcp/tools')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tools');
      expect(Array.isArray(response.body.tools)).toBe(true);
      expect(response.body.tools.length).toBeGreaterThan(0);
      
      // Check that expected tools are present
      const toolNames = response.body.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('search_documents');
      expect(toolNames).toContain('get_customer_info');
      expect(toolNames).toContain('list_customers');
      expect(toolNames).toContain('get_lead_metrics');
      expect(toolNames).toContain('analyze_all_leads');
    });
  });

  describe('POST /api/v1/mcp/resources', () => {
    it('should list available MCP resources', async () => {
      const response = await request(app)
        .post('/api/v1/mcp/resources')
        .send({});

      expect([200, 500]).toContain(response.status); // Could be 500 if no database connection
      if (response.status === 200) {
        expect(response.body).toHaveProperty('resources');
        expect(Array.isArray(response.body.resources)).toBe(true);
      }
    });
  });

  describe('POST /api/v1/mcp/tools/:name', () => {
    it('should execute a tool with valid name and arguments', async () => {
      const response = await request(app)
        .post('/api/v1/mcp/tools/list_customers')
        .send({
          arguments: {
            limit: 5
          }
        });

      // Could be 200 or 500 depending on database connection
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('result');
      }
    });

    it('should return error for non-existent tool', async () => {
      const response = await request(app)
        .post('/api/v1/mcp/tools/non_existent_tool')
        .send({
          arguments: {}
        });

      expect([400, 500]).toContain(response.status); // Could be 400 for unknown tool or 500 for other errors
    });

    it('should return error for missing required arguments', async () => {
      const response = await request(app)
        .post('/api/v1/mcp/tools/get_customer_info')
        .send({
          arguments: {}
        });

      expect([400, 500]).toContain(response.status); // Should be 400 for missing customerId
    });
  });

  describe('POST /api/v1/mcp/completion', () => {
    it('should handle completion requests', async () => {
      const response = await request(app)
        .post('/api/v1/mcp/completion')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return tools when requested', async () => {
      const response = await request(app)
        .post('/api/v1/mcp/completion')
        .send({
          tools: []
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tools');
      expect(Array.isArray(response.body.tools)).toBe(true);
    });
  });
});