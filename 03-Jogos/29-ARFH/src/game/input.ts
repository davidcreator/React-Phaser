export type GameAction =
  | 'accelerate'
  | 'brake'
  | 'tiltLeft'
  | 'tiltRight'
  | 'nitro'
  | 'horn'
  | 'fire';

export type KeyBindings = Record<GameAction, string>;

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  accelerate: 'W',
  brake: 'S',
  tiltLeft: 'A',
  tiltRight: 'D',
  nitro: 'Shift',
  horn: 'Space',
  fire: 'J',
};

const activeTouchActions = new Set<GameAction>();

export function setTouchAction(action: GameAction, active: boolean): void {
  if (active) activeTouchActions.add(action);
  else activeTouchActions.delete(action);
}

export function isTouchActionActive(action: GameAction): boolean {
  return activeTouchActions.has(action);
}

export function clearTouchActions(): void {
  activeTouchActions.clear();
}

export function normalizeKeyboardBinding(key: string): string {
  if (key === ' ') return 'Space';
  if (key.length === 1) return key.toUpperCase();
  return key;
}

export function displayKeyboardBinding(key: string): string {
  const labels: Record<string, string> = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Space: 'ESPAÇO',
    Shift: 'SHIFT',
    Enter: 'ENTER',
  };
  return labels[key] ?? key.toUpperCase();
}
