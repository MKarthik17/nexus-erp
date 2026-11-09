import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Branch } from '@/shared/types';
import { db } from '@/database';

interface BranchContextType {
  branches: Branch[];
  selectedBranchId: string;
  selectedBranch: Branch | null;
  setSelectedBranchId: (id: string) => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  useEffect(() => {
    db.branches.toArray().then((all) => {
      setBranches(all);
    });
  }, []);

  const selectedBranch = selectedBranchId === 'all' ? null : branches.find((b) => b.id === selectedBranchId) || null;

  return (
    <BranchContext.Provider
      value={{
        branches,
        selectedBranchId,
        selectedBranch,
        setSelectedBranchId,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};
