import {
  CalculateRoundResult,
  calculateRound,
} from '../engine/calculateRound';
import { Player, RoundInput } from '../engine/models';
import { DEFAULT_SCORE_RULES, ScoreRules } from '../engine/rules';
import { playersFromActiveGame, TEAM_IDS } from './gameRoster';
import { ActiveGameData } from './screens/ActiveGameScreen';

export function individualTeamIdForPlayer(playerId: string): string {
  return `individual:${playerId}`;
}

export function playerIdFromIndividualTeamId(
  teamId: string | null,
): string | null {
  if (!teamId || !teamId.startsWith('individual:')) {
    return null;
  }
  return teamId.slice('individual:'.length);
}

/** Her oyuncuya benzersiz teamId — partner eşleşmesi olmaz. */
export function buildIndividualEngineRoster(game: ActiveGameData): Player[] {
  return playersFromActiveGame(game).map((player) => ({
    id: player.id,
    name: player.name,
    teamId: individualTeamIdForPlayer(player.id),
  }));
}

/**
 * Tekli el hesabı: mevcut calculateRound + score helper’ları.
 * Partner / takım arkadaşı cezası uygulanmaz.
 */
export function calculateIndividualRound(
  input: RoundInput,
  game: ActiveGameData,
  rules: ScoreRules = DEFAULT_SCORE_RULES,
): CalculateRoundResult {
  const roster = buildIndividualEngineRoster(game);
  return calculateRound(input, rules, roster, { teamStructure: 'any' });
}

/** Önizleme / kayıt için container takım skorları (bonus hariç oyuncu toplamları). */
export function containerTeamScoresFromPlayers(
  result: CalculateRoundResult,
): { teamId: string; score: number }[] {
  const scoreByPlayer = new Map(
    result.players.map((entry) => [entry.playerId, entry.score]),
  );
  const p = (id: string) => scoreByPlayer.get(id) ?? 0;
  return [
    {
      teamId: TEAM_IDS.team1,
      score: p('player-1') + p('player-2'),
    },
    {
      teamId: TEAM_IDS.team2,
      score: p('player-3') + p('player-4'),
    },
  ];
}
