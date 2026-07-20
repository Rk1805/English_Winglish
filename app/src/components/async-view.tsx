import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/lib/theme';

/**
 * Increments every time the screen gains focus (including first mount).
 * Feed it into useAsyncData's deps so tab screens — which expo-router keeps
 * mounted in the background — pick up content added elsewhere (e.g. a new
 * mock test created in the admin panel) instead of showing stale data from
 * whenever they first loaded.
 */
export function useFocusRefreshKey(): number {
  const [key, setKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setKey((k) => k + 1);
    }, [])
  );
  return key;
}

export function useAsyncData<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    load().then(
      (result) => !cancelled && setData(result),
      (err) => !cancelled && setError(String(err?.message ?? err))
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error };
}

export function LoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Brand.red} />
    </View>
  );
}

export function ErrorView({ message }: { message: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.error}>Could not load content.{'\n'}{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: Brand.textMuted, textAlign: 'center' },
});
