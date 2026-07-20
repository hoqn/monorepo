import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WatchlistEntry, WatchlistStore } from '@hoqn/collectio-core';

const STORAGE_KEY = 'collectio-companion:watchlist';

async function readAll(): Promise<WatchlistEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as WatchlistEntry[];
}

async function writeAll(entries: WatchlistEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export const asyncStorageWatchlistStore: WatchlistStore = {
  async list() {
    return readAll();
  },

  async isWatchlisted(titleId) {
    const entries = await readAll();
    return entries.some((e) => e.titleId === titleId);
  },

  async toggle(titleId) {
    const entries = await readAll();
    const index = entries.findIndex((e) => e.titleId === titleId);
    if (index === -1) {
      entries.push({ titleId, addedAt: new Date().toISOString(), lastOpenedAt: null });
    } else {
      entries.splice(index, 1);
    }
    await writeAll(entries);
  },

  async markOpened(titleId) {
    const entries = await readAll();
    const entry = entries.find((e) => e.titleId === titleId);
    if (entry) {
      entry.lastOpenedAt = new Date().toISOString();
      await writeAll(entries);
    }
  },
};
