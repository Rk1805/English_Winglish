import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { ErrorView, LoadingView, useAsyncData } from '@/components/async-view';
import { fetchLeaderboard } from '@/lib/content';
import { getDeviceId } from '@/lib/device';
import { useLanguage } from '@/lib/language';
import { Brand } from '@/lib/theme';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const { gu } = useLanguage();
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const { data: scores, error } = useAsyncData(() => fetchLeaderboard(testId), [testId]);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: gu ? 'લીડરબોર્ડ' : 'Leaderboard' }} />
      {error ? (
        <ErrorView message={error} />
      ) : !scores ? (
        <LoadingView />
      ) : scores.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="trophy-outline" size={48} color={Brand.textMuted} />
          <Text style={styles.emptyText}>
            {gu
              ? 'હજી કોઈ સ્કોર નથી.\nપહેલો સ્કોર તમારો બનાવો!'
              : 'No scores yet.\nBe the first on the leaderboard!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={scores}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => {
            const mine = item.device_id === deviceId;
            const minutes = Math.floor(item.duration_seconds / 60);
            const seconds = item.duration_seconds % 60;
            return (
              <View style={[styles.row, mine && styles.rowMine]}>
                <Text style={styles.rank}>
                  {index < 3 ? MEDALS[index] : `${index + 1}`}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                    {mine ? (gu ? ' (તમે)' : ' (you)') : ''}
                  </Text>
                  <Text style={styles.meta}>
                    {item.accuracy}% · {minutes}:{seconds.toString().padStart(2, '0')}
                  </Text>
                </View>
                <Text style={styles.score}>
                  {item.correct}/{item.total}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  list: { padding: 12, gap: 8, paddingBottom: 24 },
  row: {
    backgroundColor: Brand.card,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  rowMine: { borderColor: Brand.red, backgroundColor: '#FDF1F0' },
  rank: { width: 34, fontSize: 16, fontWeight: '800', color: Brand.navy, textAlign: 'center' },
  name: { fontWeight: '700', color: '#222', fontSize: 15 },
  meta: { color: Brand.textMuted, fontSize: 12, marginTop: 2 },
  score: { fontWeight: '800', color: Brand.red, fontSize: 16 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  emptyText: { color: Brand.textMuted, textAlign: 'center', lineHeight: 20 },
});
