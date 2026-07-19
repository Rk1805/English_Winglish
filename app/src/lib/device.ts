import AsyncStorage from '@react-native-async-storage/async-storage';

import { getClient } from './content';

/** Stable anonymous device id — powers usage analytics without any login. */

const KEY = 'device_id';
let cached: string | null = null;

function randomId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'dev_';
  for (let i = 0; i < 28; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  let id = await AsyncStorage.getItem(KEY);
  if (!id) {
    id = randomId();
    await AsyncStorage.setItem(KEY, id);
  }
  cached = id;
  return id;
}

/** Fire-and-forget activity ping; safe to call often. */
export async function trackActivity(): Promise<void> {
  try {
    const supabase = getClient();
    if (!supabase) return;
    const deviceId = await getDeviceId();
    await supabase.rpc('track_activity', { p_device_id: deviceId });
  } catch {
    // analytics must never break the app
  }
}
