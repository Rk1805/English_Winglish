import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorView, LoadingView, useAsyncData } from '@/components/async-view';
import { PracticeSets } from '@/components/practice-sets';
import { fetchChapter, pdfPublicUrl } from '@/lib/content';
import { useLanguage } from '@/lib/language';
import { loc } from '@/lib/models';
import { Brand } from '@/lib/theme';

/**
 * Chapter resource menu (Textbook tab, step 4): Textbook opens the
 * chapter's PDF directly, Videos opens the chapter's tagged videos, and
 * MCQs is a single Unit Test — only this chapter's own tagged questions.
 * The Textbook section has exactly one MCQ entry point per chapter.
 */
export default function ChapterScreen() {
  const router = useRouter();
  const { gu } = useLanguage();
  const { chapterId, title } = useLocalSearchParams<{ chapterId: string; title?: string }>();
  const { data: chapter, error } = useAsyncData(() => fetchChapter(chapterId), [chapterId]);

  function openTextbook() {
    if (!chapter?.pdf_storage_path) {
      Alert.alert(
        gu ? 'PDF ઉપલબ્ધ નથી' : 'PDF not available',
        gu ? 'આ પ્રકરણ માટે હજી PDF ઉમેરાયું નથી.' : 'No PDF has been uploaded for this chapter yet.'
      );
      return;
    }
    Linking.openURL(pdfPublicUrl(chapter.pdf_storage_path));
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: title ?? 'Chapter' }} />
      {error ? (
        <ErrorView message={error} />
      ) : !chapter ? (
        <LoadingView />
      ) : (
        <>
          <Pressable style={[styles.entryCard, { backgroundColor: Brand.navy }]} onPress={openTextbook}>
            <Ionicons name="book" size={24} color={Brand.yellow} />
            <View style={{ flex: 1 }}>
              <Text style={styles.entryTitle}>{gu ? 'ટેક્સ્ટબુક' : 'Textbook'}</Text>
              <Text style={styles.entrySub}>{gu ? 'પ્રકરણનું PDF ખોલો' : 'Open the chapter PDF'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
          </Pressable>

          <Pressable
            style={[styles.entryCard, { backgroundColor: '#B8541F' }]}
            onPress={() =>
              router.push({
                pathname: '/videos',
                params: { chapterId, title: title ?? '' },
              })
            }>
            <Ionicons name="logo-youtube" size={24} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.entryTitle}>{gu ? 'વિડિયો' : 'Videos'}</Text>
              <Text style={styles.entrySub}>
                {gu ? 'સમજૂતી, સ્વઅધ્યયનપોથી, ગાળા, ગ્રામર' : 'Explanation, Self-Study, Gala, Grammar'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
          </Pressable>

          <PracticeSets heading="MCQs" source="chapter" id={chapterId} title={title ?? ''} />
        </>
      )}
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
});
