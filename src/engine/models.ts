export type OpenType = 'didNotOpen' | 'series' | 'doubles';

export type FinishType =
  | 'normal'
  | 'okey'
  | 'fromHand'
  | 'fromHandAndOkey'
  | 'none';

export type Player = {
  id: string;
  name: string;
  teamId: string;
};

export type Team = {
  id: string;
  name: string;
  playerIds: string[];
};

export type PlayerRoundInput = {
  playerId: string;
  openType: OpenType;
  remainingTilePoints: number;
  remainingOkeyCount: number;
  wrongOpenCount: number;
  playableTileDiscardCount: number;
  manualPenalty: number;
};

export type RoundFinish = {
  finisherPlayerId: string | null;
  finishType: FinishType;
};

export type RoundInput = {
  id: string;
  players: PlayerRoundInput[];
  finish: RoundFinish;
};

export type Game = {
  id: string;
  createdAt: string;
  teams: Team[];
  players: Player[];
  rounds: RoundInput[];
};
