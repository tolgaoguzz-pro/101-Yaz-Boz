import {
  CalculateRoundResult,
  calculateRound,
} from '../../engine/calculateRound';
import { DEFAULT_SCORE_RULES } from '../../engine/rules';
import { RoundSaveMeta } from '../applyGameUpdates';
import { resolveGameMode } from '../gameMode';
import { buildRosterFromActiveGame } from '../gameRoster';
import { calculateIndividualRound } from '../individualRound';
import { ActiveGameData } from '../screens/ActiveGameScreen';
import { buildRoundInputFromForm } from './buildRoundInput';
import { RoundEntryForm } from './types';

export type RoundComputeSuccess = {
  ok: true;
  result: CalculateRoundResult;
  meta: RoundSaveMeta;
};

export type RoundComputeFailure = {
  ok: false;
  error: string;
};

export type RoundComputeOutcome = RoundComputeSuccess | RoundComputeFailure;

/**
 * Form → engine hesabı. Önizle ve doğrudan kaydet aynı pipeline’ı kullanır.
 */
export function computeRoundFromForm(
  form: RoundEntryForm,
  game: ActiveGameData,
): RoundComputeOutcome {
  try {
    const roundInput = buildRoundInputFromForm(
      form,
      `round-${game.roundNumber}`,
    );
    const isIndividual = resolveGameMode(game.gameMode) === 'individual';
    const result = isIndividual
      ? calculateIndividualRound(roundInput, game, DEFAULT_SCORE_RULES)
      : calculateRound(
          roundInput,
          DEFAULT_SCORE_RULES,
          buildRosterFromActiveGame(game),
        );
    return {
      ok: true,
      result,
      meta: {
        finishType: form.finishType,
        finisherPlayerId: form.finisherPlayerId,
      },
    };
  } catch (caught) {
    return {
      ok: false,
      error:
        caught instanceof Error
          ? caught.message
          : 'El hesaplanırken bir hata oluştu.',
    };
  }
}
