import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  authMode: 'login' | 'register';
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('phishguard_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await authApi.getMe();
          setUser(res.data.user);
        } catch {
          localStorage.removeItem('phishguard_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (email: string, pass: string) => {
    const res = await authApi.login({ email, password: pass });
    localStorage.setItem('phishguard_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    setIsAuthModalOpen(false);
  };

  const register = async (name: string, email: string, pass: string) => {
    const res = await authApi.register({ full_name: name, email, password: pass });
    localStorage.setItem('phishguard_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    localStorage.removeItem('phishguard_token');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authMode,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
