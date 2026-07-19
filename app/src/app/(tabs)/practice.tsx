import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorView, LoadingView, useAsyncData } from '@/components/async-view';
import { BrandHeader } from '@/components/brand-header';
import { fetchTests } from '@/lib/content';
import { useLanguage } from '@/lib/language';
import { loc } from '@/lib/models';
import { Brand } from '@/lib/theme';

export default function PracticeTab() {
  const router = useRouter();
  const { gu } = useLanguage();
  const { data: tests, error } = useAsyncData(fetchTests);

  return (
    <View style={styles.screen}>
      <BrandHeader />
      {error ? (
        <ErrorView message={error} />
      ) : !tests ? (
        <LoadingView />
      ) : (
        <FlatList
          data={tests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <Pressable
                style={styles.randomCard}
                onPress={() =>
                  router.push({
                    pathname: '/quiz-setup',
                    params: { source: 'random', title: gu ? 'રેન્ડમ પ્રેક્ટિસ' : 'Random Practice' },
                  })
                }>
                <Ionicons name="flash" size={28} color={Brand.yellow} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.randomTitle}>{gu ? 'રેન્ડમ પ્રેક્ટિસ' : 'Random Practice'}</Text>
                  <Text style={styles.randomSub}>
                    {gu ? 'બધા વિષયોમાંથી પ્રશ્નો, તરત જવાબ' : 'Questions from all topics, instant answers'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
              </Pressable>
              <Text style={styles.sectionTitle}>{gu ? 'મોક ટેસ્ટ' : 'Mock Tests'}</Text>
              {tests.length === 0 && (
                <View style={styles.emptyBox}>
                  <Ionicons name="clipboard-outline" size={40} color={Brand.textMuted} />
                  <Text style={styles.emptyText}>
                    {gu
                      ? 'હજી કોઈ મોક ટેસ્ટ ઉમેરાઈ નથી.\nએડમિન પેનલ → Mock Tests માંથી બનાવો.'
                      : 'No mock tests added yet.\nCreate them from Admin Panel → Mock Tests.'}
                  </Text>
                </View>
              )}
            </>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.testCard}
              onPress={() => {
                if (item.is_premium) {
                  Alert.alert(
                    gu ? 'પ્રીમિયમ ટેસ્ટ' : 'Premium Test',
                    gu
                      ? 'આ ટેસ્ટ પ્રીમિયમ સભ્યો માટે છે. ટૂંક સમયમાં આવી રહ્યું છે!'
                      : 'This test is for premium members. Coming soon!'
                  );
                  return;
                }
                if (item.question_count === 0) {
                  Alert.alert(
                    gu ? 'ટેસ્ટ ખાલી છે' : 'Test is empty',
                    gu
                      ? 'એડમિન પેનલમાંથી આ ટેસ્ટમાં પ્રશ્નો ઉમેરો.'
                      : 'Add questions to this test from the admin panel.'
                  );
                  return;
                }
                router.push({ pathname: '/mock-test/[id]', params: { id: item.id } });
              }}>
              <View style={styles.testIcon}>
                <Ionicons
                  name={item.is_premium ? 'lock-closed' : 'clipboard'}
                  size={20}
                  color={item.is_premium ? Brand.yellow : Brand.navy}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.testTitle}>{loc(gu, item.title_en, item.title_gu)}</Text>
                <Text style={styles.testMeta}>
                  {item.question_count} {gu ? 'પ્રશ્નો' : 'questions'} · {item.duration_minutes}{' '}
                  {gu ? 'મિનિટ' : 'min'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Brand.textMuted} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  list: { padding: 12, gap: 8, paddingBottom: 24 },
  randomCard: {
    backgroundColor: Brand.navy,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  randomTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  randomSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginVertical: 8 },
  testCard: {
    backgroundColor: Brand.card,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Brand.border,
    marginBottom: 8,
  },
  testIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDF0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testTitle: { fontWeight: '600', color: '#222', fontSize: 15 },
  testMeta: { color: Brand.textMuted, fontSize: 12, marginTop: 2 },
  emptyBox: { alignItems: 'center', gap: 10, padding: 24 },
  emptyText: { color: Brand.textMuted, textAlign: 'center', lineHeight: 20 },
});
