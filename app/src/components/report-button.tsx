import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';

import { reportQuestion } from '@/lib/content';
import { getDeviceId } from '@/lib/device';
import { useLanguage } from '@/lib/language';
import { Brand } from '@/lib/theme';

/** "This question is wrong" flag shown in answer reviews. */
export function ReportButton({ questionId }: { questionId: string }) {
  const { gu } = useLanguage();
  const [sent, setSent] = useState(false);

  async function send(reason: string) {
    try {
      const deviceId = await getDeviceId();
      await reportQuestion(questionId, reason, deviceId);
      setSent(true);
    } catch {
      Alert.alert(gu ? 'ભૂલ' : 'Error', gu ? 'રિપોર્ટ મોકલી શકાયો નહીં.' : 'Could not send the report.');
    }
  }

  function ask() {
    Alert.alert(
      gu ? 'પ્રશ્નની ભૂલ જણાવો' : 'Report this question',
      gu ? 'શું ખોટું છે?' : 'What is wrong?',
      [
        { text: gu ? 'જવાબ ખોટો છે' : 'Wrong answer', onPress: () => send('Wrong answer marked') },
        { text: gu ? 'પ્રશ્નમાં ભૂલ છે' : 'Mistake in question', onPress: () => send('Mistake in question text') },
        { text: gu ? 'બીજું' : 'Other', onPress: () => send('Other issue') },
        { text: gu ? 'રદ કરો' : 'Cancel', style: 'cancel' },
      ]
    );
  }

  if (sent) {
    return (
      <Text style={{ fontSize: 12, color: Brand.green, marginTop: 6 }}>
        ✓ {gu ? 'રિપોર્ટ મોકલાયો — આભાર!' : 'Reported — thank you!'}
      </Text>
    );
  }
  return (
    <Pressable onPress={ask} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }} hitSlop={6}>
      <Ionicons name="flag-outline" size={13} color={Brand.textMuted} />
      <Text style={{ fontSize: 12, color: Brand.textMuted }}>
        {gu ? 'ભૂલ જણાવો' : 'Report mistake'}
      </Text>
    </Pressable>
  );
}
