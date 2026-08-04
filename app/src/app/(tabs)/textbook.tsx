import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorView, LoadingView, useAsyncData, useFocusRefreshKey } from '@/components/async-view';
import { BrandHeader } from '@/components/brand-header';
import { fetchStandards } from '@/lib/content';
import { useLanguage } from '@/lib/language';
import { EducationLevel } from '@/lib/models';
import { Brand } from '@/lib/theme';

const LEVEL_ORDER: EducationLevel[] = ['higher_secondary', 'secondary', 'upper_primary', 'primary'];

const LEVEL_LABEL: Record<EducationLevel, { en: string; gu: string }> = {
  higher_secondary: { en: 'Higher Secondary', gu: 'ઉચ્ચ માધ્યમિક' },
  secondary: { en: 'Secondary', gu: 'માધ્યમિક' },
  upper_primary: { en: 'Upper Primary', gu: 'ઉચ્ચ પ્રાથમિક' },
  primary: { en: 'Primary', gu: 'પ્રાથમિક' },
};

/** Textbook tab, step 1: pick a Standard (ધોરણ 1-12), grouped by education level. */
export default function TextbookTab() {
  const router = useRouter();
  const { gu } = useLanguage();
  const refreshKey = useFocusRefreshKey();
  const { data, error } = useAsyncData(fetchStandards, [refreshKey]);

  return (
    <View style={styles.screen}>
      <BrandHeader />
      {error ? (
        <ErrorView message={error} />
      ) : !data ? (
        <LoadingView />
      ) : data.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            {gu
              ? 'હજી કોઈ ધોરણ ઉમેરાયું નથી.'
              : 'No standards added yet. Add them from Admin Panel → Standards.'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {LEVEL_ORDER.map((level) => {
            const standards = data.filter((s) => s.education_level === level);
            if (standards.length === 0) return null;
            return (
              <View key={level} style={{ gap: 10 }}>
                <Text style={styles.levelTitle}>{gu ? LEVEL_LABEL[level].gu : LEVEL_LABEL[level].en}</Text>
                <View style={styles.row}>
                  {standards.map((std) => (
                    <Pressable
                      key={std.id}
                      style={styles.box}
                      onPress={() =>
                        router.push({
                          pathname: '/textbook-semester/[standardId]',
                          params: { standardId: std.id, number: String(std.number) },
                        })
                      }>
                      <Text style={styles.boxText}>{std.number}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  content: { padding: 16, gap: 20, paddingBottom: 32 },
  levelTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  box: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: Brand.card,
    borderWidth: 1.5,
    borderColor: Brand.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxText: { fontSize: 22, fontWeight: '800', color: Brand.red },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: Brand.textMuted, textAlign: 'center', lineHeight: 20 },
});
