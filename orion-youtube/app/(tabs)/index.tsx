import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScoredVideo, AppPreferences, FeedbackEntry } from '../../types';
import { getGoal, parseIntent } from '../../engine/rules';
import { rankVideos } from '../../engine/scoring';
import {
  searchVideos,
  getTrending,
  setApiKey,
  getApiKey,
} from '../../engine/youtube-api';
import {
  loadPreferences,
  loadFeedback,
  addFeedback,
  savePreferences,
} from '../../store/preferences';
import VideoCard from '../../components/VideoCard';
import FilterBar from '../../components/FilterBar';

export default function FeedScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<AppPreferences | null>(null);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [videos, setVideos] = useState<ScoredVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ kept: 0, removed: 0, dimmed: 0 });

  const loadData = useCallback(async () => {
    try {
      const [p, f] = await Promise.all([loadPreferences(), loadFeedback()]);
      setPrefs(p);
      setFeedback(f);

      if (p.apiKey) setApiKey(p.apiKey);

      if (!getApiKey()) {
        setError('Set your YouTube API key in Settings');
        setLoading(false);
        return;
      }

      const goal = getGoal(p.goalId);
      const intent = p.intent.interests.length > 0
        ? p.intent
        : parseIntent(p.intent.rawPrompt || goal.description);

      let rawVideos;
      if (intent.interests.length > 0) {
        const query = intent.interests.slice(0, 5).join(' ');
        const result = await searchVideos(query, 30);
        rawVideos = result.videos;
      } else {
        rawVideos = await getTrending('IN', 30);
      }

      const scored = rankVideos(
        rawVideos,
        intent,
        goal,
        f,
        p.blockedChannels,
        p.blockedKeywords,
        p.filterMode
      );

      const kept = scored.filter(v => v.action === 'show').length;
      const removed = scored.filter(v => v.action === 'remove').length;
      const dimmed = scored.filter(v => v.action === 'dim').length;
      setStats({ kept, removed, dimmed });

      const visible =
        p.filterMode === 'remove'
          ? scored.filter(v => v.action !== 'remove')
          : scored;

      setVideos(visible);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleFeedback = async (
    video: ScoredVideo,
    action: 'like' | 'save' | 'skip' | 'hide'
  ) => {
    const entry: FeedbackEntry = {
      videoId: video.id,
      action,
      tags: video.tags || [],
      timestamp: Date.now(),
    };
    const updated = await addFeedback(entry);
    setFeedback(updated);

    if (action === 'skip' || action === 'hide') {
      setVideos(prev => prev.filter(v => v.id !== video.id));
    }
  };

  const handleGoalChange = async (goalId: any) => {
    if (!prefs) return;
    const updated = { ...prefs, goalId };
    await savePreferences(updated);
    setPrefs(updated);
    setLoading(true);
    await loadData();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Curating your feed...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.retryText}>Go to Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FilterBar selected={prefs?.goalId || 'placements'} onSelect={handleGoalChange} />

      <View style={styles.statsBar}>
        <Text style={styles.statText}>
          {stats.kept} kept · {stats.dimmed} dimmed · {stats.removed} removed
        </Text>
        <TouchableOpacity onPress={() => router.push('/intent')}>
          <Ionicons name="create-outline" size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={videos}
        keyExtractor={v => v.id}
        renderItem={({ item }) => (
          <VideoCard
            video={item}
            showScore={prefs?.showScoreBadges ?? true}
            filterMode={prefs?.filterMode ?? 'dim'}
            onLike={v => handleFeedback(v, 'like')}
            onSave={v => handleFeedback(v, 'save')}
            onSkip={v => handleFeedback(v, 'skip')}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No videos match your intent</Text>
            <TouchableOpacity onPress={() => router.push('/intent')}>
              <Text style={styles.linkText}>Update your intent</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0f0f0f',
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  statText: {
    color: '#666',
    fontSize: 12,
  },
  list: {
    paddingBottom: 24,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginBottom: 8,
  },
  linkText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
});
