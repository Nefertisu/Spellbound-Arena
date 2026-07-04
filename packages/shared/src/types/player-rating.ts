/** Player rating payload expected from the backend API. */
export interface PlayerRatingSnapshot {
  userId: string;
  rating: number;
  peakRating?: number;
  wins: number;
  losses: number;
  draws?: number;
  matchesPlayed: number;
  /** Win rate as a fraction from 0 to 1. */
  winRate: number;
  rankTier?: string;
  seasonId?: string;
  updatedAt: string;
}

export interface FetchPlayerRatingRequest {
  userId: string;
  token?: string;
}

export type FetchPlayerRatingResult =
  | { success: true; data: PlayerRatingSnapshot }
  | { success: false; error: { code: string; message: string } };
