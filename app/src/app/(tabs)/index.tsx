import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorView, LoadingView, useAsyncData } from '@/components/async-view';
import { BrandHeader } from '@/components/brand-header';
import { fetchCategories } from '@/lib/content';
import { useLanguage } from '@/lib/language';
import { loc } from '@/lib/models';
import { Brand } from '@/lib/theme';

export default function GrammarTab() {
  const router = useRouter();
  const { gu } = useLanguage();
  const { data, error } = useAsyncData(fetchCategories);

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
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/topics/[categoryId]',
                  params: { categoryId: item.id, title: loc(gu, item.name_en, item.name_gu) },
                })
              }>
              <View style={styles.iconCircle}>
                <Ionicons
                  name={item.kind === 'vocabulary' ? 'language' : 'text'}
                  size={20}
                  color={Brand.navy}
                />
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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FBEFD9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#222' },
});
