import { Player } from '../models';

export function requireTeamId(roster: Player[], playerId: string): string {
  const player = roster.find((entry) => entry.id === playerId);
  if (!player) {
    throw new Error(`Player "${playerId}" is not in the roster.`);
  }
  if (!player.teamId) {
    throw new Error(`Player "${playerId}" is missing a teamId.`);
  }
  return player.teamId;
}
