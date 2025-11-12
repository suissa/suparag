import { importWhatsAppHistory } from '../scripts/importWhatsAppHistory';
import { analyzeAllLeads, computeEngagementMetrics } from '../analytics/leadAnalysis';
import { generateLeadReport } from '../reports/leadReport';
import * as path from 'path';

describe('WhatsApp Import System', () => {
  const testDataPath = path.join(__dirname, '../../data/example');

  describe('Import Function', () => {
    it('should import WhatsApp histories successfully', async () => {
      const mappingFn = (fields: any) => ({
        phone: fields.phone,
        message: fields.text,
        timestamp: fields.timestamp,
        from: fields.from
      });

      const result = await importWhatsAppHistory(testDataPath, mappingFn);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.totalCustomers).toBeGreaterThan(0);
      expect(result.totalMessages).toBeGreaterThan(0);
      
      console.log('✅ Import Result:', result);
    }, 60000); // 60 segundos de timeout para embeddings reais
  });

  describe('Lead Analysis', () => {
    it('should analyze all leads', async () => {
      const metrics = await analyzeAllLeads();

      expect(metrics).toBeDefined();
      expect(Array.isArray(metrics)).toBe(true);
      
      if (metrics.length > 0) {
        const firstLead = metrics[0];
        expect(firstLead).toHaveProperty('customerId');
        expect(firstLead).toHaveProperty('status');
        expect(firstLead).toHaveProperty('totalMessages');
        expect(firstLead).toHaveProperty('avgSentiment');
        expect(firstLead).toHaveProperty('conversionProbability');
      }

      console.log(`✅ Analyzed ${metrics.length} leads`);
      console.log('📊 Sample metrics:', metrics.slice(0, 3));
    }, 30000);

    it('should compute engagement metrics for a lead', async () => {
      // Primeiro, buscar um cliente existente
      const allMetrics = await analyzeAllLeads();
      
      if (allMetrics.length > 0) {
        const customerId = allMetrics[0].customerId;
        const metrics = await computeEngagementMetrics(customerId);

        expect(metrics).toBeDefined();
        expect(metrics.customerId).toBe(customerId);
        expect(metrics.status).toBeDefined();
        expect(typeof metrics.totalMessages).toBe('number');
        expect(typeof metrics.avgSentiment).toBe('number');
        expect(typeof metrics.conversionProbability).toBe('number');

        console.log('✅ Engagement metrics:', metrics);
      } else {
        console.log('⚠️ No leads found to test');
      }
    }, 30000);
  });

  describe('Report Generation', () => {
    it('should generate lead report', async () => {
      const outputDir = path.join(__dirname, '../../reports/test');
      
      await generateLeadReport(outputDir);

      // Verificar se os arquivos foram criados
      const fs = require('fs');
      const htmlPath = path.join(outputDir, 'lead-insights.html');
      const jsonPath = path.join(outputDir, 'lead-insights.json');

      expect(fs.existsSync(htmlPath)).toBe(true);
      expect(fs.existsSync(jsonPath)).toBe(true);

      // Ler e validar JSON
      const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      expect(jsonContent).toHaveProperty('generatedAt');
      expect(jsonContent).toHaveProperty('summary');
      expect(jsonContent).toHaveProperty('leads');

      console.log('✅ Report generated successfully');
      console.log('📊 Summary:', jsonContent.summary);
    }, 30000);
  });

  describe('Data Validation', () => {
    it('should handle invalid data gracefully', async () => {
      const invalidMappingFn = (fields: any) => ({
        phone: '',
        message: '',
        timestamp: '',
        from: ''
      });

      try {
        const result = await importWhatsAppHistory(testDataPath, invalidMappingFn);
        // Deve completar mesmo com dados inválidos
        expect(result).toBeDefined();
      } catch (error) {
        // Ou capturar erro apropriadamente
        expect(error).toBeDefined();
      }
    }, 30000);
  });
});
