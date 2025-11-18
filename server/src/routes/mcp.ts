import { Router, Request, Response } from 'express';
import { mcpService } from '../services/mcpService';
import { createLogger } from '../services/logger';

const router = Router();
const logger = createLogger('MCPRouter');

/**
 * POST /api/v1/mcp/tools
 * 
 * List available tools
 */
router.post('/tools', async (req: Request, res: Response) => {
  try {
    logger.info('MCP: Listing tools');
    const tools = await mcpService.listTools();
    
    return res.json({
      tools
    });
  } catch (error: any) {
    logger.error('Error listing MCP tools', { error });
    return res.status(500).json({
      error: 'Failed to list tools',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/mcp/resources
 * 
 * List available resources
 */
router.post('/resources', async (req: Request, res: Response) => {
  try {
    logger.info('MCP: Listing resources');
    const resources = await mcpService.listResources();
    
    return res.json({
      resources
    });
  } catch (error: any) {
    logger.error('Error listing MCP resources', { error });
    return res.status(500).json({
      error: 'Failed to list resources',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/mcp/tools/:name
 * 
 * Execute a tool
 */
router.post('/tools/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const toolArgs = req.body.arguments || {};
    
    logger.info('MCP: Executing tool', { name, args: toolArgs });
    const result = await mcpService.executeTool(name, toolArgs);
    
    return res.json({
      result
    });
  } catch (error: any) {
    logger.error('Error executing MCP tool', { error });
    return res.status(500).json({
      error: 'Failed to execute tool',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/mcp/completion
 * 
 * Handle completion requests (simplified)
 */
router.post('/completion', async (req: Request, res: Response) => {
  try {
    const { messages, tools } = req.body;
    
    logger.info('MCP: Handling completion request', { tools: tools?.length });
    
    // Return available tools if requested
    if (tools !== undefined) {
      const availableTools = await mcpService.listTools();
      return res.json({
        tools: availableTools
      });
    }
    
    // Default response
    return res.json({
      message: 'MCP endpoint ready. Use /tools to list available tools.'
    });
  } catch (error: any) {
    logger.error('Error handling MCP completion', { error });
    return res.status(500).json({
      error: 'Failed to handle completion',
      message: error.message
    });
  }
});

export default router;