import {
  RoundEntryFinishType,
  RoundEntryForm,
  RoundEntryPlayerForm,
} from './types';

export function isHandStyleFinish(finishType: RoundEntryFinishType): boolean {
  return finishType === 'fromHand' || finishType === 'fromHandAndOkey';
}

export function isTableFinish(finishType: RoundEntryFinishType): boolean {
  return finishType === 'normal' || finishType === 'okey';
}

export type PlayerCardMode = {
  showOpenedChoice: boolean;
  showSeriesDoubles: boolean;
  showRemainingTiles: boolean;
};

/** Giriş kartı gösterilecek oyuncular (bitiren hariç). */
export function getVisiblePlayerIds(form: RoundEntryForm): string[] {
  if (form.finisherPlayerId === null || form.finishType === 'none') {
    return form.players.map((player) => player.playerId);
  }

  return form.players
    .map((player) => player.playerId)
    .filter((playerId) => playerId !== form.finisherPlayerId);
}

export function shouldShowPlayerEntryCards(form: RoundEntryForm): boolean {
  if (form.finisherPlayerId === null || form.finishType === 'none') {
    return true;
  }

  if (isHandStyleFinish(form.finishType)) {
    return false;
  }

  return isTableFinish(form.finishType);
}

export function getPlayerCardMode(
  form: RoundEntryForm,
  playerId: string,
): PlayerCardMode {
  const player = form.players.find((entry) => entry.playerId === playerId);
  const nobodyFinished =
    form.finisherPlayerId === null || form.finishType === 'none';

  if (nobodyFinished) {
    return {
      showOpenedChoice: false,
      showSeriesDoubles: false,
      showRemainingTiles: true,
    };
  }

  if (isHandStyleFinish(form.finishType)) {
    return {
      showOpenedChoice: false,
      showSeriesDoubles: false,
      showRemainingTiles: false,
    };
  }

  const opened = player !== undefined && player.openType !== 'didNotOpen';

  return {
    showOpenedChoice: true,
    showSeriesDoubles: opened,
    showRemainingTiles: opened,
  };
}

export function applyImpliedOpenTypes(form: RoundEntryForm): RoundEntryForm {
  const nobodyFinished =
    form.finisherPlayerId === null || form.finishType === 'none';

  return {
    ...form,
    players: form.players.map((player) =>
      implyPlayerOpenType(form, player, nobodyFinished),
    ),
  };
}

function implyPlayerOpenType(
  form: RoundEntryForm,
  player: RoundEntryPlayerForm,
  nobodyFinished: boolean,
): RoundEntryPlayerForm {
  const isFinisher =
    form.finisherPlayerId !== null && form.finisherPlayerId === player.playerId;

  if (nobodyFinished) {
    return {
      ...player,
      openType: 'series',
    };
  }

  if (isFinisher) {
    return {
      ...player,
      openType: 'series',
      remainingTilePointsText: '0',
    };
  }

  if (isHandStyleFinish(form.finishType)) {
    return {
      ...player,
      openType: 'didNotOpen',
      remainingTilePointsText: '0',
    };
  }

  if (player.openType === 'didNotOpen') {
    return {
      ...player,
      remainingTilePointsText: '0',
    };
  }

  return player;
}
