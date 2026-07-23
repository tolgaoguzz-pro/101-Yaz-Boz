import { RoundEntryFinishType } from './types';

export const FINISH_TYPE_LABELS: Record<RoundEntryFinishType, string> = {
  normal: 'Normal',
  okey: 'Okey',
  fromHand: 'Elden',
  fromHandAndOkey: 'Elden Okey',
  none: 'Bitmedi',
};

export const FINISH_OPTIONS: {
  value: RoundEntryFinishType;
  label: string;
}[] = [
  { value: 'normal', label: FINISH_TYPE_LABELS.normal },
  { value: 'fromHand', label: FINISH_TYPE_LABELS.fromHand },
  { value: 'okey', label: FINISH_TYPE_LABELS.okey },
  { value: 'fromHandAndOkey', label: FINISH_TYPE_LABELS.fromHandAndOkey },
  { value: 'none', label: FINISH_TYPE_LABELS.none },
];

export function finishTypeLabel(finishType: RoundEntryFinishType): string {
  return FINISH_TYPE_LABELS[finishType] ?? finishType;
}
