interface ChatbotConfig {
  name: string;
  bot: {
    side: 'left' | 'right';
  };
  user: {
    side: 'left' | 'right';
  };
  visual: {
    theme: string;
    size: {
      w: string;
      'md:max-x'?: string;
      y: string;
      'md:max-y'?: string;
    };
    position: string;
  };
  behavior: {
    in: {
      event: string;
      animation: {
        start: {
          opacity: number;
          scale: number;
        };
        end: {
          opacity: number;
          scale: number;
        };
        duration: number;
        easing: string;
      };
    };
    events: {
      focus?: {
        scale: number;
        opacity: number;
        duration: number;
      };
    };
  };
}

export class ChatbotFactory {
  private config: ChatbotConfig;

  constructor(config: ChatbotConfig) {
    this.config = config;
  }

  /**
   * Converte a configuração de tamanho para classes Tailwind
   */
  getSizeClasses(): string {
    const { size } = this.config.visual;
    const classes: string[] = [];

    // Width
    if (size.w === '100vw') {
      classes.push('w-screen');
    } else {
      classes.push(`w-[${size.w}]`);
    }

    // Max width (responsive)
    if (size['md:max-x']) {
      classes.push(`md:max-w-[${size['md:max-x']}]`);
    }

    // Height
    if (size.y === '100vh') {
      classes.push('h-screen');
    } else {
      classes.push(`h-[${size.y}]`);
    }

    // Max height (responsive)
    if (size['md:max-y']) {
      classes.push(`md:max-h-[${size['md:max-y']}]`);
    }

    return classes.join(' ');
  }

  /**
   * Converte a configuração de posição para classes Tailwind
   */
  getPositionClasses(): string {
    const { position } = this.config.visual;
    
    if (position === 'center.all') {
      return 'flex items-center justify-center';
    }
    
    // Outros casos podem ser adicionados aqui
    return '';
  }

  /**
   * Converte a configuração de animação de entrada para classes Tailwind
   */
  getAnimationClasses(): string {
    const { animation } = this.config.behavior.in;
    const classes: string[] = [];

    // Transição
    classes.push('transition-all');

    // Duração
    const durationMs = animation.duration;
    if (durationMs <= 150) classes.push('duration-150');
    else if (durationMs <= 300) classes.push('duration-300');
    else if (durationMs <= 500) classes.push('duration-500');
    else if (durationMs <= 700) classes.push('duration-700');
    else if (durationMs <= 1000) classes.push('duration-1000');
    else classes.push(`duration-[${durationMs}ms]`);

    // Easing
    const easingMap: Record<string, string> = {
      'easeIn': 'ease-in',
      'easeOut': 'ease-out',
      'easeInOut': 'ease-in-out',
      'linear': 'ease-linear',
    };
    classes.push(easingMap[animation.easing] || 'ease-in-out');

    return classes.join(' ');
  }

  /**
   * Retorna o estilo inline para animação inicial
   */
  getInitialStyle(): React.CSSProperties {
    const { start } = this.config.behavior.in.animation;
    return {
      opacity: start.opacity,
      transform: `scale(${start.scale})`,
    };
  }

  /**
   * Retorna o estilo inline para animação final
   */
  getFinalStyle(): React.CSSProperties {
    const { end } = this.config.behavior.in.animation;
    return {
      opacity: end.opacity,
      transform: `scale(${end.scale})`,
    };
  }

  /**
   * Retorna o estilo inline para evento de foco
   */
  getFocusStyle(): React.CSSProperties | undefined {
    const focus = this.config.behavior.events.focus;
    if (!focus) return undefined;

    return {
      opacity: focus.opacity,
      transform: `scale(${focus.scale})`,
      transition: `all ${focus.duration}ms ease-in-out`,
    };
  }

  /**
   * Retorna classes para alinhamento de mensagens do bot
   */
  getBotMessageClasses(): string {
    const { side } = this.config.bot;
    return side === 'left' ? 'justify-start' : 'justify-end';
  }

  /**
   * Retorna classes para alinhamento de mensagens do usuário
   */
  getUserMessageClasses(): string {
    const { side } = this.config.user;
    return side === 'left' ? 'justify-start' : 'justify-end';
  }

  /**
   * Retorna todas as classes do container principal
   */
  getContainerClasses(): string {
    return [
      this.getSizeClasses(),
      this.getPositionClasses(),
      this.getAnimationClasses(),
    ].join(' ');
  }

  /**
   * Retorna a configuração completa processada
   */
  getProcessedConfig() {
    return {
      name: this.config.name,
      containerClasses: this.getContainerClasses(),
      initialStyle: this.getInitialStyle(),
      finalStyle: this.getFinalStyle(),
      focusStyle: this.getFocusStyle(),
      botMessageClasses: this.getBotMessageClasses(),
      userMessageClasses: this.getUserMessageClasses(),
      animationDuration: this.config.behavior.in.animation.duration,
      animationEvent: this.config.behavior.in.event,
    };
  }
}

/**
 * Hook para usar o ChatbotFactory
 */
export function useChatbotFactory(config: ChatbotConfig) {
  const factory = new ChatbotFactory(config);
  return factory.getProcessedConfig();
}
