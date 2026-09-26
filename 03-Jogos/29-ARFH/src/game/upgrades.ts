export type UpgradeId = 'engine' | 'tires' | 'suspension' | 'tank' | 'bumper' | 'weapon';

export interface UpgradeLevels {
  engine: number;
  tires: number;
  suspension: number;
  tank: number;
  bumper: number;
  weapon: number;
}

export interface UpgradeDefinition {
  id: UpgradeId;
  code: string;
  name: string;
  detail: string;
  costs: [number, number, number];
}

export const MAX_UPGRADE_LEVEL = 3;

export const DEFAULT_UPGRADES: UpgradeLevels = {
  engine: 0,
  tires: 0,
  suspension: 0,
  tank: 0,
  bumper: 0,
  weapon: 0,
};

export const UPGRADE_DEFINITIONS: UpgradeDefinition[] = [
  { id: 'engine', code: '01', name: 'MOTOR REFORÇADO', detail: 'Mais aceleração e velocidade de cruzeiro.', costs: [85, 130, 180] },
  { id: 'tires', code: '02', name: 'PNEUS DE TRILHA', detail: 'Menos perda de velocidade em terreno solto.', costs: [70, 110, 155] },
  { id: 'suspension', code: '03', name: 'SUSPENSÃO ELEVADA', detail: 'Mais controle no ar e pousos mais seguros.', costs: [75, 115, 160] },
  { id: 'tank', code: '04', name: 'TANQUE ESTENDIDO', detail: 'Aumenta a reserva de combustível da rota.', costs: [80, 125, 170] },
  { id: 'bumper', code: '05', name: 'PARA-CHOQUE REFORÇADO', detail: 'Reduz danos e perda de velocidade nos impactos.', costs: [70, 110, 155] },
  { id: 'weapon', code: '06', name: 'ARMAMENTO CALIBRADO', detail: 'Mais dano, cadência e capacidade de munição.', costs: [95, 145, 200] },
];

export function getUpgradeCost(id: UpgradeId, currentLevel: number): number | null {
  return UPGRADE_DEFINITIONS.find((upgrade) => upgrade.id === id)?.costs[currentLevel] ?? null;
}

export function sanitizeUpgradeLevels(value: unknown): UpgradeLevels {
  const saved = value && typeof value === 'object' ? value as Partial<Record<UpgradeId, unknown>> : {};
  const getLevel = (key: UpgradeId) => {
    const level = saved[key];
    return typeof level === 'number' && Number.isFinite(level)
      ? Math.max(0, Math.min(MAX_UPGRADE_LEVEL, Math.floor(level)))
      : 0;
  };

  return {
    engine: getLevel('engine'),
    tires: getLevel('tires'),
    suspension: getLevel('suspension'),
    tank: getLevel('tank'),
    bumper: getLevel('bumper'),
    weapon: getLevel('weapon'),
  };
}
