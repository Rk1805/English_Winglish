import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorView, LoadingView, useAsyncData } from '@/components/async-view';
import { ReportButton } from '@/components/report-button';
import { fetchTestQuestions, fetchTests } from '@/lib/content';
import { saveAttempt } from '@/lib/history';
import { useLanguage } from '@/lib/language';
import {
  Question,
  Test,
  loc,
  questionExplanation,
  questionOptions,
  questionText,
} from '@/lib/models';
import { Brand } from '@/lib/theme';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function MockTestScreen() {
  const { gu } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error } = useAsyncData(async () => {
    const [tests, questions] = await Promise.all([fetchTests(), fetchTestQuestions(id)]);
    return { test: tests.find((t) => t.id === id) ?? null, questions };
  }, [id]);

  return (
    <View style={styles.screen}>
      {error ? (
        <>
          <Stack.Screen options={{ title: 'Mock Test' }} />
          <ErrorView message={error} />
        </>
      ) : !data || !data.test ? (
        <>
          <Stack.Screen options={{ title: 'Mock Test' }} />
          <LoadingView />
        </>
      ) : (
        <TestFlow test={data.test} questions={data.questions} gu={gu} />
      )}
    </View>
  );
}

type Phase = 'intro' | 'running' | 'result';

function TestFlow({ test, questions, gu }: { test: Test; questions: Question[]; gu: boolean }) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeUsed, setTimeUsed] = useState(0);
  const title = loc(gu, test.title_en, test.title_gu);

  return (
    <>
      <Stack.Screen options={{ title }} />
      {phase === 'intro' && (
        <Intro test={test} count={questions.length} gu={gu} onStart={() => setPhase('running')} />
      )}
      {phase === 'running' && (
        <Runner
          questions={questions}
          durationMinutes={test.duration_minutes}
          gu={gu}
          onSubmit={(finalAnswers, usedSeconds) => {
            setAnswers(finalAnswers);
            setTimeUsed(usedSeconds);
            setPhase('result');
          }}
        />
      )}
      {phase === 'result' && (
        <TestResult title={title} questions={questions} answers={answers} timeUsed={timeUsed} gu={gu} />
      )}
    </>
  );
}

