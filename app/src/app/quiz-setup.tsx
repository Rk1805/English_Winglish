import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';

import { PracticeSets, QuizPushSource } from '@/components/practice-sets';
import { useLanguage } from '@/lib/language';
import { Brand } from '@/lib/theme';

/**
 * Topic / exam hub: entry points into the Textbook, Videos, the Question
 * Bank (revision list), and the timed/scored practice sets. All of these
 * pull from the same `questions` table used everywhere else — only the
 * Textbook/Chapter section has its own separately-uploaded pool (via
 * questions.chapter_id). The Grammar tab and exam PYQ flows use larger
 * counts (25/50/100/Random) than the Textbook section (10/15/25/Random).
 */
export default function QuizSetupScreen() {
  const router = useRouter();
  const { gu } = useLanguage();
  const { source, id, examId, title } = useLocalSearchParams<{
    source: QuizPushSource;
    id?: string;
    examId?: string;
    title?: string;
  }>();

  const showTextbook = source === 'topic' || source === 'exam_topic';
  const showVideos = source === 'topic' || source === 'exam' || source === 'exam_topic';
  const showQuestionBank = source !== 'random';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: title ?? 'Practice' }} />

      {showTextbook && (
        <Pressable
          style={[styles.entryCard, { backgroundColor: Brand.navy }]}
          onPress={() =>
            router.push({
              pathname: '/textbook-content',
              params: { topicId: id ?? '', examId: examId ?? '', title: title ?? '' },
            })
          }>
          <Ionicons name="book" size={24} color={Brand.yellow} />
          <View style={{ flex: 1 }}>
            <Text style={styles.entryTitle}>{gu ? 'ટેક્સ્ટબુક' : 'Textbook'}</Text>
            <Text style={styles.entrySub}>
              {gu ? 'સારાંશ, મુદ્દા અને વ્યાકરણ' : 'Summary, key points & grammar'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
        </Pressable>
      )}

      {showVideos && (
        <Pressable
          style={[styles.entryCard, { backgroundColor: '#B8541F' }]}
          onPress={() =>
            router.push({
              pathname: '/videos',
              params: {
                topicId: source === 'exam' ? '' : (id ?? ''),
                examId: source === 'exam' ? (id ?? '') : (examId ?? ''),
                title: title ?? '',
              },
            })
          }>
          <Ionicons name="logo-youtube" size={24} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.entryTitle}>{gu ? 'વિડિયો' : 'Videos'}</Text>
            <Text style={styles.entrySub}>{gu ? 'સમજૂતી વિડિયો જુઓ' : 'Watch explanation videos'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
        </Pressable>
      )}

      {showQuestionBank && (
        <Pressable
          style={[styles.entryCard, { backgroundColor: '#3A3F4B' }]}
          onPress={() =>
            router.push({
              pathname: '/question-bank',
              params: { source, id: id ?? '', examId: examId ?? '', title: title ?? '' },
            })
          }>
          <Ionicons name="library" size={24} color={Brand.yellow} />
          <View style={{ flex: 1 }}>
            <Text style={styles.entryTitle}>{gu ? 'પ્રશ્ન બેંક' : 'Question Bank'}</Text>
            <Text style={styles.entrySub}>
              {gu ? 'બધા પ્રશ્નો જવાબ સાથે વાંચો' : 'Browse every question with its answer'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
        </Pressable>
      )}

      {source === 'topic' ? (
        <PracticeSets
          heading={gu ? 'વ્યાકરણ MCQs' : 'Grammar MCQs'}
          source="random"
          id=""
          title={gu ? 'વ્યાકરણ' : 'Grammar'}
          variant="large"
        />
      ) : source === 'exam' || source === 'exam_topic' || source === 'exam_paper' ? (
        <PracticeSets
          heading={gu ? 'પ્રેક્ટિસ સેટ પસંદ કરો' : 'Choose a practice set'}
          source={source}
          id={id ?? ''}
          examId={examId}
          title={title ?? ''}
          variant="large"
        />
      ) : (
        <PracticeSets
          heading={gu ? 'પ્રેક્ટિસ સેટ પસંદ કરો' : 'Choose a practice set'}
          source={source}
          id={id ?? ''}
          examId={examId}
          title={title ?? ''}
        />
      )}

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={16} color={Brand.textMuted} />
        <Text style={styles.noteText}>
          {gu
            ? 'ઓછા પ્રશ્નો ઉપલબ્ધ હોય તો બધા ઉપલબ્ધ પ્રશ્નો આવશે.'
            : 'If fewer questions are available, all available questions are used.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  content: { padding: 16, gap: 10, paddingBottom: 32 },
  entryCard: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  entryTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  entrySub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingHorizontal: 4 },
  noteText: { color: Brand.textMuted, fontSize: 12, flex: 1 },
});
