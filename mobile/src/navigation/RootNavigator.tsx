import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';

type AuthContextType = {
  isAuthed: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  isAuthed: false,
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthed, setIsAuthed] = useState(false);

  const login = useCallback(() => setIsAuthed(true), []);
  const logout = useCallback(() => setIsAuthed(false), []);

  const value = useMemo(() => ({ isAuthed, login, logout }), [isAuthed, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function RootNavigator() {
  const { isAuthed } = useAuth();
  return isAuthed ? <TabNavigator /> : <AuthNavigator />;
}
