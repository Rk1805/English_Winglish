import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorView, LoadingView, useAsyncData } from '@/components/async-view';
import { fetchExamTopics } from '@/lib/content';
import { useLanguage } from '@/lib/language';
import { loc } from '@/lib/models';
import { Brand } from '@/lib/theme';

/** Exam hub: all-PYQ practice plus the topics the admin assigned to this exam. */
export default function ExamScreen() {
  const router = useRouter();
  const { gu } = useLanguage();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const { data: topics, error } = useAsyncData(() => fetchExamTopics(id), [id]);
  const examTitle = title ?? 'Exam';

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: examTitle }} />
      {error ? (
        <ErrorView message={error} />
      ) : !topics ? (
        <LoadingView />
      ) : (
        <FlatList
          data={topics}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <Pressable
                style={styles.allCard}
                onPress={() =>
                  router.push({
                    pathname: '/quiz-setup',
                    params: { source: 'exam', id, title: examTitle },
                  })
                }>
                <Ionicons name="documents" size={26} color={Brand.yellow} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.allTitle}>
                    {gu ? 'બધા પ્રશ્નો (PYQ)' : 'All Questions (PYQ)'}
                  </Text>
                  <Text style={styles.allSub}>
                    {gu
                      ? `${examTitle} ના બધા પાછલા વર્ષોના પ્રશ્નો`
                      : `All previous year questions of ${examTitle}`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
              </Pressable>
              {topics.length > 0 && (
                <Text style={styles.sectionTitle}>{gu ? 'વિષય પ્રમાણે' : 'By Topic'}</Text>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {gu
                  ? 'આ પરીક્ષા માટે હજી વિષયો ઉમેરાયા નથી.\nએડમિન પેનલ → Exams → Topics માંથી ઉમેરો.'
                  : 'No topics assigned to this exam yet.\nAssign them from Admin Panel → Exams → Topics.'}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/quiz-setup',
                  params: {
                    source: 'exam_topic',
                    id: item.id,
                    examId: id,
                    title: `${loc(gu, item.name_en, item.name_gu)} · ${examTitle}`,
                  },
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  list: { padding: 12, gap: 8, paddingBottom: 24 },
  allCard: {
    backgroundColor: Brand.navy,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  allTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  allSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginVertical: 8 },
  card: {
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
