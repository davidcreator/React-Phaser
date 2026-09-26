import type { MonsterKind, StageDefinition } from './content';

export interface RampLayout { x: number; height: number; used: boolean }
export interface ObstacleLayout { x: number; hit: boolean }
export type PickupKind = 'fuel' | 'scrap' | 'ammo' | 'repair' | 'shield';
export interface PickupLayout { x: number; kind: PickupKind; collected: boolean }
export interface MonsterLayout {
  x: number;
  kind: MonsterKind;
  health: number;
  maxHealth: number;
  defeated: boolean;
  diverted: boolean;
  contacted: boolean;
}
export interface StageLayout {
  ramps: RampLayout[];
  obstacles: ObstacleLayout[];
  pickups: PickupLayout[];
  monsters: MonsterLayout[];
}

const RAMP_HEIGHTS = [94, 106, 88, 112, 96, 118, 91, 108, 95, 116, 89, 111, 97, 119, 92, 110, 96, 104, 91, 116, 101, 114, 99, 108];
const MONSTER_HEALTH: Record<MonsterKind, number> = { walker: 1, runner: 1, leaper: 2, armored: 3 };

function placePickups(stage: StageDefinition, kind: PickupKind, count: number, startOffset: number, endOffset: number, laneOffset: number): PickupLayout[] {
  if (count <= 0) return [];
  const routeStart = 2_000 + startOffset;
  const routeEnd = stage.length - 2_000 - endOffset;
  const spacing = (routeEnd - routeStart) / Math.max(1, count - 1);
  return Array.from({ length: count }, (_, index) => ({
    x: Math.round(routeStart + spacing * index + (index % 2 ? laneOffset : -laneOffset)),
    kind,
    collected: false,
  }));
}

export function createStageLayout(stage: StageDefinition): StageLayout {
  const routeStart = 2_000;
  const routeEnd = stage.length - 3_800;
  const rampSpacing = (routeEnd - routeStart) / Math.max(1, stage.rampCount - 1);
  const ramps = Array.from({ length: stage.rampCount }, (_, index) => ({
    x: Math.round(routeStart + rampSpacing * index),
    height: RAMP_HEIGHTS[(index + stage.code.charCodeAt(1)) % RAMP_HEIGHTS.length],
    used: false,
  }));

  const obstacles = Array.from({ length: stage.obstacleCount }, (_, index) => {
    const rampIndex = Math.min(ramps.length - 1, Math.floor(index * ramps.length / stage.obstacleCount));
    return { x: ramps[rampIndex].x + 470 + (index % 3) * 48, hit: false };
  });

  const pickups = [
    ...placePickups(stage, 'fuel', stage.fuelPickupCount, 0, 0, 0),
    ...placePickups(stage, 'scrap', stage.scrapPickupCount, 1_000, 2_000, 120),
    ...placePickups(stage, 'ammo', stage.ammoPickupCount, 1_600, 1_200, 90),
    ...placePickups(stage, 'repair', stage.repairPickupCount, 800, 1_700, 145),
    ...placePickups(stage, 'shield', stage.shieldPickupCount, 2_200, 2_500, 180),
  ].sort((a, b) => a.x - b.x);

  const monsterIndices = Array.from({ length: stage.monsterCount }, (_, index) =>
    Math.floor(index * (ramps.length - 1) / Math.max(1, stage.monsterCount - 1)),
  );
  const monsters = monsterIndices.map((rampIndex, index) => {
    const kind = stage.monsterOrder[index % stage.monsterOrder.length];
    const maxHealth = MONSTER_HEALTH[kind];
    return {
      x: Math.min(stage.length - 3_200, ramps[rampIndex].x + 1_400 + (index % 3) * 120),
      kind,
      health: maxHealth,
      maxHealth,
      defeated: false,
      diverted: false,
      contacted: false,
    };
  });

  return { ramps, obstacles, pickups, monsters };
}
