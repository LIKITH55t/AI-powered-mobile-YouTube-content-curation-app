import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loadPreferences, savePreferences } from '../store/preferences';
import { parseIntent } from '../engine/rules';
import { useEffect } from 'react';

export default function IntentScreen() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    loadPreferences().then(p => setPrompt(p.intent.rawPrompt));
  }, []);

  const handleSave = async () => {
    const intent = parseIntent(prompt);
    const prefs = await loadPreferences();
    await savePreferences({ ...prefs, intent });
    Alert.alert('Intent Updated', `Found ${intent.interests.length} interests, ${intent.exclusions.length} exclusions`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>What do you want to see?</Text>
      <Text style={styles.subheading}>
        Describe your interests in natural language. The engine will extract
        keywords to score and filter your feed.
      </Text>

      <TextInput
        style={styles.textarea}
        placeholder={'e.g. I want DSA tutorials and placement prep.\nNo vlogs or gaming content.'}
        placeholderTextColor="#555"
        value={prompt}
        onChangeText={setPrompt}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />

      <View style={styles.examples}>
        <Text style={styles.examplesTitle}>Examples:</Text>
        {[
          'GATE preparation, math and physics. No coaching ads.',
          'React Native tutorials, system design, clean code.',
          'Bank PO exam prep, reasoning, current affairs.',
          'Python machine learning, data science. Skip gaming.',
        ].map((ex, i) => (
          <TouchableOpacity key={i} style={styles.exampleChip} onPress={() => setPrompt(ex)}>
            <Ionicons name="flash" size={12} color="#eab308" />
            <Text style={styles.exampleText}>{ex}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.preview}>
        <Text style={styles.previewTitle}>Parsed Intent:</Text>
        {(() => {
          const intent = parseIntent(prompt);
          return (
            <>
              <View style={styles.tagRow}>
                <Text style={styles.tagLabel}>Interests:</Text>
                {intent.interests.length === 0 ? (
                  <Text style={styles.emptyTag}>none</Text>
                ) : (
                  intent.interests.map(t => (
                    <View key={t} style={styles.interestTag}>
                      <Text style={styles.interestTagText}>{t}</Text>
                    </View>
                  ))
                )}
              </View>
              <View style={styles.tagRow}>
                <Text style={styles.tagLabel}>Exclusions:</Text>
                {intent.exclusions.length === 0 ? (
                  <Text style={styles.emptyTag}>none</Text>
                ) : (
                  intent.exclusions.map(t => (
                    <View key={t} style={styles.exclusionTag}>
                      <Text style={styles.exclusionTagText}>{t}</Text>
                    </View>
                  ))
                )}
              </View>
            </>
          );
        })()}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Ionicons name="checkmark" size={18} color="#fff" />
        <Text style={styles.saveBtnText}>Save Intent</Text>
      </TouchableOpacity>
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
  heading: {
    color: '#f0f0f0',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  subheading: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  textarea: {
    backgroundColor: '#1e1e1e',
    color: '#f0f0f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#333',
    lineHeight: 22,
  },
  examples: {
    marginTop: 20,
  },
  examplesTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  exampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  exampleText: {
    color: '#bbb',
    fontSize: 13,
    flex: 1,
  },
  preview: {
    marginTop: 24,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  previewTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  tagLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyTag: {
    color: '#444',
    fontSize: 12,
    fontStyle: 'italic',
  },
  interestTag: {
    backgroundColor: '#1e3a1e',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  interestTagText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '600',
  },
  exclusionTag: {
    backgroundColor: '#3a1e1e',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  exclusionTagText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 24,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
