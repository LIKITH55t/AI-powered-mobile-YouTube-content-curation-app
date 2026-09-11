import { YouTubeVideo } from '../types';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

let API_KEY = '';

export function setApiKey(key: string) {
  API_KEY = key;
}

export function getApiKey(): string {
  return API_KEY;
}

interface SearchResponse {
  items: Array<{
    id: { videoId: string };
    snippet: {
      title: string;
      description: string;
      channelTitle: string;
      channelId: string;
      publishedAt: string;
      thumbnails: { medium?: { url: string }; default?: { url: string } };
    };
  }>;
  nextPageToken?: string;
}

interface VideoDetailsResponse {
  items: Array<{
    id: string;
    contentDetails: { duration: string };
    statistics: { viewCount: string; likeCount: string };
    snippet: { tags?: string[] };
  }>;
}

export async function searchVideos(
  query: string,
  maxResults = 20,
  pageToken?: string
): Promise<{ videos: YouTubeVideo[]; nextPageToken?: string }> {
  if (!API_KEY) throw new Error('YouTube API key not set');

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: String(maxResults),
    order: 'relevance',
    key: API_KEY,
  });
  if (pageToken) params.set('pageToken', pageToken);

  const res = await fetch(`${BASE_URL}/search?${params}`);
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  const data: SearchResponse = await res.json();

  const videoIds = data.items.map(i => i.id.videoId);
  if (videoIds.length === 0) return { videos: [], nextPageToken: data.nextPageToken };

  const details = await getVideoDetails(videoIds);

  const videos: YouTubeVideo[] = data.items.map(item => {
    const detail = details.find(d => d.id === item.id.videoId);
    return {
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? '',
      publishedAt: item.snippet.publishedAt,
      duration: detail?.contentDetails?.duration ?? 'PT0M',
      viewCount: detail?.statistics?.viewCount ?? '0',
      likeCount: detail?.statistics?.likeCount ?? '0',
      tags: detail?.snippet?.tags ?? [],
    };
  });

  return { videos, nextPageToken: data.nextPageToken };
}

async function getVideoDetails(ids: string[]): Promise<VideoDetailsResponse['items']> {
  if (!API_KEY) return [];

  const params = new URLSearchParams({
    part: 'contentDetails,statistics,snippet',
    id: ids.join(','),
    key: API_KEY,
  });

  const res = await fetch(`${BASE_URL}/videos?${params}`);
  if (!res.ok) return [];
  const data: VideoDetailsResponse = await res.json();
  return data.items || [];
}

export async function getTrending(
  regionCode = 'IN',
  maxResults = 20
): Promise<YouTubeVideo[]> {
  if (!API_KEY) throw new Error('YouTube API key not set');

  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    chart: 'mostPopular',
    regionCode,
    maxResults: String(maxResults),
    key: API_KEY,
  });

  const res = await fetch(`${BASE_URL}/videos?${params}`);
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  const data = await res.json();

  return (data.items || []).map((item: any) => ({
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    channelTitle: item.snippet.channelTitle,
    channelId: item.snippet.channelId,
    thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? '',
    publishedAt: item.snippet.publishedAt,
    duration: item.contentDetails?.duration ?? 'PT0M',
    viewCount: item.statistics?.viewCount ?? '0',
    likeCount: item.statistics?.likeCount ?? '0',
    tags: item.snippet?.tags ?? [],
  }));
}

export function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  const h = parseInt(match[1] || '0');
  const m = parseInt(match[2] || '0');
  const s = parseInt(match[3] || '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatViews(count: string): string {
  const n = parseInt(count);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
