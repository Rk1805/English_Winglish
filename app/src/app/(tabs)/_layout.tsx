import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useLanguage } from '@/lib/language';
import { Brand } from '@/lib/theme';

export default function TabsLayout() {
  const { gu } = useLanguage();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Brand.red,
        tabBarInactiveTintColor: Brand.textMuted,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: gu ? 'ગ્રામર' : 'Grammar',
          tabBarIcon: ({ color, size }) => <Ionicons name="book" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: gu ? 'પરીક્ષા' : 'Exams',
          tabBarIcon: ({ color, size }) => <Ionicons name="trophy" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: gu ? 'પ્રેક્ટિસ' : 'Practice',
          tabBarIcon: ({ color, size }) => <Ionicons name="flash" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
