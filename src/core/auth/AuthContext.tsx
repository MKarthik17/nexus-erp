import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Role } from '@/shared/types';
import { db } from '@/database';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  loginAsDemoUser: (role: Role) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Restore session or default to super_admin for quick inspection
    const savedUserId = localStorage.getItem('nexus_auth_userId');
    const initUser = async () => {
      if (savedUserId) {
        const found = await db.users.get(savedUserId);
        if (found) {
          setUser(found);
          return;
        }
      }
      // Default to Alexander Wright (super_admin)
      const admin = await db.users.get('user-admin');
      if (admin) {
        setUser(admin);
        localStorage.setItem('nexus_auth_userId', admin.id);
      }
    };
    initUser();
  }, []);

  const loginAsDemoUser = async (role: Role) => {
    const matched = await db.users.where('role').equals(role).first();
    if (matched) {
      setUser(matched);
      localStorage.setItem('nexus_auth_userId', matched.id);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nexus_auth_userId');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return user.permissions.includes(permission as any);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isAuthenticated: !!user,
        loginAsDemoUser,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
