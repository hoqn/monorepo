import { MockCollectioClient, type CollectioClient } from '@hoqn/collectio-core';

/**
 * Single place that decides where catalog data comes from. Today it's
 * fixture data; once collectio-scraper produces a real catalog.json, swap
 * this line for a client that reads it — no screen needs to change.
 */
export const collectioClient: CollectioClient = new MockCollectioClient();
