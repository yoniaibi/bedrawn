import './amplify';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </NavigationContainer>
      <StatusBar style="light" backgroundColor="#0D0B14" />
    </SafeAreaProvider>
  );
}
