import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppPreferences, DEFAULT_PREFERENCES } from '../../types';
import {
  loadPreferences,
  savePreferences,
  clearFeedback,
} from '../../store/preferences';
import { setApiKey, getApiKey } from '../../engine/youtube-api';
import FilterBar from '../../components/FilterBar';

export default function SettingsScreen() {
  const [prefs, setPrefs] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [apiKey, setApiKeyState] = useState('');
  const [blockedChannelsText, setBlockedChannelsText] = useState('');
  const [blockedKeywordsText, setBlockedKeywordsText] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await loadPreferences();
      setPrefs(p);
      setApiKeyState(p.apiKey || getApiKey());
      setBlockedChannelsText(p.blockedChannels.join('\n'));
      setBlockedKeywordsText(p.blockedKeywords.join(', '));
    })();
  }, []);

  const handleSave = async () => {
    const updated: AppPreferences = {
      ...prefs,
      apiKey: apiKey.trim(),
      blockedChannels: blockedChannelsText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      blockedKeywords: blockedKeywordsText
        .split(/[,\n]/)
        .map(s => s.trim())
        .filter(Boolean),
    };
    setPrefs(updated);
    await savePreferences(updated);
    if (apiKey) setApiKey(apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearFeedback = () => {
    Alert.alert('Clear Feedback', 'Reset all like/save/skip history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearFeedback();
          Alert.alert('Done', 'Feedback history cleared');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>YouTube API Key</Text>
      <TextInput
        style={styles.input}
        placeholder="AIza..."
        placeholderTextColor="#555"
        value={apiKey}
        onChangeText={setApiKeyState}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.hint}>
        Get a free key from console.cloud.google.com → APIs → YouTube Data API v3
      </Text>

      <Text style={styles.sectionTitle}>Goal</Text>
      <FilterBar
        selected={prefs.goalId}
        onSelect={id => setPrefs(p => ({ ...p, goalId: id }))}
      />

      <Text style={styles.sectionTitle}>Filter Mode</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Remove off-topic</Text>
        <Switch
          value={prefs.filterMode === 'remove'}
          onValueChange={v =>
            setPrefs(p => ({ ...p, filterMode: v ? 'remove' : 'dim' }))
          }
          trackColor={{ true: '#3b82f6', false: '#444' }}
        />
      </View>
      <Text style={styles.hint}>
        {prefs.filterMode === 'remove'
          ? 'Off-topic videos are hidden completely'
          : 'Off-topic videos are shown but faded'}
      </Text>

      <Text style={styles.sectionTitle}>Display</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Show score badges</Text>
        <Switch
          value={prefs.showScoreBadges}
          onValueChange={v => setPrefs(p => ({ ...p, showScoreBadges: v }))}
          trackColor={{ true: '#3b82f6', false: '#444' }}
        />
      </View>

      <Text style={styles.sectionTitle}>Blocked Channels</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="One channel name per line"
        placeholderTextColor="#555"
        value={blockedChannelsText}
        onChangeText={setBlockedChannelsText}
        multiline
      />

      <Text style={styles.sectionTitle}>Blocked Keywords</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Comma or line separated"
        placeholderTextColor="#555"
        value={blockedKeywordsText}
        onChangeText={setBlockedKeywordsText}
        multiline
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Ionicons
          name={saved ? 'checkmark-circle' : 'save-outline'}
          size={18}
          color="#fff"
        />
        <Text style={styles.saveBtnText}>
          {saved ? 'Saved!' : 'Save Settings'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dangerBtn} onPress={handleClearFeedback}>
        <Text style={styles.dangerBtnText}>Clear Feedback History</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    color: '#555',
    fontSize: 12,
    marginTop: 6,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    color: '#ddd',
    fontSize: 15,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 28,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  dangerBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 12,
  },
  dangerBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
});
