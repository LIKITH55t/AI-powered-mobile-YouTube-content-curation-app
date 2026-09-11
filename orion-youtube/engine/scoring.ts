import {
  YouTubeVideo,
  ScoredVideo,
  ScoreSignals,
  Intent,
  GoalProfile,
  FeedbackEntry,
  AppPreferences,
} from '../types';
import { tokenize } from './rules';

const THRESHOLD = 48;
const BLOCKLIST_CAP = 12;

export function scoreVideo(
  video: YouTubeVideo,
  intent: Intent,
  goal: GoalProfile,
  feedback: FeedbackEntry[],
  blockedChannels: string[],
  blockedKeywords: string[]
): ScoredVideo {
  const text = `${video.title} ${video.description} ${video.channelTitle} ${(video.tags || []).join(' ')}`.toLowerCase();
  const postTokens = new Set(tokenize(text));

  const isBlockedChannel = blockedChannels.some(
    ch => ch.toLowerCase().trim() === video.channelTitle.toLowerCase().trim() ||
          ch.toLowerCase().trim() === video.channelId.toLowerCase().trim()
  );

  const isBlockedKeyword = blockedKeywords.some(kw => {
    const keyword = kw.toLowerCase().trim();
    return keyword.length > 0 && text.includes(keyword);
  });

  const isBlocked = isBlockedChannel || isBlockedKeyword;

  const goalFit = computeGoalFit(postTokens, goal);
  const interestFit = computeInterestFit(postTokens, intent);
  const tokenOverlap = computeTokenOverlap(postTokens, intent);
  const exclusionPenalty = computeExclusionPenalty(postTokens, intent);
  const feedbackBoost = computeFeedbackBoost(video.id, feedback);

  const signals: ScoreSignals = {
    goalFit,
    interestFit,
    tokenOverlap,
    exclusionPenalty,
    feedbackBoost,
  };

  let rawScore = goalFit + interestFit + tokenOverlap + exclusionPenalty + feedbackBoost;
  rawScore = Math.max(0, Math.min(100, rawScore));

  if (isBlocked) {
    rawScore = Math.min(rawScore, BLOCKLIST_CAP);
  }

  return {
    ...video,
    score: Math.round(rawScore),
    signals,
    action: isBlocked ? 'remove' : rawScore < THRESHOLD ? 'remove' : 'show',
  };
}

export function rankVideos(
  videos: YouTubeVideo[],
  intent: Intent,
  goal: GoalProfile,
  feedback: FeedbackEntry[],
  blockedChannels: string[],
  blockedKeywords: string[],
  filterMode: 'remove' | 'dim'
): ScoredVideo[] {
  const scored = videos.map(v =>
    scoreVideo(v, intent, goal, feedback, blockedChannels, blockedKeywords)
  );

  for (const s of scored) {
    if (s.action === 'remove') continue;
    if (s.score < THRESHOLD + 15 && filterMode === 'dim') {
      s.action = 'dim';
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

function computeGoalFit(postTokens: Set<string>, goal: GoalProfile): number {
  let matches = 0;
  for (const term of goal.vocabulary) {
    const lower = term.toLowerCase();
    if (lower.includes(' ')) {
      if (lower.split(/\s+/).every(w => postTokens.has(w))) {
        matches++;
      }
    } else if (postTokens.has(lower)) {
      matches++;
    }
  }
  return saturate(matches, 3) * 30;
}

function computeInterestFit(postTokens: Set<string>, intent: Intent): number {
  let matches = 0;
  for (const interest of intent.interests) {
    if (postTokens.has(interest)) {
      matches++;
    }
  }
  return saturate(matches, 1.5) * 25;
}

function computeTokenOverlap(postTokens: Set<string>, intent: Intent): number {
  let overlap = 0;
  const allIntentTokens = new Set([...intent.interests, ...intent.exclusions]);
  for (const token of postTokens) {
    if (allIntentTokens.has(token)) {
      overlap++;
    }
  }
  const ratio = postTokens.size > 0 ? overlap / postTokens.size : 0;
  return Math.min(ratio * 40, 20);
}

function computeExclusionPenalty(postTokens: Set<string>, intent: Intent): number {
  let penalty = 0;
  for (const exclusion of intent.exclusions) {
    if (postTokens.has(exclusion)) {
      penalty += 15;
    }
  }
  return -Math.min(penalty, 40);
}

function computeFeedbackBoost(videoId: string, feedback: FeedbackEntry[]): number {
  const relevant = feedback.filter(f => f.videoId === videoId);
  let boost = 0;
  for (const f of relevant) {
    switch (f.action) {
      case 'like':
        boost += 5;
        break;
      case 'save':
        boost += 8;
        break;
      case 'skip':
        boost -= 5;
        break;
      case 'hide':
        boost -= 10;
        break;
    }
  }

  const tagBoost = computeTagBoost(feedback);
  return Math.max(-20, Math.min(20, boost + tagBoost));
}

function computeTagBoost(feedback: FeedbackEntry[]): number {
  const tagScores = new Map<string, number>();
  for (const f of feedback) {
    for (const tag of f.tags) {
      const current = tagScores.get(tag) || 0;
      switch (f.action) {
        case 'like':
        case 'save':
          tagScores.set(tag, current + 3);
          break;
        case 'skip':
        case 'hide':
          tagScores.set(tag, current - 3);
          break;
      }
    }
  }
  let total = 0;
  for (const score of tagScores.values()) {
    total += score;
  }
  return Math.max(-10, Math.min(10, total));
}

function saturate(count: number, max: number): number {
  return 1 - Math.exp(-count / max);
}
