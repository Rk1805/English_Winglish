import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { ErrorView, LoadingView, useAsyncData } from '@/components/async-view';
import { fetchNotes } from '@/lib/content';
import { useLanguage } from '@/lib/language';
import { loc } from '@/lib/models';
import { Brand } from '@/lib/theme';

/** Very light markdown rendering: headings and list markers, rest as text. */
function renderLine(line: string, index: number) {
  if (line.startsWith('# ')) {
    return <Text key={index} style={styles.h1}>{line.slice(2)}</Text>;
  }
  if (line.startsWith('## ')) {
    return <Text key={index} style={styles.h2}>{line.slice(3)}</Text>;
  }
  if (line.startsWith('- ') || line.startsWith('* ')) {
    return <Text key={index} style={styles.li}>{'•'} {line.slice(2)}</Text>;
  }
  return <Text key={index} style={styles.p}>{line.replaceAll('**', '')}</Text>;
}

export default function NoteScreen() {
  const { gu } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error } = useAsyncData(async () => {
    const notes = await fetchNotes();
    return { note: notes.find((n) => n.id === id) ?? null };
  }, [id]);

  const note = data?.note;
  return (
    <>
      <Stack.Screen options={{ title: note ? loc(gu, note.title_en, note.title_gu) : 'Note' }} />
      {error ? (
        <ErrorView message={error} />
      ) : !data ? (
        <LoadingView />
      ) : note ? (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
          {note.body_md.split('\n').map(renderLine)}
        </ScrollView>
      ) : (
        <ErrorView message="Note not found." />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  content: { padding: 16, paddingBottom: 40 },
  h1: { fontSize: 22, fontWeight: '800', color: '#222', marginTop: 12, marginBottom: 6 },
  h2: { fontSize: 18, fontWeight: '700', color: Brand.navy, marginTop: 10, marginBottom: 4 },
  li: { fontSize: 15, color: '#333', lineHeight: 24, marginLeft: 8 },
  p: { fontSize: 15, color: '#333', lineHeight: 24 },
});
