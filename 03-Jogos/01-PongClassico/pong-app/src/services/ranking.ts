/**
 * Ranking persistido em localStorage — top 10 por pontuação.
 * Regras de ordenação: maior score primeiro; empate → partida mais antiga.
 */

import type { Difficulty, ModeId } from '../types';
import { lsGet, lsSet } from './storage';

export interface RankEntry {
  id: string;
  name: string;
  score: number;
  goals: number;
  hits: number;
  mode: ModeId;
  difficulty: Difficulty;
  lives: number;
  /** ISO date */
  date: string;
}

const KEY = 'pong-ranking-v1';
const MAX_ENTRIES = 10;

function isValidEntry(value: unknown): value is RankEntry {
  if (!value || typeof value !== 'object') return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.name === 'string' &&
    typeof e.score === 'number' &&
    typeof e.goals === 'number' &&
    typeof e.hits === 'number' &&
    typeof e.mode === 'string' &&
    typeof e.difficulty === 'string' &&
    typeof e.lives === 'number' &&
    typeof e.date === 'string'
  );
}

function sortEntries(entries: RankEntry[]): RankEntry[] {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.date.localeCompare(b.date);
  });
}

export function getRanking(): RankEntry[] {
  const raw = lsGet(KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortEntries(parsed.filter(isValidEntry)).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

/** Insere a entrada e devolve a posição no ranking (-1 se ficou fora do top 10). */
export function addEntry(entry: Omit<RankEntry, 'id'>): { rank: number; ranking: RankEntry[] } {
  const full: RankEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
  const ranking = sortEntries([...getRanking(), full]).slice(0, MAX_ENTRIES);
  lsSet(KEY, JSON.stringify(ranking));
  const index = ranking.findIndex((e) => e.id === full.id);
  return { rank: index >= 0 ? index + 1 : -1, ranking };
}

export function clearRanking(): void {
  lsSet(KEY, '[]');
}
