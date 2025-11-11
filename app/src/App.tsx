import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Upload from './pages/Upload';
import Documents from './pages/Documents';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';
import { WhatsAppConnectionProvider } from './contexts/WhatsAppConnectionContext';
import Uploadfull from './pages/Uploadfull';

function App() {
  return (
    <WhatsAppConnectionProvider>
      <BrowserRouter>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="upload" element={
            <div className="flex min-h-screen bg-[#101c22]">
              <Sidebar />
              <main className="flex-1 p-8 overflow-y-auto">
                <Upload />
              </main>
            </div>
          } />
          <Route path="documents" element={
            <div className="flex min-h-screen bg-[#101c22]">
              <Sidebar />
              <main className="flex-1 p-8 overflow-y-auto">
                <Documents />
              </main>
            </div>
          } />
          <Route path="uploadfull" element={
            <div className="flex min-h-screen bg-[#101c22]">
              <Sidebar />
              <main className="flex-1 p-8 overflow-y-auto">
                <Uploadfull />
              </main>
            </div>
          } />
          <Route path="settings" element={
            <div className="flex min-h-screen bg-[#101c22]">
              <Sidebar />
              <main className="flex-1 p-8 overflow-y-auto">
                <Settings />
              </main>
            </div>
          } />
          <Route path="chat" element={
            <div className="flex min-h-screen bg-[#101c22]">
              <Sidebar />
              <main className="flex-1 p-8 overflow-y-auto">
                <div className="text-center py-12 text-white">Chat em desenvolvimento...</div>
              </main>
            </div>
          } />
          <Route path="analytics" element={
            <div className="flex min-h-screen bg-[#101c22]">
              <Sidebar />
              <main className="flex-1 p-8 overflow-y-auto">
                <div className="text-center py-12 text-white">Analytics em desenvolvimento...</div>
              </main>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </WhatsAppConnectionProvider>
  );
}

export default App;
