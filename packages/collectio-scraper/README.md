# @hoqn/collectio-scraper

Personal-use scraper that logs into your own collectio.co.kr account and
produces a `Title[]` JSON cache for `collectio-web` / `collectio-app` to
read. collectio.co.kr has no public API, so this exists to fill that gap —
for your own account only, never for redistribution.

## Status

Everything here is a stub. This package's outbound network access could not
be exercised or verified in the environment it was scaffolded in (the sandbox's
network policy blocks requests to collectio.co.kr), so `login.ts` and
`fetch-catalog.ts` throw until you fill in `selectors.ts` and the URLs marked
`TODO` in `login.ts`.

## Wiring it up for real

1. Copy `.env.example` to `.env` and fill in your own collectio.co.kr
   credentials. Never commit `.env`.
2. In your own browser, log into collectio.co.kr and open DevTools:
   - Check `https://collectio.co.kr/robots.txt` and the site's terms of
     service before scraping anything.
   - Capture the login form's field/button selectors → `selectors.login`.
   - Capture the catalog/listing page's item card, link, poster, and title
     selectors → `selectors.catalog`.
   - Capture a title detail page's fields (synopsis, director, year, genres,
     runtime) → `selectors.detail`.
3. Fill in `selectors.ts` with what you captured.
4. Implement the body of `fetchCatalog` in `fetch-catalog.ts` using those
   selectors (iterate catalog cards, visit each detail page, map to `Title`).
5. Run `pnpm --filter @hoqn/collectio-scraper scrape`. It writes
   `data/catalog.json` (gitignored) and logs any newly-added titles via
   `onNewReleases` in `cli.ts`.
6. Point `collectio-web` / `collectio-app` at `data/catalog.json` instead of
   `MockCollectioClient` — see each app's `src/lib/client.ts`.

## Ground rules

- Personal account, personal use only. Don't scrape on behalf of anyone else.
- Keep request rates low — this is one person browsing, not a crawler.
- Never attempt to capture, download, or re-host actual video streams.
  Playback always happens on collectio.co.kr itself via `officialUrl`.
- Don't publish or redistribute the scraped catalog data.
