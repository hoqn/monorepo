import type { WatchlistEntry, WatchlistStore } from '@hoqn/collectio-core';

const STORAGE_KEY = 'collectio-companion:watchlist';

function readAll(): WatchlistEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as WatchlistEntry[];
}

function writeAll(entries: WatchlistEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export const localWatchlistStore: WatchlistStore = {
  async list() {
    return readAll();
  },

  async isWatchlisted(titleId) {
    return readAll().some((e) => e.titleId === titleId);
  },

  async toggle(titleId) {
    const entries = readAll();
    const index = entries.findIndex((e) => e.titleId === titleId);
    if (index === -1) {
      entries.push({ titleId, addedAt: new Date().toISOString(), lastOpenedAt: null });
    } else {
      entries.splice(index, 1);
    }
    writeAll(entries);
  },

  async markOpened(titleId) {
    const entries = readAll();
    const entry = entries.find((e) => e.titleId === titleId);
    if (entry) {
      entry.lastOpenedAt = new Date().toISOString();
      writeAll(entries);
    }
  },
};
