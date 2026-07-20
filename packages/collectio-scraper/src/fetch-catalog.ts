import type { Page } from 'playwright';
import type { Title } from '@hoqn/collectio-core';
import { selectors } from './selectors.ts';

/**
 * Scrapes the catalog listing from an authenticated page. Requires
 * selectors.catalog.* and selectors.detail.* to be filled in first.
 */
export async function fetchCatalog(page: Page): Promise<Title[]> {
  if (!selectors.catalog.itemCard || !selectors.catalog.itemLink) {
    throw new Error(
      'selectors.catalog.* is not filled in yet. Capture the real catalog page selectors from ' +
        'collectio.co.kr in your own browser and update selectors.ts before running this.',
    );
  }

  // TODO: implement once selectors are known, roughly:
  //   await page.goto('https://collectio.co.kr/...catalog url...');
  //   const cards = await page.$$(selectors.catalog.itemCard);
  //   for (const card of cards) { ... read itemLink/itemPoster/itemTitle, follow to
  //     the detail page and read selectors.detail.* fields ... }
  throw new Error('fetchCatalog: not implemented — fill in selectors.ts and this function together.');
}
