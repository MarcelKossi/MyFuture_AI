import React, { createContext, useCallback, useContext, useMemo } from "react";

import { useSecureLocalStorage } from "@/hooks/useSecureLocalStorage";

type AuthContextValue = {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_TOKEN_KEY = "myfuture-auth-token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { value: storedToken, setValue: setStoredToken, removeValue } =
    useSecureLocalStorage<string | null>(AUTH_TOKEN_KEY, null);

  const login = useCallback(
    (nextToken: string) => {
      setStoredToken(nextToken);
    },
    [setStoredToken]
  );

  const logout = useCallback(() => {
    removeValue();
  }, [removeValue]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token: storedToken,
      isAuthenticated: Boolean(storedToken),
      login,
      logout,
    }),
    [storedToken, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
