import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { trackActivity } from '@/lib/device';
import { LanguageProvider } from '@/lib/language';
import { Brand } from '@/lib/theme';

const HEARTBEAT_MS = 2 * 60 * 1000;

export default function RootLayout() {
  useEffect(() => {
    trackActivity();
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') trackActivity();
    }, HEARTBEAT_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') trackActivity();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  return (
    <LanguageProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Brand.red },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: Brand.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </LanguageProvider>
  );
}
