import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/lib/language';
import { Brand } from '@/lib/theme';

export type QuizPushSource =
  | 'topic'
  | 'exam'
  | 'exam_topic'
  | 'exam_paper'
  | 'category'
  | 'chapter'
  | 'random';

/** The 10/15/25/Random/Unlimited card list — shared by the topic hub and the chapter resource menu. */
export function PracticeSets({
  heading,
  source,
  id,
  examId,
  title,
}: {
  heading: string;
  source: QuizPushSource;
  id: string;
  examId?: string;
  title: string;
}) {
  const router = useRouter();
  const { gu } = useLanguage();
  const sets: { label: string; count: string; icon: 'help-circle' | 'shuffle' | 'infinite' }[] = [
    { label: gu ? '૧૦ પ્રશ્નો' : '10 Questions', count: '10', icon: 'help-circle' },
    { label: gu ? '૧૫ પ્રશ્નો' : '15 Questions', count: '15', icon: 'help-circle' },
    { label: gu ? '૨૫ પ્રશ્નો' : '25 Questions', count: '25', icon: 'help-circle' },
    { label: gu ? 'રેન્ડમ' : 'Random', count: '20', icon: 'shuffle' },
    { label: gu ? 'અમર્યાદિત પ્રેક્ટિસ' : 'Unlimited Practice', count: 'all', icon: 'infinite' },
  ];

  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.heading}>{heading}</Text>
      {sets.map((set) => (
        <Pressable
          key={set.label}
          style={styles.card}
          onPress={() =>
            router.push({
              pathname: '/quiz',
              params: { source, id, examId: examId ?? '', title, count: set.count },
            })
          }>
          <Ionicons name={set.icon} size={22} color={set.count === 'all' ? Brand.navy : Brand.red} />
          <Text style={styles.cardTitle}>{set.label}</Text>
          <Ionicons name="play-circle" size={30} color={set.count === 'all' ? Brand.navy : Brand.red} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 16, fontWeight: '700', color: '#222', marginTop: 6, marginBottom: 4 },
  card: {
    backgroundColor: Brand.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#222' },
});
