import { describe, it, expect } from 'vitest';
import { parseIntent, tokenize, getGoal, GOALS } from '../rules';
import { rankVideos, scoreVideo } from '../scoring';
import { YouTubeVideo, ScoredVideo, FeedbackEntry } from '../../types';

function mockVideo(overrides: Partial<YouTubeVideo> = {}): YouTubeVideo {
  return {
    id: 'vid1',
    title: 'DSA Placement Preparation Tips',
    description: 'Learn data structures and algorithms for campus placement interviews',
    channelTitle: 'CodeMaster',
    channelId: 'UC123',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    publishedAt: '2024-01-15T10:00:00Z',
    duration: 'PT15M30S',
    viewCount: '125000',
    likeCount: '5000',
    tags: ['dsa', 'placement', 'interview'],
    ...overrides,
  };
}

describe('Intent Parser', () => {
  it('extracts interests from natural language', () => {
    const intent = parseIntent('I want DSA tutorials and placement prep');
    expect(intent.interests.length).toBeGreaterThan(0);
    expect(intent.interests).toContain('dsa');
    expect(intent.interests).toContain('placement');
  });

  it('extracts exclusions from natural language', () => {
    const intent = parseIntent('show me coding tutorials, no vlogs or gaming');
    expect(intent.exclusions.length).toBeGreaterThan(0);
    expect(intent.exclusions).toContain('vlogs');
    expect(intent.exclusions).toContain('gaming');
  });

  it('handles combined interests and exclusions', () => {
    const intent = parseIntent('GATE prep, math and physics. Avoid coaching ads.');
    expect(intent.interests).toContain('gate');
    expect(intent.interests).toContain('prep');
    expect(intent.exclusions.length).toBeGreaterThan(0);
  });

  it('tokenizes text correctly', () => {
    const tokens = tokenize('DSA, Data Structures & Algorithms!');
    expect(tokens).toContain('dsa');
    expect(tokens).toContain('data');
    expect(tokens).toContain('structures');
    expect(tokens).toContain('algorithms');
  });

  it('filters stopwords', () => {
    const tokens = tokenize('the quick brown fox is very fast');
    expect(tokens).not.toContain('the');
    expect(tokens).not.toContain('is');
    expect(tokens).not.toContain('very');
  });
});

describe('Scoring Engine', () => {
  it('scores a relevant video higher than an irrelevant one', () => {
    const goal = getGoal('placements');
    const intent = { interests: ['dsa', 'placement'], exclusions: [], rawPrompt: '' };

    const relevant = mockVideo({
      title: 'DSA Placement Tips',
      description: 'Data structures and algorithms for campus placement',
      tags: ['dsa', 'placement'],
    });

    const irrelevant = mockVideo({
      id: 'vid2',
      title: 'Best Gaming Montage 2024',
      description: 'Epic Fortnite moments and Call of Duty highlights',
      tags: ['gaming', 'fortnite'],
      channelTitle: 'GamerZone',
    });

    const scoreRelevant = scoreVideo(relevant, intent, goal, [], [], []);
    const scoreIrrelevant = scoreVideo(irrelevant, intent, goal, [], [], []);

    expect(scoreRelevant.score).toBeGreaterThan(scoreIrrelevant.score);
  });

  it('penalizes excluded terms', () => {
    const goal = getGoal('placements');
    const intent = {
      interests: ['dsa'],
      exclusions: ['gaming'],
      rawPrompt: '',
    };

    const video = mockVideo({
      title: 'Gaming setup and DSA tutorial',
      description: 'gaming montage with some coding',
      tags: ['gaming', 'dsa'],
    });

    const score = scoreVideo(video, intent, goal, [], [], []);
    expect(score.signals.exclusionPenalty).toBeLessThan(0);
  });

  it('applies blocklist cap', () => {
    const goal = getGoal('placements');
    const intent = { interests: ['dsa'], exclusions: [], rawPrompt: '' };

    const video = mockVideo({
      title: 'Best DSA placement video',
      tags: ['dsa', 'placement'],
    });

    const score = scoreVideo(video, intent, goal, [], ['CodeMaster'], []);
    expect(score.score).toBeLessThanOrEqual(12);
    expect(score.action).toBe('remove');
  });

  it('blocks by keyword', () => {
    const goal = getGoal('placements');
    const intent = { interests: ['dsa'], exclusions: [], rawPrompt: '' };

    const video = mockVideo({
      title: 'Gaming highlights 2024',
      tags: ['gaming'],
    });

    const score = scoreVideo(video, intent, goal, [], [], ['gaming']);
    expect(score.score).toBeLessThanOrEqual(12);
    expect(score.action).toBe('remove');
  });

  it('feedback boosts score for liked videos', () => {
    const goal = getGoal('placements');
    const intent = { interests: ['dsa'], exclusions: [], rawPrompt: '' };
    const video = mockVideo({ tags: ['dsa'] });

    const feedback: FeedbackEntry[] = [
      { videoId: 'vid1', action: 'like', tags: ['dsa'], timestamp: Date.now() },
    ];

    const withFeedback = scoreVideo(video, intent, goal, feedback, [], []);
    const without = scoreVideo(video, intent, goal, [], [], []);

    expect(withFeedback.score).toBeGreaterThan(without.score);
  });
});

describe('Ranking', () => {
  it('sorts videos by score descending', () => {
    const goal = getGoal('placements');
    const intent = { interests: ['dsa'], exclusions: [], rawPrompt: '' };

    const videos = [
      mockVideo({ id: 'v1', title: 'Gaming video', tags: ['gaming'] }),
      mockVideo({ id: 'v2', title: 'DSA placement tips', tags: ['dsa', 'placement'] }),
      mockVideo({ id: 'v3', title: 'Interview prep DSA', tags: ['dsa', 'interview'] }),
    ];

    const ranked = rankVideos(videos, intent, goal, [], [], [], 'dim');
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    expect(ranked[1].score).toBeGreaterThanOrEqual(ranked[2].score);
  });

  it('removes blocked videos from visible list in remove mode', () => {
    const goal = getGoal('placements');
    const intent = { interests: ['dsa'], exclusions: [], rawPrompt: '' };

    const videos = [
      mockVideo({ id: 'v1', title: 'Blocked channel video' }),
      mockVideo({ id: 'v2', title: 'DSA tips', tags: ['dsa'] }),
    ];

    const ranked = rankVideos(videos, intent, goal, [], ['CodeMaster'], [], 'remove');
    const visible = ranked.filter(v => v.action !== 'remove');
    expect(visible.every(v => v.channelTitle !== 'CodeMaster')).toBe(true);
  });
});

describe('Goal Profiles', () => {
  it('has three goals defined', () => {
    expect(GOALS).toHaveLength(3);
  });

  it('each goal has vocabulary', () => {
    for (const goal of GOALS) {
      expect(goal.vocabulary.length).toBeGreaterThan(0);
    }
  });

  it('getGoal returns correct goal', () => {
    expect(getGoal('placements').id).toBe('placements');
    expect(getGoal('exams').id).toBe('exams');
    expect(getGoal('skills').id).toBe('skills');
  });
});
