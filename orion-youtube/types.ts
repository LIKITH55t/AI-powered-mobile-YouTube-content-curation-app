export type GoalId = 'placements' | 'exams' | 'skills';

export interface GoalProfile {
  id: GoalId;
  label: string;
  description: string;
  vocabulary: string[];
}

export interface Intent {
  interests: string[];
  exclusions: string[];
  rawPrompt: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  likeCount: string;
  tags: string[];
}

export interface ScoredVideo extends YouTubeVideo {
  score: number;
  signals: ScoreSignals;
  action: 'show' | 'dim' | 'remove';
}

export interface ScoreSignals {
  goalFit: number;
  interestFit: number;
  tokenOverlap: number;
  exclusionPenalty: number;
  feedbackBoost: number;
}

export interface FeedbackEntry {
  videoId: string;
  action: 'like' | 'save' | 'skip' | 'hide';
  tags: string[];
  timestamp: number;
}

export interface AppPreferences {
  goalId: GoalId;
  intent: Intent;
  filterMode: 'remove' | 'dim';
  showScoreBadges: boolean;
  blockedChannels: string[];
  blockedKeywords: string[];
  enabled: boolean;
  apiKey: string;
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  goalId: 'placements',
  intent: { interests: [], exclusions: [], rawPrompt: '' },
  filterMode: 'dim',
  showScoreBadges: true,
  blockedChannels: [],
  blockedKeywords: [],
  enabled: true,
  apiKey: '',
};
