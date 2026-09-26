import type { CarId, StageId } from './content';
import type { UpgradeLevels } from './upgrades';

export type RaceOutcome = 'success' | 'failure';

export interface RaceResult {
  stageId: StageId;
  carId: CarId;
  outcome: RaceOutcome;
  failureReason?: string;
  elapsedSeconds: number;
  scrap: number;
  fuelPercent: number;
  conditionPercent: number;
  score: number;
  monsterKills: number;
  jumps: number;
  tricks: number;
  distancePercent: number;
}

export interface RaceCallbacks {
  onComplete: (result: RaceResult) => void;
}

