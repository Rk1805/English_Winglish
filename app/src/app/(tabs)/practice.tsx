import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandHeader } from '@/components/brand-header';
import { useLanguage } from '@/lib/language';
import { Brand } from '@/lib/theme';

export default function PracticeTab() {
  const router = useRouter();
  const { gu } = useLanguage();

  return (
    <View style={styles.screen}>
      <BrandHeader />
      <View style={styles.center}>
        <Ionicons name="flash" size={64} color={Brand.yellow} />
        <Text style={styles.title}>{gu ? 'રેન્ડમ પ્રેક્ટિસ' : 'Random Practice'}</Text>
        <Text style={styles.subtitle}>
          {gu ? 'બધા વિષયોમાંથી રેન્ડમ પ્રશ્નો ઉકેલો' : 'Solve random questions from all topics'}
        </Text>
        <Pressable
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: '/quiz-setup',
              params: {
                source: 'random',
                title: gu ? 'રેન્ડમ પ્રેક્ટિસ' : 'Random Practice',
              },
            })
          }>
          <Ionicons name="play" size={18} color="#fff" />
          <Text style={styles.buttonText}>{gu ? 'શરૂ કરો' : 'Start'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#222', marginTop: 8 },
  subtitle: { color: Brand.textMuted, textAlign: 'center' },
  button: {
    marginTop: 20,
    backgroundColor: Brand.red,
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
