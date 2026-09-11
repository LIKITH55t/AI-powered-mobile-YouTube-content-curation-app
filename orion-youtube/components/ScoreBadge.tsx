import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  score: number;
  visible?: boolean;
}

export default function ScoreBadge({ score, visible = true }: Props) {
  if (!visible) return null;

  const color = score >= 70 ? '#22c55e' : score >= 48 ? '#eab308' : '#ef4444';

  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 32,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
