import type {
  FetchPlayerRatingRequest,
  FetchPlayerRatingResult,
  PlayerRatingSnapshot,
} from '../types/player-rating.js';

function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getRankTier(rating: number): string {
  if (rating >= 1800) return 'Mythic';
  if (rating >= 1600) return 'Diamond';
  if (rating >= 1400) return 'Platinum';
  if (rating >= 1200) return 'Gold';
  if (rating >= 1000) return 'Silver';
  return 'Bronze';
}

function buildMockRating(userId: string): PlayerRatingSnapshot {
  const seed = hashUserId(userId);
  const matchesPlayed = 24 + (seed % 96);
  const winRateFraction = 0.38 + (seed % 27) / 100;
  const wins = Math.min(matchesPlayed, Math.round(matchesPlayed * winRateFraction));
  const losses = matchesPlayed - wins;
  const rating = 980 + (seed % 820);
  const winRate = matchesPlayed > 0 ? wins / matchesPlayed : 0;

  return {
    userId,
    rating,
    peakRating: rating + 40 + (seed % 120),
    wins,
    losses,
    draws: 0,
    matchesPlayed,
    winRate,
    rankTier: getRankTier(rating),
    seasonId: 'season-1',
    updatedAt: new Date().toISOString(),
  };
}

/** Replace with a real HTTP client when the backend is ready. */
export async function fetchPlayerRating(
  request: FetchPlayerRatingRequest,
): Promise<FetchPlayerRatingResult> {
  await new Promise((resolve) => setTimeout(resolve, 280));

  if (!request.userId) {
    return {
      success: false,
      error: { code: 'invalid_user', message: 'User id is required.' },
    };
  }

  return {
    success: true,
    data: buildMockRating(request.userId),
  };
}

export function formatWinRate(winRate: number, digits = 1): string {
  const clamped = Math.max(0, Math.min(1, winRate));
  return `${(clamped * 100).toFixed(digits)}%`;
}

export function formatRating(rating: number): string {
  return Math.round(rating).toLocaleString('en-US');
}
