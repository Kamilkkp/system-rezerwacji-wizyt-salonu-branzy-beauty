'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, accountAPI } from '@/lib/api';
import { AccountDto, Tokens, LoginDto } from '@/types';

interface AuthContextType {
  user: AccountDto | null;
  tokens: Tokens | null;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AccountDto | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTokens = localStorage.getItem('tokens');
      if (storedTokens) {
        try {
          const parsedTokens = JSON.parse(storedTokens);
          setTokens(parsedTokens);
          loadUser(parsedTokens);
        } catch (error) {
          console.error('Failed to parse stored tokens:', error);
          localStorage.removeItem('tokens');
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async (userTokens: Tokens) => {
    try {
      const response = await accountAPI.getAccount();
      setUser(response.data);
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/bms/')) {
        setTimeout(() => {
          router.push('/bms/reservations');
        }, 0);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('tokens');
      setTokens(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginDto) => {
    try {
      const response = await authAPI.login(credentials);
      const userTokens = response.data;
      setTokens(userTokens);
      localStorage.setItem('tokens', JSON.stringify(userTokens));
      await loadUser(userTokens);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('tokens');
    router.push('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ user, tokens, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}