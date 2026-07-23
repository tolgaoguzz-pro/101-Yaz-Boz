export type PlayerRoundScore = {
  playerId: string;
  score: number;
};

export type TeamRoundScore = {
  teamId: string;
  score: number;
};

export type FinishTeamBonusResult = {
  teamId: string | null;
  amount: number;
};

export type CalculateRoundResult = {
  players: PlayerRoundScore[];
  teams: TeamRoundScore[];
  finishTeamBonus: FinishTeamBonusResult;
};
