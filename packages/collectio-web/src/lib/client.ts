import { MockCollectioClient, type CollectioClient } from '@hoqn/collectio-core';

/**
 * Single place that decides where catalog data comes from. Today it's
 * fixture data; once collectio-scraper produces a real catalog.json, swap
 * this line for a client that reads it (fetch it as a static asset or copy
 * it in at build time) — no page component needs to change.
 */
export const collectioClient: CollectioClient = new MockCollectioClient();
