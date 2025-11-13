import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Customer } from '../services/supabaseClient';

interface CRMContextType {
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const CRMProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <CRMContext.Provider
      value={{
        selectedCustomer,
        setSelectedCustomer,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within CRMProvider');
  }
  return context;
};
