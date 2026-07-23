export type RoundEntryOpenType = 'didNotOpen' | 'series' | 'doubles';

export type RoundEntryFinishType =
  | 'normal'
  | 'okey'
  | 'fromHand'
  | 'fromHandAndOkey'
  | 'none';

export type RoundEntryPlayerForm = {
  playerId: string;
  openType: RoundEntryOpenType;
  remainingTilePointsText: string;
  remainingOkeyCount: number;
  wrongOpenCount: number;
  playableTileDiscardCount: number;
  manualPenaltyText: string;
};

export type RoundEntryForm = {
  finisherPlayerId: string | null;
  finishType: RoundEntryFinishType;
  players: RoundEntryPlayerForm[];
};