function Intro({
  test,
  count,
  gu,
  onStart,
}: {
  test: Test;
  count: number;
  gu: boolean;
  onStart: () => void;
}) {
  const rules = gu
    ? [
        `${count} પ્રશ્નો, ${test.duration_minutes} મિનિટ`,
        'સમય પૂરો થતાં ટેસ્ટ આપોઆપ સબમિટ થશે',
        'જવાબ તરત બતાવાશે નહીં — પરિણામ અંતે મળશે',
        'કોઈપણ પ્રશ્ન પર જઈ જવાબ બદલી શકો છો',
        'નંબર ગ્રીડથી સીધા કોઈપણ પ્રશ્ન પર જાઓ',
      ]
    : [
        `${count} questions, ${test.duration_minutes} minutes`,
        'Test auto-submits when time is over',
        'No instant answers — results shown at the end',
        'You can revisit and change any answer',
        'Jump to any question from the number grid',
      ];
  return (
    <ScrollView contentContainerStyle={styles.introContent}>
      <View style={styles.introIcon}>
        <Ionicons name="clipboard" size={40} color={Brand.red} />
      </View>
      <Text style={styles.introTitle}>{loc(gu, test.title_en, test.title_gu)}</Text>
      <View style={styles.rulesCard}>
        <Text style={styles.rulesTitle}>{gu ? 'સૂચનાઓ' : 'Instructions'}</Text>
        {rules.map((rule) => (
          <View key={rule} style={styles.ruleRow}>
            <Ionicons name="checkmark-circle" size={16} color={Brand.green} />
            <Text style={styles.ruleText}>{rule}</Text>
          </View>
        ))}
      </View>
      <Pressable style={styles.startButton} onPress={onStart}>
        <Ionicons name="play" size={18} color="#fff" />
        <Text style={styles.startText}>{gu ? 'ટેસ્ટ શરૂ કરો' : 'Start Test'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Runner({
  questions,
  durationMinutes,
  gu,
  onSubmit,
}: {
  questions: Question[];
  durationMinutes: number;
  gu: boolean;
  onSubmit: (answers: Record<number, number>, usedSeconds: number) => void;
}) {
  const navigation = useNavigation();
  const total = questions.length;
  const totalSeconds = durationMinutes * 60;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [remaining, setRemaining] = useState(totalSeconds);
  const [showPalette, setShowPalette] = useState(false);
  const submittedRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  function submit(auto = false) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (auto) {
      Alert.alert(gu ? 'સમય પૂરો!' : "Time's up!", gu ? 'ટેસ્ટ સબમિટ થઈ ગઈ.' : 'Your test was submitted.');
    }
    onSubmit(answersRef.current, totalSeconds - Math.max(remainingRef.current, 0));
  }

  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => submit(true), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Confirm before leaving a running test.
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (submittedRef.current) return;
      e.preventDefault();
      Alert.alert(
        gu ? 'ટેસ્ટ છોડવી છે?' : 'Leave the test?',
        gu ? 'તમારા જવાબો સેવ થશે નહીં.' : 'Your answers will not be saved.',
        [
          { text: gu ? 'ચાલુ રાખો' : 'Keep going', style: 'cancel' },
          {
            text: gu ? 'છોડી દો' : 'Leave',
            style: 'destructive',
            onPress: () => {
              submittedRef.current = true;
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });
    return unsub;
  }, [navigation, gu]);

  function confirmSubmit() {
    const unanswered = total - Object.keys(answers).length;
    Alert.alert(
      gu ? 'ટેસ્ટ સબમિટ કરવી છે?' : 'Submit the test?',
      unanswered > 0
        ? gu
          ? `${unanswered} પ્રશ્નોના જવાબ બાકી છે.`
          : `${unanswered} questions are still unanswered.`
        : gu
          ? 'બધા પ્રશ્નોના જવાબ અપાઈ ગયા છે.'
          : 'All questions answered.',
      [
        { text: gu ? 'પાછા જાઓ' : 'Go back', style: 'cancel' },
        { text: gu ? 'સબમિટ' : 'Submit', onPress: () => submit(false) },
      ]
    );
  }

  const question = questions[index];
  const options = questionOptions(question, gu);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeCritical = remaining < 60;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.testBar}>
        <View style={[styles.timerChip, timeCritical && { backgroundColor: Brand.red }]}>
          <Ionicons name="time" size={15} color={timeCritical ? '#fff' : Brand.navy} />
          <Text style={[styles.timerText, timeCritical && { color: '#fff' }]}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </Text>
        </View>
        <Text style={styles.testBarCount}>
          {index + 1} / {total}
        </Text>
        <Pressable style={styles.paletteButton} onPress={() => setShowPalette((v) => !v)} hitSlop={6}>
          <Ionicons name="grid" size={18} color={Brand.navy} />
          <Text style={styles.paletteButtonText}>{Object.keys(answers).length}</Text>
        </Pressable>
      </View>

      {showPalette && (
        <View style={styles.paletteGrid}>
          {questions.map((_, i) => {
            const answered = answers[i] !== undefined;
            const current = i === index;
            return (
              <Pressable
                key={i}
                style={[
                  styles.paletteCell,
                  answered && styles.paletteCellAnswered,
                  current && styles.paletteCellCurrent,
                ]}
                onPress={() => {
                  setIndex(i);
                  setShowPalette(false);
                }}>
                <Text
                  style={[
                    styles.paletteCellText,
                    answered && { color: '#fff' },
                    current && !answered && { color: Brand.red },
                  ]}>
                  {i + 1}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <Text style={styles.questionText}>{questionText(question, gu)}</Text>
        <View style={{ gap: 10, marginTop: 16 }}>
          {options.map((option, i) => {
            const selected = answers[index] === i;
            return (
              <Pressable
                key={i}
                onPress={() =>
                  setAnswers((prev) => {
                    const next = { ...prev };
                    if (next[index] === i) delete next[index];
                    else next[index] = i;
                    return next;
                  })
                }
                style={[styles.option, selected && styles.optionSelected]}>
                <View style={[styles.letterCircle, selected && { backgroundColor: Brand.navy }]}>
                  <Text style={[styles.letter, selected && { color: '#fff' }]}>{LETTERS[i]}</Text>
                </View>
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.tapHint}>
          {gu ? 'જવાબ હટાવવા ફરી ટૅપ કરો' : 'Tap again to clear your answer'}
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          style={[styles.navButton, index === 0 && { opacity: 0.35 }]}>
          <Ionicons name="chevron-back" size={18} color={Brand.navy} />
          <Text style={styles.navText}>{gu ? 'પાછળ' : 'Prev'}</Text>
        </Pressable>
        {index === total - 1 ? (
          <Pressable style={styles.submitButton} onPress={confirmSubmit}>
            <Text style={styles.submitText}>{gu ? 'સબમિટ કરો' : 'Submit Test'}</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.submitButtonOutline} onPress={confirmSubmit}>
            <Text style={styles.submitOutlineText}>{gu ? 'સબમિટ' : 'Submit'}</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => setIndex((i) => Math.min(total - 1, i + 1))}
          disabled={index === total - 1}
          style={[styles.navButton, index === total - 1 && { opacity: 0.35 }]}>
          <Text style={styles.navText}>{gu ? 'આગળ' : 'Next'}</Text>
          <Ionicons name="chevron-forward" size={18} color={Brand.navy} />
        </Pressable>
      </View>
    </View>
  );
}

function TestResult({
  title,
  questions,
  answers,
  timeUsed,
  gu,
}: {
  title: string;
  questions: Question[];
  answers: Record<number, number>;
  timeUsed: number;
  gu: boolean;
}) {
  const router = useRouter();
  const total = questions.length;
  const attempted = Object.keys(answers).length;
  const correct = questions.filter((q, i) => answers[i] === q.correct_index).length;
  const wrong = attempted - correct;
  const skipped = total - attempted;
  const accuracy = attempted === 0 ? 0 : Math.round((correct * 100) / attempted);
  const usedMinutes = Math.floor(timeUsed / 60);
  const usedSeconds = timeUsed % 60;

  const saved = useRef(false);
  useEffect(() => {
    if (saved.current) return;
    saved.current = true;
    saveAttempt({
      date: new Date().toISOString(),
      title,
      total,
      correct,
      wrong,
      skipped,
      accuracy,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <View style={styles.resultCard}>
        <Text style={styles.resultScore}>
          {correct} / {total}
        </Text>
        <Text style={styles.resultLabel}>
          {gu ? 'સ્કોર' : 'Score'} · {usedMinutes}:{usedSeconds.toString().padStart(2, '0')}{' '}
          {gu ? 'સમય વપરાયો' : 'time used'}
        </Text>
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
        <Text style={styles.submitText}>{gu ? 'હોમ પર જાઓ' : 'Back to Home'}</Text>
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
  introContent: { padding: 20, alignItems: 'center', gap: 16 },
  introIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F9E4E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  introTitle: { fontSize: 20, fontWeight: '800', color: '#222', textAlign: 'center' },
  rulesCard: {
    backgroundColor: Brand.card,
    borderRadius: 14,
    padding: 16,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: Brand.border,
    gap: 10,
  },
  rulesTitle: { fontWeight: '700', color: Brand.navy, fontSize: 15 },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  ruleText: { flex: 1, color: '#333', lineHeight: 20 },
  startButton: {
    backgroundColor: Brand.red,
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  startText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  testBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Brand.card,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDF0F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  timerText: { fontWeight: '700', color: Brand.navy, fontVariant: ['tabular-nums'] },
  testBarCount: { fontWeight: '700', color: '#222' },
  paletteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDF0F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  paletteButtonText: { fontWeight: '700', color: Brand.navy },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    backgroundColor: Brand.card,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
  },
  paletteCell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDF0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteCellAnswered: { backgroundColor: Brand.green },
  paletteCellCurrent: { borderWidth: 2, borderColor: Brand.red },
  paletteCellText: { fontWeight: '700', color: Brand.navy, fontSize: 13 },
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
  optionSelected: { borderColor: Brand.navy, backgroundColor: '#EEF2F8' },
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
  tapHint: { color: Brand.textMuted, fontSize: 12, marginTop: 12, textAlign: 'center' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: Brand.card,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    gap: 8,
  },
  navButton: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  navText: { color: Brand.navy, fontWeight: '700' },
  submitButton: {
    flex: 1,
    backgroundColor: Brand.red,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonOutline: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Brand.red,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  submitOutlineText: { color: Brand.red, fontWeight: '700', fontSize: 15 },
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
