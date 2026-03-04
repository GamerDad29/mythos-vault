import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

const VAULT_CONFIG_URL = 'https://raw.githubusercontent.com/GamerDad29/mythos-vault/main/vault/config.json';

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

interface AuthContextValue {
  isDM: boolean;
  login(password: string): Promise<boolean>;
  logout(): void;
}

const AuthContext = createContext<AuthContextValue>({
  isDM: false,
  login: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isDM, setIsDM] = useState(() => sessionStorage.getItem('dm_auth') === '1');

  const login = useCallback(async (password: string): Promise<boolean> => {
    try {
      const res = await fetch(VAULT_CONFIG_URL);
      if (res.ok) {
        const config = await res.json();
        if (config?.dmPasswordHash) {
          const hash = await sha256(password);
          if (hash !== config.dmPasswordHash) return false;
          sessionStorage.setItem('dm_auth', '1');
          setIsDM(true);
          return true;
        }
      }
    } catch {
      // config.json not available — fall through to env var fallback
    }

    // Fallback: build-time env var (pre-config.json deployments)
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
