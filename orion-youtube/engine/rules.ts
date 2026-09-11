import { GoalId, GoalProfile, Intent } from '../types';

export const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'just', 'about', 'also', 'and',
  'but', 'or', 'if', 'while', 'that', 'this', 'these', 'those', 'i',
  'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she',
  'her', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who',
  'whom', 'up', 'down', 's', 't', 'don', 'doesn', 'didn', 'won',
  'wouldn', 'couldn', 'shouldn', 'isn', 'aren', 'wasn', 'weren',
  'video', 'watch', 'channel', 'subscribe', 'like', 'share', 'comment',
]);

export const GOALS: GoalProfile[] = [
  {
    id: 'placements',
    label: 'Placements',
    description: 'Campus placement prep, aptitude, interview tips, coding rounds',
    vocabulary: [
      'placement', 'placements', 'campus', 'interview', 'aptitude',
      'coding', 'dsa', 'data structures', 'algorithms', 'hr round',
      'technical round', 'resume', 'job', 'hiring', 'recruiter',
      'offer', 'on-campus', 'off-campus', 'coding round', 'mcq',
      'quantitative', 'logical reasoning', 'verbal', 'group discussion',
      'salary', 'package', 'ctc', 'intern', 'internship', 'return offer',
      'tech mahindra', 'tcs', 'infosys', 'wipro', 'cognizant', 'accenture',
      'amazon', 'google', 'microsoft', 'meta', 'samsung', 'adobe',
      'goldman sachs', 'jp morgan', ' flipkart', 'razorpay', 'dell',
      'leetcode', 'geeksforgeeks', 'hackerrank', 'codeforces',
    ],
  },
  {
    id: 'exams',
    label: 'Competitive Exams',
    description: 'GATE, CAT, GRE, UPSC, JEE, NEET and other competitive exams',
    vocabulary: [
      'gate', 'cat', 'gre', 'gmat', 'upsc', 'jee', 'neet', 'clat',
      'bank', 'po', 'clerk', 'ssc', 'railway', 'nda', 'cds',
      'exam', 'preparation', 'syllabus', 'previous year', 'paper',
      'mock test', 'test series', 'strategy', 'topper', 'air',
      'rank', 'marks', 'percentile', 'cut off', 'cutoff', 'books',
      'study plan', 'daily routine', 'math', 'physics', 'chemistry',
      'biology', 'english', 'general knowledge', 'current affairs',
      'quant', 'varc', 'dilr', 'reasoning', 'aptitude test',
      'revision', 'notes', 'formula', 'tricks', 'shortcuts',
      'unacademy', 'physics wallah', 'byju', 'gradeup', 'testbook',
      'khan academy', 'mohit tyagi', 'neha agrawal', 'unomayor',
    ],
  },
  {
    id: 'skills',
    label: 'Skill Learning',
    description: 'Programming, design, tools, frameworks, and professional skills',
    vocabulary: [
      'tutorial', 'learn', 'course', 'beginner', 'advanced', 'masterclass',
      'programming', 'python', 'javascript', 'typescript', 'react', 'node',
      'flutter', 'dart', 'swift', 'kotlin', 'java', 'c++', 'rust', 'go',
      'web development', 'mobile development', 'full stack', 'frontend',
      'backend', 'devops', 'cloud', 'aws', 'azure', 'gcp', 'docker',
      'kubernetes', 'linux', 'git', 'github', 'sql', 'mongodb', 'redis',
      'machine learning', 'deep learning', 'ai', 'data science', 'nlp',
      'computer vision', 'tensorFlow', 'pytorch', 'opencv',
      'ui design', 'ux', 'figma', 'photoshop', 'blender', 'after effects',
      'freelancing', 'portfolio', 'github', 'resume building',
      'system design', 'architecture', 'design patterns', 'clean code',
      'testing', 'ci/cd', 'agile', 'scrum', 'jira',
      'skillshare', 'udemy', 'coursera', 'scrimba', 'freecodecamp',
      'traversy media', 'net ninja', 'fireship', 'theo', 'ben awad',
    ],
  },
];

export function getGoal(id: GoalId): GoalProfile {
  return GOALS.find(g => g.id === id) ?? GOALS[0];
}

export function parseIntent(prompt: string): Intent {
  const lower = prompt.toLowerCase();
  const interests: string[] = [];
  const exclusions: string[] = [];

  const excludePatterns = [
    /(?:no|without|exclude|avoid|skip|not? interested in|don'?t want)\s+(.+?)(?:,|\.|$)/gi,
    /(?:stop showing|filter out|hide)\s+(.+?)(?:,|\.|$)/gi,
  ];

  const includePatterns = [
    /(?:interested in|i want|i like|focus on|show me|about|into)\s+(.+?)(?:,|\.|$)/gi,
  ];

  for (const pattern of excludePatterns) {
    let match;
    while ((match = pattern.exec(lower)) !== null) {
      const tokens = tokenize(match[1]);
      exclusions.push(...tokens);
    }
  }

  for (const pattern of includePatterns) {
    let match;
    while ((match = pattern.exec(lower)) !== null) {
      const tokens = tokenize(match[1]);
      interests.push(...tokens);
    }
  }

  if (interests.length === 0) {
    const all = tokenize(prompt);
    const exclusionSet = new Set(exclusions);
    const remaining = all.filter(t => !exclusionSet.has(t));
    interests.push(...remaining);
  }

  return {
    interests: [...new Set(interests)],
    exclusions: [...new Set(exclusions)],
    rawPrompt: prompt,
  };
}

export function tokenize(text: string): string[] {
  const lower = text.toLowerCase();
  const words = lower
    .replace(/[^a-z0-9\s+#]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOPWORDS.has(w));
  return [...new Set(words)];
}
