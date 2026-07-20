export interface Title {
  id: string;
  titleKo: string;
  titleOriginal: string;
  posterUrl: string;
  synopsis: string;
  director: string;
  releaseYear: number;
  genres: string[];
  runtimeMin: number;
  /** Deep link back to the official collectio.co.kr page for this title. Playback always happens there. */
  officialUrl: string;
}

export interface WatchlistEntry {
  titleId: string;
  addedAt: string;
  lastOpenedAt: string | null;
}

export interface NewReleaseDiff {
  added: Title[];
  removed: Title[];
}
