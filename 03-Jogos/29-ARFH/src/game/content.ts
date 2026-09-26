export type StageId = 'posto-7' | 'viaduto-caido' | 'patio-sucata' | 'saida-anel';
export type CarId = 'fagulha' | 'corisco' | 'vaga-lume' | 'aurora';
export type MonsterKind = 'walker' | 'runner' | 'leaper' | 'armored';
export type EnvironmentTheme = 'urban' | 'bridge' | 'quarry' | 'greenbelt';

export interface StagePalette {
  sky: number;
  distant: number;
  near: number;
  silhouettes: number;
  ground: number;
  asphalt: number;
  marking: number;
  ramp: number;
}

export interface StageDefinition {
  id: StageId;
  code: string;
  name: string;
  shortName: string;
  region: string;
  regionCode: string;
  objective: string;
  length: number;
  rampCount: number;
  obstacleCount: number;
  fuelPickupCount: number;
  scrapPickupCount: number;
  ammoPickupCount: number;
  repairPickupCount: number;
  shieldPickupCount: number;
  monsterCount: number;
  fuelBurnMultiplier: number;
  roughness: number;
  theme: EnvironmentTheme;
  palette: StagePalette;
  monsterOrder: MonsterKind[];
}

export interface CarDefinition {
  id: CarId;
  code: string;
  name: string;
  category: string;
  description: string;
  role: string;
  unlockAfterCompletedMissions: number;
  acceleration: number;
  topSpeed: number;
  fuelCapacity: number;
  rollingLoss: number;
  airControl: number;
  landingTolerance: number;
  armor: number;
  fuelBurnMultiplier: number;
  bodyStyle: 'pickup' | 'van' | 'buggy' | 'rescue';
  paint: number;
  glass: number;
  trim: number;
}

export const MONSTER_ORDER: MonsterKind[] = ['walker', 'runner', 'leaper', 'armored'];

export const STAGES: StageDefinition[] = [
  {
    id: 'posto-7', code: '01', name: 'Posto 7', shortName: 'POSTO 7', region: 'Anel Velho', regionCode: 'ANEL / 01',
    objective: 'Travessia longa · 2–4 min', length: 68000, rampCount: 21, obstacleCount: 20,
    fuelPickupCount: 9, scrapPickupCount: 12, ammoPickupCount: 6, repairPickupCount: 4, shieldPickupCount: 3, monsterCount: 12, fuelBurnMultiplier: 1, roughness: 1,
    theme: 'urban',
    palette: { sky: 0xb6d2c1, distant: 0x829f8e, near: 0x9aab7d, silhouettes: 0x536d53, ground: 0x4d5a45, asphalt: 0x414948, marking: 0xe4d9a4, ramp: 0xc97d36 },
    monsterOrder: ['walker', 'runner', 'leaper', 'armored'],
  },
  {
    id: 'viaduto-caido', code: '02', name: 'Viaduto Caído', shortName: 'VIADUTO CAÍDO', region: 'Anel Velho', regionCode: 'ANEL / 02',
    objective: 'Travessia 2–4 min · vãos quebrados e saltos longos', length: 72000, rampCount: 22, obstacleCount: 21,
    fuelPickupCount: 10, scrapPickupCount: 13, ammoPickupCount: 6, repairPickupCount: 4, shieldPickupCount: 3, monsterCount: 12, fuelBurnMultiplier: 1.03, roughness: 1.14,
    theme: 'bridge',
    palette: { sky: 0xaebeba, distant: 0x788982, near: 0x66766d, silhouettes: 0x43524e, ground: 0x4a554e, asphalt: 0x343d3d, marking: 0xd8cfae, ramp: 0xc77a3a },
    monsterOrder: ['runner', 'leaper', 'walker', 'armored'],
  },
  {
    id: 'patio-sucata', code: '03', name: 'Pátio de Sucata', shortName: 'PÁTIO DE SUCATA', region: 'Pedreira Clara', regionCode: 'PEDREIRA / 01',
    objective: 'Travessia 2–4 min · terreno irregular e mais sucata', length: 76000, rampCount: 23, obstacleCount: 22,
    fuelPickupCount: 10, scrapPickupCount: 15, ammoPickupCount: 7, repairPickupCount: 4, shieldPickupCount: 3, monsterCount: 12, fuelBurnMultiplier: 1.08, roughness: 1.32,
    theme: 'quarry',
    palette: { sky: 0xc9bb97, distant: 0x9b895e, near: 0x82734f, silhouettes: 0x5a5340, ground: 0x655b42, asphalt: 0x454543, marking: 0xe3c77d, ramp: 0xd18b3c },
    monsterOrder: ['armored', 'walker', 'runner', 'leaper'],
  },
  {
    id: 'saida-anel', code: '04', name: 'Saída do Anel', shortName: 'SAÍDA DO ANEL', region: 'Cinturão Verde', regionCode: 'CINTURÃO / 01',
    objective: 'Travessia 2–4 min · neblina densa e evacuação', length: 82000, rampCount: 24, obstacleCount: 23,
    fuelPickupCount: 11, scrapPickupCount: 16, ammoPickupCount: 7, repairPickupCount: 5, shieldPickupCount: 4, monsterCount: 12, fuelBurnMultiplier: 1.12, roughness: 1.2,
    theme: 'greenbelt',
    palette: { sky: 0x96b4a4, distant: 0x5e7a67, near: 0x4d6c50, silhouettes: 0x354f40, ground: 0x435b44, asphalt: 0x394442, marking: 0xd2d6a2, ramp: 0xb7753c },
    monsterOrder: ['leaper', 'runner', 'armored', 'walker'],
  },
];

