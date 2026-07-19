import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorView, LoadingView, useAsyncData } from '@/components/async-view';
import { fetchTopics } from '@/lib/content';
import { useLanguage } from '@/lib/language';
import { loc } from '@/lib/models';
import { Brand } from '@/lib/theme';

export default function TopicListScreen() {
  const router = useRouter();
  const { gu } = useLanguage();
  const { categoryId, title } = useLocalSearchParams<{ categoryId: string; title?: string }>();
  const { data, error } = useAsyncData(() => fetchTopics(categoryId), [categoryId]);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: title ?? 'Topics' }} />
      {error ? (
        <ErrorView message={error} />
      ) : !data ? (
        <LoadingView />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/quiz-setup',
                  params: {
                    source: 'topic',
                    id: item.id,
                    title: loc(gu, item.name_en, item.name_gu),
                  },
                })
              }>
              <View style={styles.numberCircle}>
                <Text style={styles.number}>{index + 1}</Text>
              </View>
              <Text style={styles.cardTitle}>{loc(gu, item.name_en, item.name_gu)}</Text>
              <Ionicons name="chevron-forward" size={20} color={Brand.textMuted} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  list: { padding: 12, gap: 8 },
  card: {
    backgroundColor: Brand.card,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  numberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9E4E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { color: Brand.red, fontWeight: '700' },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#222' },
});
