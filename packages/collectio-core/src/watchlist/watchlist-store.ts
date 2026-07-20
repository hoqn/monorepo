import type { WatchlistEntry } from '../types.ts';

/**
 * Storage-agnostic personal watchlist. Each app supplies its own
 * implementation (web: localStorage, RN: AsyncStorage) since collectio
 * has no account API we can sync watch state through.
 */
export interface WatchlistStore {
  list(): Promise<WatchlistEntry[]>;
  isWatchlisted(titleId: string): Promise<boolean>;
  toggle(titleId: string): Promise<void>;
  markOpened(titleId: string): Promise<void>;
}
