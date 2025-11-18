import { supabase } from '../config/supabase';
import { createLogger } from './logger';
import { computeEngagementMetrics, analyzeAllLeads as analyzeAllLeadsFunc } from '../analytics/leadAnalysis';

// Types for MCP
interface MCPResource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

interface MCPRequest {
  method: string;
  params?: any;
}

interface MCPResponse {
  result?: any;
  error?: {
    type: string;
    message: string;
    code?: number;
  };
}

// Logger
const logger = createLogger('MCPService');

/**
 * MCP Service - Model Context Protocol implementation
 * 
 * This service provides an interface for AI models to interact with the application
 * through standardized Model Context Protocol (MCP) methods.
 */
export class MCPService {
  /**
   * List available tools that can be used by AI models
   */
  async listTools(): Promise<MCPTool[]> {
    logger.info('MCP: Listing available tools');
    
    return [
      {
        name: 'search_documents',
        description: 'Search for relevant information in uploaded documents using RAG',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find relevant document content'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'get_customer_info',
        description: 'Get information about a specific customer',
        inputSchema: {
          type: 'object',
          properties: {
            customerId: {
              type: 'string',
              description: 'ID of the customer to retrieve'
            }
          },
          required: ['customerId']
        }
      },
      {
        name: 'list_customers',
        description: 'List all customers with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of customers to return',
              default: 10
            }
          }
        }
      },
      {
        name: 'get_lead_metrics',
        description: 'Get lead analysis metrics for a specific customer',
        inputSchema: {
          type: 'object',
          properties: {
            customerId: {
              type: 'string',
              description: 'ID of the customer to analyze'
            }
          },
          required: ['customerId']
        }
      },
      {
        name: 'analyze_all_leads',
        description: 'Get analysis metrics for all leads',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  /**
   * List available resources (documents, data, etc.)
   */
  async listResources(): Promise<MCPResource[]> {
    logger.info('MCP: Listing available resources');
    
    try {
      // Get list of documents
      const { data: documents, error } = await supabase
        .from('documents')
        .select('id, filename, type, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching documents for MCP resources', { error });
        return [];
      }

      return documents?.map(doc => ({
        uri: `file://documents/${doc.id}`,
        name: doc.filename,
        description: `Document: ${doc.filename} (${doc.type})`,
        mimeType: this.getMimeType(doc.type)
      })) || [];
    } catch (error) {
      logger.error('Error listing MCP resources', { error });
      return [];
    }
  }

  /**
   * Handle tool execution requests
   */
  async executeTool(name: string, arguments_: any): Promise<any> {
    logger.info('MCP: Executing tool', { name, arguments_ });
    
    try {
      switch (name) {
        case 'search_documents':
          const query = arguments_?.query;
          if (!query) {
            throw new Error('Missing required argument: query');
          }
          return await this.searchDocuments(query);
          
        case 'get_customer_info':
          const customerId = arguments_?.customerId;
          if (!customerId) {
            throw new Error('Missing required argument: customerId');
          }
          return await this.getCustomerInfo(customerId);
          
        case 'list_customers':
          const limit = arguments_?.limit || 10;
          return await this.listCustomers(limit);
          
        case 'get_lead_metrics':
          const leadCustomerId = arguments_?.customerId;
          if (!leadCustomerId) {
            throw new Error('Missing required argument: customerId');
          }
          return await this.getLeadMetrics(leadCustomerId);
          
        case 'analyze_all_leads':
          return await this.analyzeAllLeads();
          
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error: any) {
      logger.error('Error executing MCP tool', { name, error });
      throw error;
    }
  }

  /**
   * Search documents using RAG
   */
  private async searchDocuments(query: string): Promise<any> {
    logger.info('MCP: Searching documents', { query });
    
    try {
      // Generate embedding for the query
      // Note: In a real implementation, this would call the same embedding service used in chat.ts
      const dummyEmbedding = new Array(1536).fill(0).map(() => Math.random());
      
      // Search for relevant chunks using the embedding
      const { data: chunks, error } = await supabase
        .rpc('match_documents', {
          query_embedding: dummyEmbedding,
          match_threshold: 0.5,
          match_count: 5
        });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        query,
        results: chunks?.map((chunk: any) => ({
          documentId: chunk.document_id,
          content: chunk.content,
          similarity: chunk.similarity
        })) || []
      };
    } catch (error) {
      logger.error('Error searching documents', { error });
      throw error;
    }
  }

  /**
   * Get customer information
   */
  private async getCustomerInfo(customerId: string): Promise<any> {
    logger.info('MCP: Getting customer info', { customerId });
    
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) {
        throw new Error(`Customer not found: ${error.message}`);
      }

      return customer;
    } catch (error) {
      logger.error('Error getting customer info', { customerId, error });
      throw error;
    }
  }

  /**
   * List customers
   */
  private async listCustomers(limit: number = 10): Promise<any> {
    logger.info('MCP: Listing customers', { limit });
    
    try {
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return customers || [];
    } catch (error) {
      logger.error('Error listing customers', { error });
      throw error;
    }
  }

  /**
   * Get lead metrics for a specific customer
   */
  private async getLeadMetrics(customerId: string): Promise<any> {
    logger.info('MCP: Getting lead metrics', { customerId });
    
    try {
      const metrics = await computeEngagementMetrics(customerId);
      return metrics;
    } catch (error) {
      logger.error('Error getting lead metrics', { customerId, error });
      throw error;
    }
  }

  /**
   * Analyze all leads
   */
  private async analyzeAllLeads(): Promise<any> {
    logger.info('MCP: Analyzing all leads');
    
    try {
      const metrics = await analyzeAllLeadsFunc();
      return metrics;
    } catch (error) {
      logger.error('Error analyzing all leads', { error });
      throw error;
    }
  }

  /**
   * Get MIME type based on file extension
   */
  private getMimeType(fileType: string): string {
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'json': 'application/json'
    };
    
    return mimeTypes[fileType] || 'application/octet-stream';
  }
}

// Export singleton instance
export const mcpService = new MCPService();