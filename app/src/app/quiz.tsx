import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorView, LoadingView, useAsyncData } from '@/components/async-view';
import { ReportButton } from '@/components/report-button';
import { fetchQuestions, QuizSource } from '@/lib/content';
import { saveAttempt } from '@/lib/history';
import { useLanguage } from '@/lib/language';
import { playCorrectSound, playWrongSound } from '@/lib/sounds';
import {
  Question,
  questionExplanation,
  questionOptions,
  questionText,
} from '@/lib/models';
import { Brand } from '@/lib/theme';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizScreen() {
  const { gu } = useLanguage();
  const params = useLocalSearchParams<{
    source: 'topic' | 'exam' | 'exam_topic' | 'random';
    id?: string;
    examId?: string;
    title?: string;
    count?: string;
  }>();

  const source: QuizSource = useMemo(() => {
    if (params.source === 'topic') return { kind: 'topic', id: params.id ?? '' };
    if (params.source === 'exam') return { kind: 'exam', id: params.id ?? '' };
    if (params.source === 'exam_topic')
      return { kind: 'exam_topic', topicId: params.id ?? '', examId: params.examId ?? '' };
    return { kind: 'random' };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.source, params.id, params.examId]);

  const limit = params.count === 'all' ? undefined : Number(params.count ?? 20);
  const { data: questions, error } = useAsyncData(
    () => fetchQuestions(source, limit),
    [params.source, params.id, params.examId, params.count]
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: params.title ?? 'Quiz' }} />
      {error ? (
        <ErrorView message={error} />
      ) : !questions ? (
        <LoadingView />
      ) : questions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="file-tray-outline" size={48} color={Brand.textMuted} />
          <Text style={styles.emptyText}>
            {gu ? 'આ વિભાગમાં હજી પ્રશ્નો ઉમેરાયા નથી.' : 'No questions added in this section yet.'}
          </Text>
        </View>
      ) : (
        <Quiz questions={questions} gu={gu} />
      )}
    </View>
  );
}

