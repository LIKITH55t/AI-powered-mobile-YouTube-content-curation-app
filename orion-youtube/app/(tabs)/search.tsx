import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScoredVideo, FeedbackEntry } from '../../types';
import { getGoal } from '../../engine/rules';
import { rankVideos } from '../../engine/scoring';
import { searchVideos, setApiKey, getApiKey } from '../../engine/youtube-api';
import { loadPreferences, loadFeedback, addFeedback } from '../../store/preferences';
import VideoCard from '../../components/VideoCard';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ScoredVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      if (!getApiKey()) {
        setLoading(false);
        return;
      }

      const [prefs, feedback] = await Promise.all([loadPreferences(), loadFeedback()]);
      const goal = getGoal(prefs.goalId);
      if (prefs.apiKey) setApiKey(prefs.apiKey);

      const { videos } = await searchVideos(query.trim(), 25);

      const scored = rankVideos(
        videos,
        prefs.intent,
        goal,
        feedback,
        prefs.blockedChannels,
        prefs.blockedKeywords,
        prefs.filterMode
      );

      const visible =
        prefs.filterMode === 'remove'
          ? scored.filter(v => v.action !== 'remove')
          : scored;

      setResults(visible);
    } catch {}
    setLoading(false);
  };

  const handleFeedback = async (video: ScoredVideo, action: 'like' | 'save' | 'skip') => {
    await addFeedback({
      videoId: video.id,
      action,
      tags: video.tags || [],
      timestamp: Date.now(),
    });
    if (action === 'skip') {
      setResults(prev => prev.filter(v => v.id !== video.id));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#666" />
        <TextInput
          style={styles.input}
          placeholder="Search YouTube..."
          placeholderTextColor="#555"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={doSearch}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
            <Ionicons name="close-circle" size={18} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={v => v.id}
          renderItem={({ item }) => (
            <VideoCard
              video={item}
              showScore={true}
              filterMode="dim"
              onLike={v => handleFeedback(v, 'like')}
              onSave={v => handleFeedback(v, 'save')}
              onSkip={v => handleFeedback(v, 'skip')}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            searched ? (
              <View style={styles.center}>
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            ) : (
              <View style={styles.center}>
                <Ionicons name="logo-youtube" size={64} color="#333" />
                <Text style={styles.emptyText}>Search for videos</Text>
                <Text style={styles.hintText}>Results are scored by your intent</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    margin: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  input: {
    flex: 1,
    color: '#f0f0f0',
    fontSize: 15,
    paddingVertical: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  list: {
    paddingBottom: 24,
  },
  emptyText: {
    color: '#555',
    fontSize: 16,
    marginTop: 12,
  },
  hintText: {
    color: '#444',
    fontSize: 13,
    marginTop: 4,
  },
});
