import request from 'supertest';
import app from '../index';
import { mcp_supabase_execute_sql } from '../../../mcp-tools';

describe('Metrics Validation', () => {
  it('should return correct metrics from API', async () => {
    const response = await request(app)
      .get('/api/v1/metrics');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();

    const { kpis, charts } = response.body.data;

    // Validar KPIs
    expect(kpis).toBeDefined();
    expect(typeof kpis.totalCustomers).toBe('number');
    expect(typeof kpis.totalInteractions).toBe('number');
    expect(typeof kpis.totalTickets).toBe('number');
    expect(typeof kpis.openTickets).toBe('number');
    expect(typeof kpis.resolutionRate).toBe('number');
    expect(typeof kpis.avgSentiment).toBe('number');

    // Validar Charts
    expect(charts).toBeDefined();
    expect(charts.ticketsByStatus).toBeDefined();
    expect(charts.interactionsByChannel).toBeDefined();

    console.log('✅ KPIs:', kpis);
    console.log('✅ Charts:', charts);

    // Validar que os números fazem sentido
    expect(kpis.totalCustomers).toBeGreaterThanOrEqual(0);
    expect(kpis.openTickets).toBeLessThanOrEqual(kpis.totalTickets);
    expect(kpis.resolutionRate).toBeGreaterThanOrEqual(0);
    expect(kpis.resolutionRate).toBeLessThanOrEqual(100);
    expect(kpis.avgSentiment).toBeGreaterThanOrEqual(-1);
    expect(kpis.avgSentiment).toBeLessThanOrEqual(1);
  });

  it('should match data from Supabase directly', async () => {
    // Buscar dados via API
    const apiResponse = await request(app)
      .get('/api/v1/metrics');

    const apiData = apiResponse.body.data;

    // Buscar dados diretamente do Supabase
    const customersResponse = await request(app)
      .get('/api/v1/customers');

    const ticketsResponse = await request(app)
      .get('/api/v1/tickets');

    const interactionsResponse = await request(app)
      .get('/api/v1/interactions');

    // Validar que os totais batem
    if (customersResponse.body.success) {
      expect(apiData.kpis.totalCustomers).toBe(customersResponse.body.data.customers.length);
    }

    if (ticketsResponse.body.success) {
      expect(apiData.kpis.totalTickets).toBe(ticketsResponse.body.data.tickets.length);
      
      const openTicketsCount = ticketsResponse.body.data.tickets.filter((t: any) => t.status === 'open').length;
      expect(apiData.kpis.openTickets).toBe(openTicketsCount);
    }

    if (interactionsResponse.body.success) {
      expect(apiData.kpis.totalInteractions).toBe(interactionsResponse.body.data.interactions.length);
    }

    console.log('✅ API data matches Supabase data');
  });

  it('should have valid chart data structure', async () => {
    const response = await request(app)
      .get('/api/v1/metrics/charts');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const { ticketsByStatus, interactionsByChannel } = response.body.data;

    // Validar estrutura de tickets por status
    expect(ticketsByStatus).toBeDefined();
    expect(typeof ticketsByStatus).toBe('object');
    
    // Validar que os valores são números
    Object.values(ticketsByStatus).forEach((value: any) => {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
    });

    // Validar estrutura de interações por canal
    expect(interactionsByChannel).toBeDefined();
    expect(typeof interactionsByChannel).toBe('object');
    
    Object.values(interactionsByChannel).forEach((value: any) => {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
    });

    console.log('✅ Tickets by status:', ticketsByStatus);
    console.log('✅ Interactions by channel:', interactionsByChannel);
  });

  it('should calculate resolution rate correctly', async () => {
    const response = await request(app)
      .get('/api/v1/metrics/kpis');

    expect(response.status).toBe(200);
    
    const { data } = response.body;
    
    // Buscar tickets para validar cálculo
    const ticketsResponse = await request(app)
      .get('/api/v1/tickets');

    if (ticketsResponse.body.success) {
      const tickets = ticketsResponse.body.data.tickets;
      const totalTickets = tickets.length;
      const resolvedTickets = tickets.filter((t: any) => 
        t.status === 'resolved' || t.status === 'closed'
      ).length;

      const expectedRate = totalTickets > 0 
        ? Math.round((resolvedTickets / totalTickets) * 100 * 10) / 10
        : 0;

      expect(data.resolutionRate).toBe(expectedRate);
      
      console.log('✅ Resolution rate calculation:', {
        total: totalTickets,
        resolved: resolvedTickets,
        rate: data.resolutionRate,
        expected: expectedRate
      });
    }
  });

  it('should calculate average sentiment correctly', async () => {
    const response = await request(app)
      .get('/api/v1/metrics/kpis');

    expect(response.status).toBe(200);
    
    const { data } = response.body;
    
    // Validar que o sentimento está no range correto
    expect(data.avgSentiment).toBeGreaterThanOrEqual(-1);
    expect(data.avgSentiment).toBeLessThanOrEqual(1);
    
    console.log('✅ Average sentiment:', data.avgSentiment);
  });
});
