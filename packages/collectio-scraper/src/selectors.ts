/**
 * CSS selectors for collectio.co.kr's real markup. Every value here is a
 * placeholder — this environment's network policy blocks outbound requests
 * to collectio.co.kr, so these could not be captured or verified in this
 * session.
 *
 * To fill these in:
 *   1. Log into collectio.co.kr in your own browser.
 *   2. Open DevTools → Elements, find the relevant nodes on the login page,
 *      the catalog/listing page, and a title detail page.
 *   3. Replace the empty strings below with real selectors.
 *   4. Re-check robots.txt and the site's terms of service before scraping;
 *      keep request rates low and only use your own logged-in session.
 */
export const selectors = {
  login: {
    idInput: '', // TODO: e.g. 'input[name="userId"]'
    passwordInput: '', // TODO
    submitButton: '', // TODO
  },
  catalog: {
    itemCard: '', // TODO: container for a single title in the listing/grid
    itemLink: '', // TODO: anchor href pointing at the title detail page
    itemPoster: '', // TODO: <img> src for the poster
    itemTitle: '', // TODO
  },
  detail: {
    titleKo: '', // TODO
    titleOriginal: '', // TODO
    synopsis: '', // TODO
    director: '', // TODO
    releaseYear: '', // TODO
    genres: '', // TODO
    runtimeMin: '', // TODO
  },
} as const;
