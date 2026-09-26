import Phaser from 'phaser';
import { DEFAULT_CAR_ID, DEFAULT_STAGE_ID, getCar, getStage, type CarId, type StageId } from './content';
import { DEFAULT_KEY_BINDINGS, type KeyBindings } from './input';
import { RaceScene } from './scenes/RaceScene';
import type { RaceCallbacks } from './types';
import { DEFAULT_UPGRADES, type UpgradeLevels } from './upgrades';

export function createRaceGame(
  parent: HTMLElement,
  callbacks: RaceCallbacks,
  bindings: KeyBindings = DEFAULT_KEY_BINDINGS,
  upgrades: UpgradeLevels = DEFAULT_UPGRADES,
  stageId: StageId = DEFAULT_STAGE_ID,
  carId: CarId = DEFAULT_CAR_ID,
): Phaser.Game {
  const stage = getStage(stageId);
  const vehicle = getCar(carId);

  class BoundRaceScene extends RaceScene {
    constructor() {
      super(callbacks, bindings, upgrades, stage, vehicle);
    }
  }

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1280,
    height: 720,
    backgroundColor: '#b9d6c5',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720,
    },
    input: {
      activePointers: 3,
    },
    render: {
      antialias: true,
      roundPixels: true,
      pixelArt: false,
    },
    scene: [BoundRaceScene],
  });
}
