import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorView, LoadingView, useAsyncData } from '@/components/async-view';
import { BrandHeader } from '@/components/brand-header';
import { fetchExams } from '@/lib/content';
import { useLanguage } from '@/lib/language';
import { loc } from '@/lib/models';
import { Brand } from '@/lib/theme';

export default function ExamsTab() {
  const router = useRouter();
  const { gu } = useLanguage();
  const { data, error } = useAsyncData(fetchExams);

  return (
    <View style={styles.screen}>
      <BrandHeader />
      {error ? (
        <ErrorView message={error} />
      ) : !data ? (
        <LoadingView />
      ) : (
        <FlatList
          data={data}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          columnWrapperStyle={{ gap: 10 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/quiz-setup',
                  params: {
                    source: 'exam',
                    id: item.id,
                    title: loc(gu, item.name_en, item.name_gu),
                  },
                })
              }>
              <Text style={styles.cardTitle}>{loc(gu, item.name_en, item.name_gu)}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  list: { padding: 12, gap: 10 },
  card: {
    flex: 1,
    backgroundColor: Brand.card,
    borderRadius: 12,
    paddingVertical: 22,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Brand.border,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Brand.navy, textAlign: 'center' },
});
