import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  icon?: string;
  action?: ReactNode;
}

export function Card({ title, children, className = '', icon, action }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#111c22] rounded-xl p-6 ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <span className="material-symbols-outlined text-primary">
                {icon}
              </span>
            )}
            {title && (
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </motion.div>
  );
}
