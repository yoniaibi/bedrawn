import { fetchAuthSession, signOut } from 'aws-amplify/auth';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { C } from '../theme/colors';
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
  const [checking, setChecking] = useState(true);

  // Restore session on app launch
  useEffect(() => {
    fetchAuthSession()
      .then(session => {
        if (session.tokens?.accessToken) setIsAuthed(true);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const login = useCallback(() => setIsAuthed(true), []);
  const logout = useCallback(() => {
    signOut().catch(() => {});
    setIsAuthed(false);
  }, []);

  const value = useMemo(() => ({ isAuthed, login, logout }), [isAuthed, login, logout]);

  if (checking) {
    return (
      <View style={{ flex: 1, backgroundColor: C.BG, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.PURPLE} />
      </View>
    );
  }

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
