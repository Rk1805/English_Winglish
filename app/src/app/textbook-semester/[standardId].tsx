import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorView, LoadingView, useAsyncData } from '@/components/async-view';
import { fetchChapters } from '@/lib/content';
import { useLanguage } from '@/lib/language';
import { loc } from '@/lib/models';
import { Brand } from '@/lib/theme';

/** Textbook tab, step 2+3: Sem-I / Sem-II tabs, then the numbered chapter list. */
export default function TextbookSemesterScreen() {
  const router = useRouter();
  const { gu } = useLanguage();
  const { standardId, number } = useLocalSearchParams<{ standardId: string; number?: string }>();
  const { data: chapters, error } = useAsyncData(() => fetchChapters(standardId), [standardId]);
  const [semester, setSemester] = useState<'sem1' | 'sem2'>('sem1');

  const visible = useMemo(
    () => (chapters ?? []).filter((c) => c.semester === semester),
    [chapters, semester]
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: number ? `${gu ? 'ધોરણ' : 'Std'} ${number}` : 'Standard' }} />
      {error ? (
        <ErrorView message={error} />
      ) : !chapters ? (
        <LoadingView />
      ) : (
        <>
          <View style={styles.semTabs}>
            {(['sem1', 'sem2'] as const).map((sem) => (
              <Pressable
                key={sem}
                style={[styles.semTab, semester === sem && styles.semTabActive]}
                onPress={() => setSemester(sem)}>
                <Text style={[styles.semTabText, semester === sem && styles.semTabTextActive]}>
                  {sem === 'sem1' ? (gu ? 'સેમ - I' : 'Sem - I') : gu ? 'સેમ - II' : 'Sem - II'}
                </Text>
              </Pressable>
            ))}
          </View>
          <FlatList
            data={visible}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  {gu ? 'આ સેમેસ્ટરમાં હજી પ્રકરણ ઉમેરાયા નથી.' : 'No chapters added for this semester yet.'}
                </Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <Pressable
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: '/chapter/[chapterId]',
                    params: { chapterId: item.id, title: loc(gu, item.name_en, item.name_gu) },
                  })
                }>
                <View style={styles.numberCircle}>
                  <Text style={styles.number}>{index + 1}</Text>
                </View>
                <Text style={styles.cardTitle}>{loc(gu, item.name_en, item.name_gu)}</Text>
                <Ionicons name="chevron-forward" size={20} color={Brand.textMuted} />
              </Pressable>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  semTabs: {
    flexDirection: 'row',
    backgroundColor: Brand.card,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
  },
  semTab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  semTabActive: { borderBottomWidth: 3, borderBottomColor: Brand.red },
  semTabText: { fontWeight: '600', color: Brand.textMuted },
  semTabTextActive: { color: Brand.red },
  list: { padding: 12, gap: 8 },
  card: {
    backgroundColor: Brand.card,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  numberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9E4E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { color: Brand.red, fontWeight: '700' },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#222' },
  emptyBox: { alignItems: 'center', padding: 24 },
  emptyText: { color: Brand.textMuted, textAlign: 'center', lineHeight: 20 },
});
