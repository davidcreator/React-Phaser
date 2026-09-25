/**
 * Acesso seguro a localStorage (com fallback em memória).
 * O preview do Arena pode rodar em contextos com storage restrito —
 * o jogo nunca deve quebrar por indisponibilidade do localStorage.
 */

const memory = new Map<string, string>();

export function lsGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

export function lsSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    memory.set(key, value);
  }
}
