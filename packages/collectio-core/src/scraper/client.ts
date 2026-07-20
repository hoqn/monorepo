import type { Title } from '../types.ts';

/**
 * Read-only catalog access. Login/session handling is the concern of
 * @hoqn/collectio-scraper, not this interface — apps only ever consume
 * a resolved list of Titles, whether that's mock data today or a real
 * scraped JSON cache later.
 */
export interface CollectioClient {
  fetchCatalog(): Promise<Title[]>;
  fetchTitleDetail(id: string): Promise<Title>;
}
