export interface ModalConfig {
  bg?: {
    color?: string;
    gradient?: string;
  };
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
  size?: {
    width?: string;
    height?: string;
    mdWidth?: string;
    mdHeight?: string;
    maxWidth?: string;
    maxHeight?: string;
  };
  overlay?: {
    color?: string;
    opacity?: number;
    blur?: string;
    visible?: boolean;
    clickClose?: boolean;
  };
  grid?: {
    cols?: number;
    lines?: number;
  };
  behavior?: {
    enterAnimation?: {
      start?: { scale?: number; opacity?: number; blur?: string };
      finish?: { scale?: number; opacity?: number; blur?: string; time?: number };
    };
    exitAnimation?: {
      start?: { scale?: number; opacity?: number; blur?: string };
      finish?: { scale?: number; opacity?: number; blur?: string; time?: number };
    };
    hoverAnimation?: {
      scale?: number;
      opacity?: number;
    };
    escClose?: boolean;
  };
}

export const whatsAppModalConfig: ModalConfig = {
  bg: {
    color: 'bg-white/95 dark:bg-slate-900/95',
  },
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
  size: {
    width: 'w-screen',
    height: 'h-screen',
    mdWidth: 'md:w-[70%]',
    mdHeight: 'md:h-[80%]',
    maxWidth: 'max-w-2xl',
    maxHeight: 'max-h-[90vh]',
  },
  overlay: {
    color: 'bg-black/50',
    opacity: 1,
    blur: 'backdrop-blur-md',
    visible: true,
    clickClose: true,
  },
  grid: {
    cols: 1,
    lines: 1,
  },
  behavior: {
    enterAnimation: {
      start: { scale: 0.9, opacity: 0 },
      finish: { scale: 1, opacity: 1, time: 300 },
    },
    exitAnimation: {
      start: { scale: 1, opacity: 1 },
      finish: { scale: 0.9, opacity: 0, time: 200 },
    },
    hoverAnimation: {
      scale: 1,
      opacity: 1,
    },
    escClose: true,
  },
};
