import type { ModalConfig } from '../../types/modal.types';

/**
 * Configuração padrão para o modal de conexão WhatsApp
 * 
 * Esta configuração define a aparência e comportamento do modal usado
 * para gerenciar a conexão com WhatsApp através da Evolution API.
 * 
 * Características:
 * - Suporte automático a tema claro/escuro
 * - Layout responsivo (mobile-first com breakpoint md)
 * - Animações suaves de entrada/saída com Framer Motion
 * - Overlay com blur e fechamento por clique
 * - Fechamento por tecla ESC habilitado
 * 
 * @see {@link ModalConfig} para detalhes sobre cada propriedade
 */
export const whatsAppModalConfig: ModalConfig = {
  /**
   * Configuração de background com suporte a dark mode
   * Usa transparência para permitir blur do overlay
   */
  bg: {
    color: 'bg-white/95 dark:bg-slate-900/95',
  },

  /**
   * Configuração de fontes para diferentes elementos do modal
   * Mantém consistência visual com o design system
   */
  font: {
    title: {
      color: 'text-gray-900 dark:text-white',
      family: 'font-display',
      size: 'text-2xl',
    },
    text: {
      color: 'text-gray-600 dark:text-gray-300',
      family: 'font-display',
      size: 'text-base',
    },
    link: {
      color: 'text-primary hover:text-primary/80',
      family: 'font-display',
      size: 'text-sm',
    },
  },

  /**
   * Configuração de dimensões com breakpoints responsivos
   * Mobile: fullscreen
   * Desktop (md+): 70% width, 80% height com limites máximos
   */
  size: {
    width: 'w-screen',
    height: 'h-screen',
    mdWidth: 'md:w-[70%]',
    mdHeight: 'md:h-[80%]',
    maxWidth: 'max-w-2xl',
    maxHeight: 'max-h-[90vh]',
  },

  /**
   * Configuração do overlay (fundo escurecido)
   * Blur médio para manter contexto visual
   * Fechamento por clique habilitado
   */
  overlay: {
    color: 'bg-black/50',
    opacity: 1,
    blur: 'backdrop-blur-md',
    visible: true,
    clickClose: true,
  },

  /**
   * Layout em grid simples (1 coluna, 1 linha)
   * Pode ser expandido para layouts mais complexos
   */
  grid: {
    cols: 1,
    lines: 1,
  },

  /**
   * Configuração de comportamento e animações
   */
  behavior: {
    /**
     * Animação de entrada: scale up + fade in
     * Duração: 300ms
     */
    enterAnimation: {
      start: { 
        scale: 0.9, 
        opacity: 0 
      },
      finish: { 
        scale: 1, 
        opacity: 1, 
        time: 300 
      },
    },

    /**
     * Animação de saída: scale down + fade out
     * Duração: 200ms (mais rápida que entrada)
     */
    exitAnimation: {
      start: { 
        scale: 1, 
        opacity: 1 
      },
      finish: { 
        scale: 0.9, 
        opacity: 0, 
        time: 200 
      },
    },

    /**
     * Sem animação de hover (modal não é interativo)
     */
    hoverAnimation: {
      scale: 1,
      opacity: 1,
    },

    /**
     * Fechamento por tecla ESC habilitado
     */
    escClose: true,
  },
};

