import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppPreferences, DEFAULT_PREFERENCES, FeedbackEntry, GoalId, Intent } from '../types';

const PREFS_KEY = '@orion_preferences';
const FEEDBACK_KEY = '@orion_feedback';

export async function loadPreferences(): Promise<AppPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PREFERENCES;
}

export async function savePreferences(prefs: AppPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export async function updatePreferences(
  patch: Partial<AppPreferences>
): Promise<AppPreferences> {
  const current = await loadPreferences();
  const updated = { ...current, ...patch };
  await savePreferences(updated);
  return updated;
}

export async function loadFeedback(): Promise<FeedbackEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(FEEDBACK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export async function addFeedback(entry: FeedbackEntry): Promise<FeedbackEntry[]> {
  const all = await loadFeedback();
  all.push(entry);
  const trimmed = all.slice(-500);
  await AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export async function clearFeedback(): Promise<void> {
  await AsyncStorage.removeItem(FEEDBACK_KEY);
}
