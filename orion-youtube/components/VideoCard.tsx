import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScoredVideo } from '../types';
import { formatDuration, formatViews, timeAgo } from '../engine/youtube-api';
import ScoreBadge from './ScoreBadge';

interface Props {
  video: ScoredVideo;
  showScore: boolean;
  filterMode: 'remove' | 'dim';
  onLike: (v: ScoredVideo) => void;
  onSave: (v: ScoredVideo) => void;
  onSkip: (v: ScoredVideo) => void;
}

export default function VideoCard({
  video,
  showScore,
  filterMode,
  onLike,
  onSave,
  onSkip,
}: Props) {
  const dimmed = video.action === 'dim';

  const openVideo = () => {
    Linking.openURL(`https://youtube.com/watch?v=${video.id}`);
  };

  return (
    <View style={[styles.card, dimmed && styles.dimmed]}>
      <TouchableOpacity onPress={openVideo} activeOpacity={0.8}>
        <View style={styles.thumbnailWrap}>
          <Image source={{ uri: video.thumbnailUrl }} style={styles.thumbnail} />
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
          </View>
          <ScoreBadge score={video.score} visible={showScore} />
        </View>
      </TouchableOpacity>

      <View style={styles.info}>
        <TouchableOpacity onPress={openVideo} activeOpacity={0.8}>
          <Text style={styles.title} numberOfLines={2}>
            {video.title}
          </Text>
        </TouchableOpacity>
        <Text style={styles.channel}>{video.channelTitle}</Text>
        <Text style={styles.meta}>
          {formatViews(video.viewCount)} views · {timeAgo(video.publishedAt)}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onLike(video)}>
          <Ionicons name="heart-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onSave(video)}>
          <Ionicons name="bookmark-outline" size={20} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onSkip(video)}>
          <Ionicons name="close-circle-outline" size={20} color="#888" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#181818',
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  dimmed: {
    opacity: 0.35,
  },
  thumbnailWrap: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#222',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  info: {
    padding: 12,
  },
  title: {
    color: '#f0f0f0',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  channel: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
  },
  meta: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingVertical: 6,
    paddingHorizontal: 8,
    justifyContent: 'flex-end',
    gap: 16,
  },
  actionBtn: {
    padding: 8,
  },
});
