import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorView, LoadingView, useAsyncData } from '@/components/async-view';
import { MaterialSections, NoteRow, Section } from '@/components/material-sections';
import { fetchNotes, fetchPdfs, fetchVideos } from '@/lib/content';
import { useLanguage } from '@/lib/language';
import { Brand } from '@/lib/theme';

/**
 * Textbook page for one topic: Summary, Important Points, and a general
 * Grammar section (that topic's videos/PDFs/notes), ending with a
 * "Grammar MCQs" button into the usual practice-set picker.
 */
export default function TextbookScreen() {
  const router = useRouter();
  const { gu } = useLanguage();
  const { topicId, examId, title } = useLocalSearchParams<{
    topicId: string;
    examId?: string;
    title?: string;
  }>();

  const { data, error } = useAsyncData(async () => {
    const [notes, videos, pdfs] = await Promise.all([
      fetchNotes({ topicId }),
      fetchVideos({ topicId }),
      fetchPdfs({ topicId }),
    ]);
    return {
      summary: notes.filter((n) => n.section === 'summary'),
      important: notes.filter((n) => n.section === 'important_points'),
      general: notes.filter((n) => !n.section),
      videos,
      pdfs,
    };
  }, [topicId]);

  const empty =
    !!data &&
    data.summary.length === 0 &&
    data.important.length === 0 &&
    data.general.length === 0 &&
    data.videos.length === 0 &&
    data.pdfs.length === 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: title ? `${gu ? 'ટેક્સ્ટબુક' : 'Textbook'} · ${title}` : 'Textbook' }} />
      {error ? (
        <ErrorView message={error} />
      ) : !data ? (
        <LoadingView />
      ) : (
        <>
          {empty && (
            <View style={styles.emptyBox}>
              <Ionicons name="book-outline" size={44} color={Brand.textMuted} />
              <Text style={styles.emptyText}>
                {gu
                  ? 'આ વિષય માટે હજી ટેક્સ્ટબુક સામગ્રી ઉમેરાઈ નથી.'
                  : 'No textbook content added for this topic yet.'}
              </Text>
            </View>
          )}
          {data.summary.length > 0 && (
            <Section title={gu ? 'સારાંશ' : 'Summary'}>
              {data.summary.map((note) => (
                <NoteRow key={note.id} note={note} />
              ))}
            </Section>
          )}
          {data.important.length > 0 && (
            <Section title={gu ? 'મહત્વના મુદ્દા' : 'Important Points'}>
              {data.important.map((note) => (
                <NoteRow key={note.id} note={note} />
              ))}
            </Section>
          )}
          {(data.videos.length > 0 || data.pdfs.length > 0 || data.general.length > 0) && (
            <Section title={gu ? 'વ્યાકરણ' : 'Grammar'}>
              <MaterialSections videos={data.videos} pdfs={data.pdfs} notes={data.general} />
            </Section>
          )}

          <Pressable
            style={styles.mcqButton}
            onPress={() =>
              router.push({
                pathname: '/quiz-setup',
                params: {
                  source: examId ? 'exam_topic' : 'topic',
                  id: topicId,
                  examId: examId ?? '',
                  title: title ?? '',
                },
              })
            }>
            <Ionicons name="help-circle" size={22} color="#fff" />
            <Text style={styles.mcqButtonText}>{gu ? 'વ્યાકરણ MCQs' : 'Grammar MCQs'}</Text>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  emptyBox: { alignItems: 'center', gap: 10, padding: 24 },
  emptyText: { color: Brand.textMuted, textAlign: 'center', lineHeight: 20 },
  mcqButton: {
    backgroundColor: Brand.red,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  mcqButtonText: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 16 },
});
