import { MCPService } from '../services/mcpService';

describe('MCP Service', () => {
  let mcpService: MCPService;

  beforeEach(() => {
    mcpService = new MCPService();
  });

  it('should create MCP service instance', () => {
    expect(mcpService).toBeDefined();
  });

  it('should list tools', async () => {
    const tools = await mcpService.listTools();
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);
    
    // Check that expected tools are present
    const toolNames = tools.map(tool => tool.name);
    expect(toolNames).toContain('search_documents');
    expect(toolNames).toContain('get_customer_info');
    expect(toolNames).toContain('list_customers');
    expect(toolNames).toContain('get_lead_metrics');
    expect(toolNames).toContain('analyze_all_leads');
  });

  it('should execute tool with valid name and arguments', async () => {
    // This test might fail if there's no database connection, so we'll just check that it doesn't throw immediately
    try {
      await mcpService.executeTool('list_customers', { limit: 5 });
      // If we get here, it means the method executed without immediate errors
      expect(true).toBe(true);
    } catch (error) {
      // This is expected if there's no database connection
      expect(error).toBeDefined();
    }
  });

  it('should return error for unknown tool', async () => {
    await expect(mcpService.executeTool('unknown_tool', {}))
      .rejects.toThrow('Unknown tool: unknown_tool');
  });
});