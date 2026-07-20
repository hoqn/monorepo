import type { CollectioClient } from './client.ts';
import type { Title } from '../types.ts';
import fixture from './fixtures/titles.sample.json' with { type: 'json' };

const titles = fixture.titles as Title[];

/**
 * Development stand-in for CollectioClient. Serves fixture data so the
 * web/RN apps are usable before the real scraper (collectio-scraper) is
 * wired up. Swap this out for a client backed by the scraper's JSON
 * cache once selectors.ts is filled in — no other app code needs to change.
 */
export class MockCollectioClient implements CollectioClient {
  async fetchCatalog(): Promise<Title[]> {
    return titles;
  }

  async fetchTitleDetail(id: string): Promise<Title> {
    const title = titles.find((t) => t.id === id);
    if (!title) {
      throw new Error(`Unknown title id: ${id}`);
    }
    return title;
  }
}
