import type { StageId } from '../content';

export interface StageTilesetAsset {
  key: string;
  url: string;
  frameWidth: 32;
  frameHeight: 32;
  frameCount: 48;
  /** Large scenery/landmark tile IDs used by the race background layer. */
  backdropFrames: readonly number[];
}

/**
 * Independent runtime registry for the editable Tiled atlases in
 * public/assets/tilesets/stages/<stageId>/. Stable tile IDs are shared across
 * the four themes; the pixels and landmarks are phase-specific.
 */
export const STAGE_TILESETS: Record<StageId, StageTilesetAsset> = {
  'posto-7': {
    key: 'tileset-posto-7',
    url: '/assets/tilesets/stages/posto-7/tileset.png',
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 48,
    backdropFrames: [32, 35, 33, 37, 34, 38, 36, 39],
  },
  'viaduto-caido': {
    key: 'tileset-viaduto-caido',
    url: '/assets/tilesets/stages/viaduto-caido/tileset.png',
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 48,
    backdropFrames: [33, 36, 32, 35, 37, 34, 39, 38],
  },
  'patio-sucata': {
    key: 'tileset-patio-sucata',
    url: '/assets/tilesets/stages/patio-sucata/tileset.png',
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 48,
    backdropFrames: [34, 32, 37, 36, 33, 38, 35, 39],
  },
  'saida-anel': {
    key: 'tileset-saida-anel',
    url: '/assets/tilesets/stages/saida-anel/tileset.png',
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 48,
    backdropFrames: [35, 34, 32, 33, 37, 36, 38, 39],
  },
};
