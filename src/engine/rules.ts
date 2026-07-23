export type ExtraPenaltyTiming =
  | 'beforeFinishMultiplier'
  | 'afterFinishMultiplier';

export type FinisherPartnerPenaltyMode = 'fixed' | 'calculated';

export type OpenBaseRules = {
  didNotOpenPenalty: number;
  seriesTileSumMultiplier: number;
  doublesTileSumMultiplier: number;
};

export type HandExtrasRules = {
  okeyPenalty: number;
  wrongOpenPenalty: number;
  playableTileDiscardPenalty: number;
};

export type FinishTeamBonusRules = {
  normal: number;
  okey: number;
  fromHand: number;
  fromHandAndOkey: number;
};

export type OpponentFinishMultiplierRules = {
  normal: number;
  okey: number;
  fromHand: number;
  fromHandAndOkey: number;
  none: number;
};

export type FinisherPartnerRules = {
  penaltyMode: FinisherPartnerPenaltyMode;
  fixedPenalty: number;
};

export type ScoreRules = {
  openBase: OpenBaseRules;
  handExtras: HandExtrasRules;
  extraPenaltyTiming: ExtraPenaltyTiming;
  finishTeamBonus: FinishTeamBonusRules;
  opponentFinishMultiplier: OpponentFinishMultiplierRules;
  finisherPartner: FinisherPartnerRules;
};

export const DEFAULT_SCORE_RULES: Readonly<ScoreRules> = {
  openBase: {
    didNotOpenPenalty: 202,
    seriesTileSumMultiplier: 1,
    doublesTileSumMultiplier: 2,
  },
  handExtras: {
    okeyPenalty: 101,
    wrongOpenPenalty: 101,
    playableTileDiscardPenalty: 101,
  },
  extraPenaltyTiming: 'beforeFinishMultiplier',
  finishTeamBonus: {
    normal: -101,
    okey: -202,
    fromHand: -202,
    fromHandAndOkey: -404,
  },
  opponentFinishMultiplier: {
    normal: 1,
    okey: 2,
    fromHand: 2,
    fromHandAndOkey: 4,
    none: 1,
  },
  finisherPartner: {
    penaltyMode: 'fixed',
    fixedPenalty: 0,
  },
};
