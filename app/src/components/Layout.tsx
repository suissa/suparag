import { Link, Outlet, useLocation } from 'react-router-dom';
import { FileText, Settings, MessageSquare, Network, Upload } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Upload, label: 'Upload' },
    { path: '/documents', icon: FileText, label: 'Documentos' },
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/graph', icon: Network, label: 'Grafo' },
    { path: '/settings', icon: Settings, label: 'Configurações' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">NeuroPgRag</h1>
          <p className="text-sm text-gray-500 mt-1">Chat AI + RAG + WhatsApp</p>
        </div>

        <nav className="px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>API Conectada</span>
            </div>
            <div className="text-gray-400">v1.0.0</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
