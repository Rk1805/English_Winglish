import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorView, LoadingView, useAsyncData, useFocusRefreshKey } from '@/components/async-view';
import { BrandHeader } from '@/components/brand-header';
import { MaterialSections } from '@/components/material-sections';
import { fetchNotes, fetchPdfs, fetchVideos } from '@/lib/content';
import { useLanguage } from '@/lib/language';
import { Brand } from '@/lib/theme';

export default function StudyTab() {
  const { gu } = useLanguage();
  const refreshKey = useFocusRefreshKey();
  const { data, error } = useAsyncData(async () => {
    const [videos, pdfs, notes] = await Promise.all([fetchVideos(), fetchPdfs(), fetchNotes()]);
    return { videos, pdfs, notes };
  }, [refreshKey]);

  const empty =
    data && data.videos.length === 0 && data.pdfs.length === 0 && data.notes.length === 0;

  return (
    <View style={styles.screen}>
      <BrandHeader />
      {error ? (
        <ErrorView message={error} />
      ) : !data ? (
        <LoadingView />
      ) : empty ? (
        <View style={styles.emptyBox}>
          <Ionicons name="library-outline" size={48} color={Brand.textMuted} />
          <Text style={styles.emptyText}>
            {gu
              ? 'હજી કોઈ સ્ટડી મટીરિયલ ઉમેરાયું નથી.\nએડમિન પેનલમાંથી વિડિયો, PDF અને નોટ્સ ઉમેરો.'
              : 'No study material added yet.\nAdd videos, PDFs and notes from the admin panel.'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <MaterialSections videos={data.videos} pdfs={data.pdfs} notes={data.notes} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  list: { padding: 12, gap: 16 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  emptyText: { color: Brand.textMuted, textAlign: 'center', lineHeight: 20 },
});
