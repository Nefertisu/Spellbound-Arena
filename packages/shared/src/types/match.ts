export type MatchMode = '1v1' | '2v2' | '3v3';

export const MATCH_MODES: readonly MatchMode[] = ['1v1', '2v2', '3v3'] as const;

export function playersPerTeam(mode: MatchMode): number {
  switch (mode) {
    case '1v1':
      return 1;
    case '2v2':
      return 2;
    case '3v3':
      return 3;
  }
}

export function matchModeLabel(mode: MatchMode): string {
  return mode.toUpperCase();
}

export type OpponentType = 'bots' | 'players';

export const OPPONENT_TYPES: readonly OpponentType[] = ['bots', 'players'] as const;

export function opponentTypeLabel(type: OpponentType): string {
  switch (type) {
    case 'bots':
      return 'Vs Bots';
    case 'players':
      return 'Vs Players';
  }
}
