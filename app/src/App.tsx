import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CRMProvider } from './contexts/CRMContext';
import { WhatsAppConnectionProvider } from './contexts/WhatsAppConnectionContext';

// Páginas existentes
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Documents from './pages/Documents';
import Settings from './pages/Settings';
import Uploadfull from './pages/Uploadfull';

// Novas páginas CRM
import CustomersPage from './pages/customers/index';
import CustomerDetailPage from './pages/customers/[id]';
import InteractionsPage from './pages/interactions/index';
import TicketsPage from './pages/tickets/index';
import RagPage from './pages/rag/index';
import MetricsPage from './pages/metrics/index';

import { DashboardLayout } from './layouts/DashboardLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CRMProvider>
        <WhatsAppConnectionProvider>
          <BrowserRouter>
            <Routes>
              <Route index element={<Dashboard />} />
              
              {/* Rotas CRM */}
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/:id" element={<CustomerDetailPage />} />
              <Route path="/interactions" element={<InteractionsPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/rag" element={<RagPage />} />
              <Route path="/metrics" element={<MetricsPage />} />
              
              {/* Rotas existentes */}
              <Route path="/upload" element={
                <DashboardLayout>
                  <Upload />
                </DashboardLayout>
              } />
              <Route path="/documents" element={
                <DashboardLayout>
                  <Documents />
                </DashboardLayout>
              } />
              <Route path="/uploadfull" element={
                <DashboardLayout>
                  <Uploadfull />
                </DashboardLayout>
              } />
              <Route path="/settings" element={
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              } />
              <Route path="/chat" element={
                <DashboardLayout>
                  <div className="text-center py-12 text-white">Chat em desenvolvimento...</div>
                </DashboardLayout>
              } />
              <Route path="/analytics" element={
                <DashboardLayout>
                  <div className="text-center py-12 text-white">Analytics em desenvolvimento...</div>
                </DashboardLayout>
              } />
            </Routes>
          </BrowserRouter>
        </WhatsAppConnectionProvider>
      </CRMProvider>
    </QueryClientProvider>
  );
}

export default App;
