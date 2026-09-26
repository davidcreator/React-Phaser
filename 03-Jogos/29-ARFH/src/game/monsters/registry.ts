import type { MonsterKind } from '../content';

export interface MonsterSpriteSheet {
  key: string;
  url: string;
  frameWidth: 64;
  frameHeight: 64;
  frameCount: 4;
  walkRate: number;
}

/** Separate asset registry so monster art can be swapped without editing RaceScene. */
export const MONSTER_SPRITES: Record<MonsterKind, MonsterSpriteSheet> = {
  walker: {
    key: 'monster-walker',
    url: '/assets/sprites/monsters/errante.png',
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 4,
    walkRate: 5.2,
  },
  runner: {
    key: 'monster-runner',
    url: '/assets/sprites/monsters/corredor.png',
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 4,
    walkRate: 10,
  },
  leaper: {
    key: 'monster-leaper',
    url: '/assets/sprites/monsters/saltador.png',
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 4,
    walkRate: 7.4,
  },
  armored: {
    key: 'monster-armored',
    url: '/assets/sprites/monsters/blindado.png',
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 4,
    walkRate: 3.8,
  },
};