function Quiz({ questions, gu }: { questions: Question[]; gu: boolean }) {
  const insets = useSafeAreaInsets();
  const { title } = useLocalSearchParams<{ title?: string }>();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!finished) return;
    const attempted = Object.keys(answers).length;
    const correct = questions.filter((q, i) => answers[i] === q.correct_index).length;
    saveAttempt({
      date: new Date().toISOString(),
      title: title || 'Practice',
      total: questions.length,
      correct,
      wrong: attempted - correct,
      skipped: questions.length - attempted,
      accuracy: attempted === 0 ? 0 : Math.round((correct * 100) / attempted),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (finished) return <Result questions={questions} answers={answers} gu={gu} />;

  const question = questions[index];
  const selected = answers[index];
  const answered = selected !== undefined;
  const options = questionOptions(question, gu);
  const explanation = questionExplanation(question, gu);
  const isLast = index === questions.length - 1;

  const next = () => (isLast ? setFinished(true) : setIndex(index + 1));

  return (
    <>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((index + 1) / questions.length) * 100}%` }]} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <Text style={styles.counter}>
          {index + 1} / {questions.length}
        </Text>
        <Text style={styles.questionText}>{questionText(question, gu)}</Text>
        <View style={{ gap: 10, marginTop: 16 }}>
          {options.map((option, i) => {
            const isCorrect = answered && i === question.correct_index;
            const isWrong = answered && i === selected && i !== question.correct_index;
            return (
              <Pressable
                key={i}
                disabled={answered}
                onPress={() => {
                  (i === question.correct_index ? playCorrectSound : playWrongSound)();
                  setAnswers((a) => ({ ...a, [index]: i }));
                }}
                style={[
                  styles.option,
                  isCorrect && { backgroundColor: Brand.greenBg, borderColor: Brand.green },
                  isWrong && { backgroundColor: Brand.redWrongBg, borderColor: Brand.red },
                ]}>
                <View style={styles.letterCircle}>
                  <Text style={styles.letter}>{LETTERS[i]}</Text>
                </View>
                <Text style={styles.optionText}>{option}</Text>
                {isCorrect && <Ionicons name="checkmark-circle" size={22} color={Brand.green} />}
                {isWrong && <Ionicons name="close-circle" size={22} color={Brand.red} />}
              </Pressable>
            );
          })}
        </View>
        {answered && !!explanation && (
          <View style={styles.explanationBox}>
            <Text style={styles.explanationTitle}>{gu ? 'સમજૂતી' : 'Explanation'}</Text>
            <Text style={styles.explanationText}>{explanation}</Text>
          </View>
        )}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        {!answered ? (
          <Pressable onPress={next} hitSlop={8}>
            <Text style={styles.skip}>{gu ? 'છોડો' : 'Skip'}</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable
          onPress={next}
          disabled={!answered}
          style={[styles.nextButton, !answered && { opacity: 0.4 }]}>
          <Text style={styles.nextText}>
            {isLast ? (gu ? 'પરિણામ જુઓ' : 'See Result') : gu ? 'આગળ' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </>
  );
}

function Result({
  questions,
  answers,
  gu,
}: {
  questions: Question[];
  answers: Record<number, number>;
  gu: boolean;
}) {
  const router = useRouter();
  const total = questions.length;
  const attempted = Object.keys(answers).length;
  const correct = questions.filter((q, i) => answers[i] === q.correct_index).length;
  const wrong = attempted - correct;
  const skipped = total - attempted;
  const accuracy = attempted === 0 ? 0 : Math.round((correct * 100) / attempted);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <View style={styles.resultCard}>
        <Text style={styles.resultScore}>
          {correct} / {total}
        </Text>
        <Text style={styles.resultLabel}>{gu ? 'સાચા જવાબ' : 'Correct answers'}</Text>
        <View style={styles.statsRow}>
          <Stat label={gu ? 'સાચા' : 'Correct'} value={`${correct}`} color={Brand.green} />
          <Stat label={gu ? 'ખોટા' : 'Wrong'} value={`${wrong}`} color={Brand.red} />
          <Stat label={gu ? 'છોડેલા' : 'Skipped'} value={`${skipped}`} color={Brand.textMuted} />
          <Stat label={gu ? 'ચોકસાઈ' : 'Accuracy'} value={`${accuracy}%`} color={Brand.navy} />
        </View>
      </View>

      <Text style={styles.reviewHeading}>{gu ? 'જવાબોની સમીક્ષા' : 'Review answers'}</Text>
      {questions.map((question, i) => {
        const selected = answers[i];
        const isCorrect = selected === question.correct_index;
        const options = questionOptions(question, gu);
        const explanation = questionExplanation(question, gu);
        return (
          <View key={question.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Ionicons
                name={
                  selected === undefined
                    ? 'remove-circle-outline'
                    : isCorrect
                      ? 'checkmark-circle'
                      : 'close-circle'
                }
                size={20}
                color={selected === undefined ? Brand.textMuted : isCorrect ? Brand.green : Brand.red}
              />
              <Text style={styles.reviewQuestion}>
                {i + 1}. {questionText(question, gu)}
              </Text>
            </View>
            <Text style={styles.reviewAnswer}>
              {gu ? 'સાચો જવાબ' : 'Correct answer'}: {options[question.correct_index]}
            </Text>
            {selected !== undefined && !isCorrect && (
              <Text style={[styles.reviewAnswer, { color: Brand.red }]}>
                {gu ? 'તમારો જવાબ' : 'Your answer'}: {options[selected]}
              </Text>
            )}
            {!!explanation && <Text style={styles.reviewExplanation}>{explanation}</Text>}
            <View style={{ marginLeft: 28 }}>
              <ReportButton questionId={question.id} />
            </View>
          </View>
        );
      })}

      <Pressable style={styles.homeButton} onPress={() => router.dismissAll()}>
        <Text style={styles.nextText}>{gu ? 'હોમ પર જાઓ' : 'Back to Home'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color }}>{value}</Text>
      <Text style={{ fontSize: 12, color: Brand.textMuted }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  content: { padding: 16, paddingBottom: 32 },
  progressTrack: { height: 4, backgroundColor: Brand.border },
  progressFill: { height: 4, backgroundColor: Brand.yellow },
  counter: { color: Brand.textMuted, fontWeight: '600', marginBottom: 8 },
  questionText: { fontSize: 18, fontWeight: '600', color: '#222', lineHeight: 26 },
  option: {
    backgroundColor: Brand.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Brand.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  letterCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDF0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { fontSize: 13, fontWeight: '700', color: Brand.navy },
  optionText: { flex: 1, fontSize: 15, color: '#222' },
  explanationBox: {
    marginTop: 16,
    backgroundColor: '#FDF3E1',
    borderRadius: 12,
    padding: 14,
  },
  explanationTitle: { fontWeight: '700', color: Brand.navy, marginBottom: 4 },
  explanationText: { color: '#333', lineHeight: 20 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Brand.card,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
  skip: { color: Brand.textMuted, fontWeight: '600', fontSize: 15 },
  nextButton: {
    backgroundColor: Brand.red,
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  nextText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  emptyText: { color: Brand.textMuted, textAlign: 'center', fontSize: 15 },
  resultCard: {
    backgroundColor: Brand.card,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Brand.border,
  },
  resultScore: { fontSize: 40, fontWeight: '800', color: Brand.red },
  resultLabel: { color: Brand.textMuted, marginBottom: 14 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignSelf: 'stretch',
    marginTop: 6,
  },
  reviewHeading: { fontSize: 16, fontWeight: '700', color: '#222', marginVertical: 14 },
  reviewCard: {
    backgroundColor: Brand.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Brand.border,
    gap: 4,
  },
  reviewHeader: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  reviewQuestion: { flex: 1, fontWeight: '600', color: '#222' },
  reviewAnswer: { color: '#333', marginLeft: 28 },
  reviewExplanation: { color: Brand.textMuted, marginLeft: 28, marginTop: 2 },
  homeButton: {
    backgroundColor: Brand.red,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
});