export const CARS: CarDefinition[] = [
  {
    id: 'fagulha', code: 'F-01', name: 'Fagulha', category: 'PICAPE DE RESGATE',
    description: 'Picape equilibrada para aprender a rota e fazer os primeiros upgrades.',
    role: 'Equilibrada', unlockAfterCompletedMissions: 0,
    acceleration: 360, topSpeed: 510, fuelCapacity: 100, rollingLoss: 0.2, airControl: 7.2,
    landingTolerance: 0.78, armor: 0, fuelBurnMultiplier: 1, bodyStyle: 'pickup', paint: 0xe5a03d, glass: 0x79a99a, trim: 0x2a3430,
  },
  {
    id: 'corisco', code: 'C-02', name: 'Corisco', category: 'FURGÃO DE OFICINA',
    description: 'Mais reserva e estabilidade para cruzar trechos longos; perde velocidade máxima.',
    role: 'Autonomia', unlockAfterCompletedMissions: 1,
    acceleration: 330, topSpeed: 480, fuelCapacity: 145, rollingLoss: 0.18, airControl: 6.8,
    landingTolerance: 0.94, armor: 0.16, fuelBurnMultiplier: 0.9, bodyStyle: 'van', paint: 0x6c9e8c, glass: 0x9ec4b4, trim: 0x293631,
  },
  {
    id: 'vaga-lume', code: 'V-03', name: 'Vaga-Lume', category: 'BUGGY DE TRILHA',
    description: 'Ágil e excelente no ar, mas tem tanque menor e pouca proteção mecânica.',
    role: 'Manobras', unlockAfterCompletedMissions: 2,
    acceleration: 405, topSpeed: 555, fuelCapacity: 88, rollingLoss: 0.17, airControl: 8.6,
    landingTolerance: 0.7, armor: 0, fuelBurnMultiplier: 1.08, bodyStyle: 'buggy', paint: 0xc96843, glass: 0x94bba7, trim: 0x292f2c,
  },
  {
    id: 'aurora', code: 'A-04', name: 'Aurora', category: 'CAMINHÃO DE RESGATE',
    description: 'Pesado, resistente e com grande tanque; precisa de mais espaço para acelerar.',
    role: 'Resistência', unlockAfterCompletedMissions: 3,
    acceleration: 300, topSpeed: 455, fuelCapacity: 165, rollingLoss: 0.22, airControl: 6.2,
    landingTolerance: 1.04, armor: 0.32, fuelBurnMultiplier: 0.94, bodyStyle: 'rescue', paint: 0xd5b05a, glass: 0x89aa9c, trim: 0x303b36,
  },
];

export const DEFAULT_STAGE_ID: StageId = STAGES[0].id;
export const DEFAULT_CAR_ID: CarId = CARS[0].id;

export function getStage(id: StageId): StageDefinition {
  return STAGES.find((stage) => stage.id === id) ?? STAGES[0];
}

export function getCar(id: CarId): CarDefinition {
  return CARS.find((car) => car.id === id) ?? CARS[0];
}

export function nextStageId(id: StageId): StageId | null {
  const index = STAGES.findIndex((stage) => stage.id === id);
  return STAGES[index + 1]?.id ?? null;
}

export function isStageUnlocked(id: StageId, completedStageIds: readonly StageId[]): boolean {
  const index = STAGES.findIndex((stage) => stage.id === id);
  return index >= 0 && (index === 0 || completedStageIds.includes(STAGES[index - 1].id));
}

export function getSuggestedStageId(completedStageIds: readonly StageId[]): StageId {
  return STAGES.find((stage) => isStageUnlocked(stage.id, completedStageIds) && !completedStageIds.includes(stage.id))?.id
    ?? STAGES[STAGES.length - 1].id;
}

export function isCarUnlocked(id: CarId, completedMissions: number): boolean {
  return completedMissions >= getCar(id).unlockAfterCompletedMissions;
}

export function sanitizeStageIds(value: unknown): StageId[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is StageId => typeof id === 'string' && STAGES.some((stage) => stage.id === id)))];
}

export function sanitizeCarId(value: unknown): CarId {
  return typeof value === 'string' && CARS.some((car) => car.id === value) ? value as CarId : DEFAULT_CAR_ID;
}
