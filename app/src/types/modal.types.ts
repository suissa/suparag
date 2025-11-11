/**
 * Configuração de animação para entrada/saída do modal
 */
export interface AnimationConfig {
  start?: {
    scale?: number;
    opacity?: number;
    blur?: string;
  };
  finish?: {
    scale?: number;
    opacity?: number;
    blur?: string;
    time?: number;
  };
}

/**
 * Configuração completa do modal configurável
 * Todas as propriedades são opcionais e possuem valores padrão
 */
export interface ModalConfig {
  /**
   * Configuração de background do modal
   */
  bg?: {
    color?: string;
    gradient?: string;
  };

  /**
   * Configuração de fontes para diferentes elementos
   */
  font?: {
    title?: {
      color?: string;
      family?: string;
      size?: string;
    };
    text?: {
      color?: string;
      family?: string;
      size?: string;
    };
    link?: {
      color?: string;
      family?: string;
      size?: string;
    };
  };

  /**
   * Configuração de dimensões do modal
   */
  size?: {
    width?: string;
    height?: string;
    mdWidth?: string;
    mdHeight?: string;
    maxWidth?: string;
    maxHeight?: string;
  };

  /**
   * Configuração do overlay (fundo escurecido)
   */
  overlay?: {
    color?: string;
    opacity?: number;
    blur?: string;
    visible?: boolean;
    clickClose?: boolean;
  };

  /**
   * Configuração de layout em grid
   */
  grid?: {
    cols?: number;
    lines?: number;
  };

  /**
   * Configuração de comportamento e animações
   */
  behavior?: {
    enterAnimation?: AnimationConfig;
    exitAnimation?: AnimationConfig;
    hoverAnimation?: {
      scale?: number;
      opacity?: number;
    };
    escClose?: boolean;
  };
}

/**
 * Type guard para validar se um objeto é uma AnimationConfig válida
 */
export function isAnimationConfig(obj: unknown): obj is AnimationConfig {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const config = obj as AnimationConfig;
  
  if (config.start !== undefined) {
    if (typeof config.start !== 'object' || config.start === null) return false;
    if (config.start.scale !== undefined && typeof config.start.scale !== 'number') return false;
    if (config.start.opacity !== undefined && typeof config.start.opacity !== 'number') return false;
    if (config.start.blur !== undefined && typeof config.start.blur !== 'string') return false;
  }
  
  if (config.finish !== undefined) {
    if (typeof config.finish !== 'object' || config.finish === null) return false;
    if (config.finish.scale !== undefined && typeof config.finish.scale !== 'number') return false;
    if (config.finish.opacity !== undefined && typeof config.finish.opacity !== 'number') return false;
    if (config.finish.blur !== undefined && typeof config.finish.blur !== 'string') return false;
    if (config.finish.time !== undefined && typeof config.finish.time !== 'number') return false;
  }
  
  return true;
}

/**
 * Type guard para validar se um objeto é uma ModalConfig válida
 */
export function isModalConfig(obj: unknown): obj is ModalConfig {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const config = obj as ModalConfig;
  
  // Validar bg
  if (config.bg !== undefined) {
    if (typeof config.bg !== 'object' || config.bg === null) return false;
    if (config.bg.color !== undefined && typeof config.bg.color !== 'string') return false;
    if (config.bg.gradient !== undefined && typeof config.bg.gradient !== 'string') return false;
  }
  
  // Validar font
  if (config.font !== undefined) {
    if (typeof config.font !== 'object' || config.font === null) return false;
    
    const validateFontSection = (section: unknown) => {
      if (typeof section !== 'object' || section === null) return false;
      const s = section as { color?: string; family?: string; size?: string };
      if (s.color !== undefined && typeof s.color !== 'string') return false;
      if (s.family !== undefined && typeof s.family !== 'string') return false;
      if (s.size !== undefined && typeof s.size !== 'string') return false;
      return true;
    };
    
    if (config.font.title !== undefined && !validateFontSection(config.font.title)) return false;
    if (config.font.text !== undefined && !validateFontSection(config.font.text)) return false;
    if (config.font.link !== undefined && !validateFontSection(config.font.link)) return false;
  }
  
  // Validar size
  if (config.size !== undefined) {
    if (typeof config.size !== 'object' || config.size === null) return false;
    const sizeProps = ['width', 'height', 'mdWidth', 'mdHeight', 'maxWidth', 'maxHeight'];
    for (const prop of sizeProps) {
      const value = (config.size as Record<string, unknown>)[prop];
      if (value !== undefined && typeof value !== 'string') return false;
    }
  }
  
  // Validar overlay
  if (config.overlay !== undefined) {
    if (typeof config.overlay !== 'object' || config.overlay === null) return false;
    if (config.overlay.color !== undefined && typeof config.overlay.color !== 'string') return false;
    if (config.overlay.opacity !== undefined && typeof config.overlay.opacity !== 'number') return false;
    if (config.overlay.blur !== undefined && typeof config.overlay.blur !== 'string') return false;
    if (config.overlay.visible !== undefined && typeof config.overlay.visible !== 'boolean') return false;
    if (config.overlay.clickClose !== undefined && typeof config.overlay.clickClose !== 'boolean') return false;
  }
  
  // Validar grid
  if (config.grid !== undefined) {
    if (typeof config.grid !== 'object' || config.grid === null) return false;
    if (config.grid.cols !== undefined && typeof config.grid.cols !== 'number') return false;
    if (config.grid.lines !== undefined && typeof config.grid.lines !== 'number') return false;
  }
  
  // Validar behavior
  if (config.behavior !== undefined) {
    if (typeof config.behavior !== 'object' || config.behavior === null) return false;
    if (config.behavior.enterAnimation !== undefined && !isAnimationConfig(config.behavior.enterAnimation)) return false;
    if (config.behavior.exitAnimation !== undefined && !isAnimationConfig(config.behavior.exitAnimation)) return false;
    
    if (config.behavior.hoverAnimation !== undefined) {
      if (typeof config.behavior.hoverAnimation !== 'object' || config.behavior.hoverAnimation === null) return false;
      if (config.behavior.hoverAnimation.scale !== undefined && typeof config.behavior.hoverAnimation.scale !== 'number') return false;
      if (config.behavior.hoverAnimation.opacity !== undefined && typeof config.behavior.hoverAnimation.opacity !== 'number') return false;
    }
    
    if (config.behavior.escClose !== undefined && typeof config.behavior.escClose !== 'boolean') return false;
  }
  
  return true;
}
