import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Upload from './pages/Upload';
import Documents from './pages/Documents';
import Settings from './pages/Settings';
import { WhatsAppConnectionProvider } from './contexts/WhatsAppConnectionContext';

function App() {
  return (
    <WhatsAppConnectionProvider>
      <BrowserRouter>
        <div className="flex min-h-screen bg-[#101c22]">
          <Sidebar />
          <main className="flex-1 p-8 overflow-y-auto">
            <Routes>
              <Route index element={<Upload />} />
              <Route path="documents" element={<Documents />} />
              <Route path="settings" element={<Settings />} />
              <Route path="chat" element={<div className="text-center py-12 text-white">Chat em desenvolvimento...</div>} />
              <Route path="analytics" element={<div className="text-center py-12 text-white">Analytics em desenvolvimento...</div>} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </WhatsAppConnectionProvider>
  );
}

export default App;
