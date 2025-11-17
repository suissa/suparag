import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const VISIT_TOKEN_KEY = 'neuroPgRag_hasVisited';

interface FirstVisitGuardProps {
  children: React.ReactNode;
}

/**
 * FirstVisitGuard - HOC que detecta primeira visita e redireciona para /customers
 * 
 * Funcionalidade:
 * - Verifica se existe token 'neuroPgRag_hasVisited' no localStorage
 * - Se não existir e usuário estiver na rota raiz (/), redireciona para /customers
 * - Cria o token após o redirecionamento para marcar que o usuário já visitou
 * - Em visitas subsequentes, permite navegação normal
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export function FirstVisitGuard({ children }: FirstVisitGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      // Verificar se já existe o token de visita
      const hasVisited = localStorage.getItem(VISIT_TOKEN_KEY);
      
      // Se é primeira visita (sem token) e está na rota raiz
      if (!hasVisited && location.pathname === '/') {
        console.log('[FirstVisitGuard] Primeira visita detectada, redirecionando para /customers');
        
        // Marcar como visitado antes de redirecionar
        localStorage.setItem(VISIT_TOKEN_KEY, 'true');
        
        // Redirecionar para /customers (replace para não adicionar ao histórico)
        navigate('/customers', { replace: true });
      }
    } catch (error) {
      // Fallback caso localStorage esteja bloqueado
      console.error('[FirstVisitGuard] Erro ao acessar localStorage:', error);
      // Continuar sem redirecionamento - usuário verá rota padrão
    }
  }, [navigate, location]);

  return <>{children}</>;
}
