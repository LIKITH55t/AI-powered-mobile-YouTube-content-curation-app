import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoalId } from '../types';
import { GOALS } from '../engine/rules';

interface Props {
  selected: GoalId;
  onSelect: (id: GoalId) => void;
}

export default function FilterBar({ selected, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {GOALS.map(goal => {
        const active = goal.id === selected;
        return (
          <TouchableOpacity
            key={goal.id}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(goal.id)}
          >
            <Ionicons
              name={
                goal.id === 'placements' ? 'briefcase' :
                goal.id === 'exams' ? 'school' : 'code-slash'
              }
              size={14}
              color={active ? '#fff' : '#aaa'}
            />
            <Text style={[styles.label, active && styles.labelActive]}>
              {goal.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e1e1e',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  chipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  label: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: '#fff',
  },
});
