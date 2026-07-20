import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import type { Title } from '@hoqn/collectio-core';
import { login } from './login.ts';
import { fetchCatalog } from './fetch-catalog.ts';
import { diffCatalogs } from './diff.ts';

const CACHE_PATH = new URL('../data/catalog.json', import.meta.url);

/** Extension point: wire this up to whatever notification channel you want (ntfy, Telegram, email, ...). */
function onNewReleases(added: Title[]): void {
  if (added.length === 0) return;
  console.log(`New on collectio: ${added.map((t) => t.titleKo).join(', ')}`);
}

async function readCache(): Promise<Title[]> {
  try {
    const raw = await readFile(CACHE_PATH, 'utf8');
    return JSON.parse(raw) as Title[];
  } catch {
    return [];
  }
}

async function main() {
  const id = process.env.COLLECTIO_ID;
  const password = process.env.COLLECTIO_PW;
  if (!id || !password) {
    throw new Error('Set COLLECTIO_ID and COLLECTIO_PW (see .env.example) before running the scraper.');
  }

  const previous = await readCache();

  const browser = await chromium.launch();
  try {
    const page = await login(browser, { id, password });
    const current = await fetchCatalog(page);

    await writeFile(CACHE_PATH, JSON.stringify(current, null, 2), 'utf8');

    const { added } = diffCatalogs(previous, current);
    onNewReleases(added);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
