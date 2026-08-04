import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorView, LoadingView, useAsyncData } from '@/components/async-view';
import { Row, Section, usePremiumAlert } from '@/components/material-sections';
import { fetchVideos, MaterialFilter } from '@/lib/content';
import { useLanguage } from '@/lib/language';
import { loc, Video } from '@/lib/models';
import { Brand } from '@/lib/theme';

const CATEGORY_ORDER = ['explanation', 'self_study', 'gala', 'grammar', null] as const;

const CATEGORY_LABEL: Record<string, { en: string; gu: string }> = {
  explanation: { en: 'Explanation', gu: 'સમજૂતી' },
  self_study: { en: 'Self-Study Notebook', gu: 'સ્વઅધ્યયનપોથી' },
  gala: { en: 'Gala', gu: 'ગાળા' },
  grammar: { en: 'Grammar', gu: 'ગ્રામર' },
};

/** Dedicated video list for one topic or exam, grouped into sub-categories when tagged. */
export default function VideosScreen() {
  const { gu } = useLanguage();
  const premiumAlert = usePremiumAlert();
  const { topicId, examId, chapterId, title } = useLocalSearchParams<{
    topicId?: string;
    examId?: string;
    chapterId?: string;
    title?: string;
  }>();
  const filter: MaterialFilter = topicId
    ? { topicId }
    : examId
      ? { examId }
      : chapterId
        ? { chapterId }
        : {};
  const { data: videos, error } = useAsyncData(() => fetchVideos(filter), [topicId, examId, chapterId]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: title ? `${gu ? 'વિડિયો' : 'Videos'} · ${title}` : 'Videos' }} />
      {error ? (
        <ErrorView message={error} />
      ) : !videos ? (
        <LoadingView />
      ) : videos.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="videocam-outline" size={44} color={Brand.textMuted} />
          <Text style={styles.emptyText}>
            {gu ? 'હજી કોઈ વિડિયો ઉમેરાયો નથી.' : 'No videos added for this yet.'}
          </Text>
        </View>
      ) : (
        CATEGORY_ORDER.map((cat) => {
          const group = videos.filter((v) => v.video_category === cat);
          if (group.length === 0) return null;
          const heading = cat
            ? loc(gu, CATEGORY_LABEL[cat].en, CATEGORY_LABEL[cat].gu)
            : gu
              ? 'બીજા વિડિયો'
              : 'Other Videos';
          return (
            <Section key={cat ?? 'other'} title={heading}>
              {group.map((video) => (
                <VideoRow key={video.id} video={video} onLocked={premiumAlert} />
              ))}
            </Section>
          );
        })
      )}
    </ScrollView>
  );
}

function VideoRow({ video, onLocked }: { video: Video; onLocked: () => void }) {
  const { gu } = useLanguage();
  return (
    <Row
      icon="logo-youtube"
      iconColor="#FF0000"
      title={loc(gu, video.title_en, video.title_gu)}
      locked={video.is_premium}
      onPress={() =>
        video.is_premium
          ? onLocked()
          : Linking.openURL(`https://youtube.com/watch?v=${video.youtube_id}`)
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  emptyBox: { alignItems: 'center', gap: 10, padding: 24 },
  emptyText: { color: Brand.textMuted, textAlign: 'center', lineHeight: 20 },
});
