import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AuthContextValue {
  isDM: boolean;
  login(password: string): boolean;
  logout(): void;
}

const AuthContext = createContext<AuthContextValue>({
  isDM: false,
  login: () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isDM, setIsDM] = useState(() => sessionStorage.getItem('dm_auth') === '1');

  const login = useCallback((password: string): boolean => {
    if (password === import.meta.env.VITE_DM_PASSWORD) {
      sessionStorage.setItem('dm_auth', '1');
      setIsDM(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('dm_auth');
    setIsDM(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isDM, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
