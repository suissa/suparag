import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  
  const navItems = [
    { path: '/', icon: 'dashboard', label: 'Dashboard', exact: true },
    { path: '/customers', icon: 'people', label: 'Clientes' },
    { path: '/interactions', icon: 'chat', label: 'Interações' },
    { path: '/tickets', icon: 'confirmation_number', label: 'Tickets' },
    { path: '/rag', icon: 'description', label: 'Documentos RAG' },
    { path: '/metrics', icon: 'analytics', label: 'Métricas' },
    { path: '/documents', icon: 'folder', label: 'Documents' },
    { path: '/settings', icon: 'settings', label: 'Configurações' },
  ];

  return (
    <div className="flex min-h-screen bg-[#101c22]">
      <aside className="w-64 flex-shrink-0 bg-[#111c22] p-4 flex flex-col justify-between h-screen sticky top-0">
        <div className="flex flex-col gap-2">
          <div className="group flex flex-row items-center justify-center gap-2 px-2 w-full h-[80px] overflow-hidden">
            {/* Aumentei para h-12 (aprox 48px). Se ainda achar pequeno, tente h-14 ou h-16 */}
            <img 
                src="/logo-symbol.png" 
                className="block w-auto object-contain h-[70px]" 
                alt="Símbolo"
            />
            
            {/* <img 
                src="/logo-text-full.png" 
                className="block h-12 w-auto object-contain group-hover:opacity-[0.4] group-hover:scale-[0.5] group-hover:blur-2xl transition-all duration-300
                 transition" 
                alt="Texto"
            /> */}
        </div>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const active = item.exact 
                ? location.pathname === item.path
                : isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? 'bg-primary/20 text-primary'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span 
                    className="material-symbols-outlined"
                    style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {item.icon}
                  </span>
                  <p className="text-sm font-medium leading-normal">{item.label}</p>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-xs text-gray-400 px-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>API Conectada</span>
            </div>
            <div>v1.0.0</div>
          </div>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
