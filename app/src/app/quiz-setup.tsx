import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAsyncData } from '@/components/async-view';
import { MaterialSections } from '@/components/material-sections';
import { fetchNotes, fetchPdfs, fetchVideos, MaterialFilter } from '@/lib/content';
import { useLanguage } from '@/lib/language';
import { Brand } from '@/lib/theme';

/**
 * Topic / exam hub: study material for the topic (videos, PDFs, notes)
 * followed by the practice sets.
 */
export default function QuizSetupScreen() {
  const router = useRouter();
  const { gu } = useLanguage();
  const { source, id, title } = useLocalSearchParams<{
    source: 'topic' | 'exam' | 'random';
    id?: string;
    title?: string;
  }>();

  const filter: MaterialFilter | null =
    source === 'topic' && id ? { topicId: id } : source === 'exam' && id ? { examId: id } : null;

  const { data: material } = useAsyncData(async () => {
    if (!filter) return { videos: [], pdfs: [], notes: [] };
    const [videos, pdfs, notes] = await Promise.all([
      fetchVideos(filter),
      fetchPdfs(filter),
      fetchNotes(filter),
    ]);
    return { videos, pdfs, notes };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, id]);

  const hasMaterial =
    !!material && (material.videos.length > 0 || material.pdfs.length > 0 || material.notes.length > 0);

  const sets: { label: string; count: string; icon: 'help-circle' | 'shuffle' | 'infinite' }[] = [
    { label: gu ? '૫૦ પ્રશ્નો' : '50 MCQs', count: '50', icon: 'help-circle' },
    { label: gu ? '૧૦૦ પ્રશ્નો' : '100 MCQs', count: '100', icon: 'help-circle' },
    { label: gu ? '૨૦૦ પ્રશ્નો' : '200 MCQs', count: '200', icon: 'help-circle' },
    { label: gu ? 'રેન્ડમ (૨૦)' : 'Random (20)', count: '20', icon: 'shuffle' },
    { label: gu ? 'અમર્યાદિત પ્રેક્ટિસ' : 'Unlimited Practice', count: 'all', icon: 'infinite' },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: title ?? 'Practice' }} />

      {hasMaterial && (
        <>
          <Text style={styles.heading}>
            {gu ? `શીખો — ${title ?? ''}` : `Learn — ${title ?? ''}`}
          </Text>
          <MaterialSections videos={material.videos} pdfs={material.pdfs} notes={material.notes} />
          <View style={styles.divider} />
        </>
      )}

      <Text style={styles.heading}>{gu ? 'પ્રેક્ટિસ સેટ પસંદ કરો' : 'Choose a practice set'}</Text>
      {sets.map((set) => (
        <Pressable
          key={set.label}
          style={styles.card}
          onPress={() =>
            router.push({
              pathname: '/quiz',
              params: { source, id: id ?? '', title: title ?? '', count: set.count },
            })
          }>
          <Ionicons name={set.icon} size={22} color={set.count === 'all' ? Brand.navy : Brand.red} />
          <Text style={styles.cardTitle}>{set.label}</Text>
          <Ionicons
            name="play-circle"
            size={30}
            color={set.count === 'all' ? Brand.navy : Brand.red}
          />
        </Pressable>
      ))}
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
  heading: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 4 },
  divider: { height: 1, backgroundColor: Brand.border, marginVertical: 10 },
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
  note: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingHorizontal: 4 },
  noteText: { color: Brand.textMuted, fontSize: 12, flex: 1 },
});
