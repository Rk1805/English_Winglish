import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorView, LoadingView, useAsyncData } from '@/components/async-view';
import { ReportButton } from '@/components/report-button';
import { fetchQuestionBank, QuizSource } from '@/lib/content';
import { useLanguage } from '@/lib/language';
import { Question, questionExplanation, questionOptions, questionText } from '@/lib/models';
import { Brand } from '@/lib/theme';

const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Question Bank: read-only revision list — every question with its correct
 * answer and explanation shown directly, for reading rather than testing.
 */
export default function QuestionBankScreen() {
  const { gu } = useLanguage();
  const params = useLocalSearchParams<{
    source: 'topic' | 'exam' | 'exam_topic' | 'exam_paper';
    id?: string;
    examId?: string;
    title?: string;
  }>();

  const source: QuizSource =
    params.source === 'topic'
      ? { kind: 'topic', id: params.id ?? '' }
      : params.source === 'exam'
        ? { kind: 'exam', id: params.id ?? '' }
        : params.source === 'exam_topic'
          ? { kind: 'exam_topic', topicId: params.id ?? '', examId: params.examId ?? '' }
          : params.source === 'exam_paper'
            ? { kind: 'exam_paper', paperId: params.id ?? '' }
            : { kind: 'random' };

  const { data: questions, error } = useAsyncData(
    () => fetchQuestionBank(source),
    [params.source, params.id, params.examId]
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{ title: params.title ? `${gu ? 'પ્રશ્ન બેંક' : 'Question Bank'} · ${params.title}` : 'Question Bank' }}
      />
      {error ? (
        <ErrorView message={error} />
      ) : !questions ? (
        <LoadingView />
      ) : questions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="library-outline" size={44} color={Brand.textMuted} />
          <Text style={styles.emptyText}>
            {gu ? 'આ વિભાગમાં હજી પ્રશ્નો ઉમેરાયા નથી.' : 'No questions added in this section yet.'}
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.count}>
            {questions.length} {gu ? 'પ્રશ્નો' : 'questions'}
          </Text>
          {questions.map((question, i) => (
            <QuestionCard key={question.id} index={i} question={question} gu={gu} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

function QuestionCard({ index, question, gu }: { index: number; question: Question; gu: boolean }) {
  const options = questionOptions(question, gu);
  const explanation = questionExplanation(question, gu);
  return (
    <View style={styles.card}>
      <Text style={styles.questionText}>
        {index + 1}. {questionText(question, gu)}
      </Text>
      <View style={{ gap: 8, marginTop: 10 }}>
        {options.map((option, i) => {
          const isCorrect = i === question.correct_index;
          return (
            <View key={i} style={[styles.option, isCorrect && styles.optionCorrect]}>
              <View style={[styles.letterCircle, isCorrect && { backgroundColor: Brand.green }]}>
                <Text style={[styles.letter, isCorrect && { color: '#fff' }]}>{LETTERS[i]}</Text>
              </View>
              <Text style={styles.optionText}>{option}</Text>
              {isCorrect && <Ionicons name="checkmark-circle" size={18} color={Brand.green} />}
            </View>
          );
        })}
      </View>
      {!!explanation && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>{gu ? 'સમજૂતી' : 'Explanation'}</Text>
          <Text style={styles.explanationText}>{explanation}</Text>
        </View>
      )}
      <ReportButton questionId={question.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  content: { padding: 16, gap: 10, paddingBottom: 32 },
  count: { color: Brand.textMuted, fontWeight: '600', marginBottom: 2 },
  card: {
    backgroundColor: Brand.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  questionText: { fontSize: 16, fontWeight: '600', color: '#222', lineHeight: 22 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 10,
  },
  optionCorrect: { backgroundColor: Brand.greenBg, borderColor: Brand.green },
  letterCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EDF0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { fontSize: 12, fontWeight: '700', color: Brand.navy },
  optionText: { flex: 1, fontSize: 14, color: '#222' },
  explanationBox: {
    marginTop: 10,
    backgroundColor: '#FDF3E1',
    borderRadius: 10,
    padding: 12,
  },
  explanationTitle: { fontWeight: '700', color: Brand.navy, marginBottom: 4, fontSize: 13 },
  explanationText: { color: '#333', lineHeight: 19, fontSize: 13 },
  emptyBox: { alignItems: 'center', gap: 10, padding: 24 },
  emptyText: { color: Brand.textMuted, textAlign: 'center', lineHeight: 20 },
});
