import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { BrandHeader } from '@/components/brand-header';
import { AttemptRecord, computeStats, getAttempts } from '@/lib/history';
import { useLanguage } from '@/lib/language';
import { Brand } from '@/lib/theme';

export default function ProgressTab() {
  const { gu } = useLanguage();
  const [attempts, setAttempts] = useState<AttemptRecord[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      getAttempts().then(setAttempts);
    }, [])
  );

  const stats = computeStats(attempts ?? []);

  return (
    <View style={styles.screen}>
      <BrandHeader />
      <FlatList
        data={attempts ?? []}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>{gu ? 'તમારી પ્રગતિ' : 'Your Progress'}</Text>
            <View style={styles.statsRow}>
              <Stat value={`${stats.attempts}`} label={gu ? 'ટેસ્ટ' : 'Tests'} color={Brand.navy} />
              <Stat value={`${stats.questionsSolved}`} label={gu ? 'પ્રશ્નો' : 'Questions'} color={Brand.yellow} />
              <Stat value={`${stats.correct}`} label={gu ? 'સાચા' : 'Correct'} color={Brand.green} />
              <Stat value={`${stats.avgAccuracy}%`} label={gu ? 'ચોકસાઈ' : 'Accuracy'} color={Brand.red} />
            </View>
          </View>
        }
        ListEmptyComponent={
          attempts === null ? null : (
            <View style={styles.emptyBox}>
              <Ionicons name="bar-chart-outline" size={48} color={Brand.textMuted} />
              <Text style={styles.emptyText}>
                {gu
                  ? 'હજી કોઈ ટેસ્ટ આપી નથી.\nપ્રેક્ટિસ શરૂ કરો એટલે અહીં પ્રગતિ દેખાશે.'
                  : 'No tests attempted yet.\nStart practising and your progress will appear here.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const date = new Date(item.date);
          return (
            <View style={styles.attemptCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.attemptTitle}>{item.title}</Text>
                <Text style={styles.attemptDate}>
                  {date.toLocaleDateString('en-IN')}{' '}
                  {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.attemptScore}>
                  {item.correct}/{item.total}
                </Text>
                <Text style={styles.attemptAccuracy}>{item.accuracy}%</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 12, color: Brand.textMuted }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  list: { padding: 12, gap: 8, flexGrow: 1 },
  statsCard: {
    backgroundColor: Brand.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Brand.border,
    marginBottom: 8,
  },
  statsTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  attemptCard: {
    backgroundColor: Brand.card,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Brand.border,
  },
  attemptTitle: { fontWeight: '600', color: '#222' },
  attemptDate: { fontSize: 12, color: Brand.textMuted, marginTop: 2 },
  attemptScore: { fontWeight: '800', color: Brand.navy, fontSize: 16 },
  attemptAccuracy: { fontSize: 12, color: Brand.textMuted },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  emptyText: { color: Brand.textMuted, textAlign: 'center', lineHeight: 20 },
});
