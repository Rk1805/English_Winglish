import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguage } from '@/lib/language';
import { Brand } from '@/lib/theme';

/** Red brand bar shown on the three home tabs, with the EN/ગુજ toggle. */
export function BrandHeader() {
  const insets = useSafeAreaInsets();
  const { gu, toggle } = useLanguage();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>English Winglish</Text>
        <Text style={styles.subtitle}># by Nikunj Sir</Text>
      </View>
      <Pressable onPress={toggle} style={styles.toggle} hitSlop={8}>
        <Text style={styles.toggleText}>{gu ? 'EN' : 'ગુજ'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Brand.red,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  toggle: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toggleText: { color: '#fff', fontWeight: '700' },
});
