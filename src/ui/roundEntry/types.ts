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
};

export type RoundEntryForm = {
  finisherPlayerId: string | null;
  finishType: RoundEntryFinishType;
  players: RoundEntryPlayerForm[];
};
