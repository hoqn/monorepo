import type { Browser, Page } from 'playwright';
import { selectors } from './selectors.ts';

export interface LoginCredentials {
  id: string;
  password: string;
}

/**
 * Logs into collectio.co.kr with a real browser session and returns the
 * page for subsequent scraping. Requires selectors.login.* to be filled in
 * first — see selectors.ts for how to capture them.
 */
export async function login(browser: Browser, credentials: LoginCredentials): Promise<Page> {
  if (!selectors.login.idInput || !selectors.login.passwordInput || !selectors.login.submitButton) {
    throw new Error(
      'selectors.login.* is not filled in yet. Capture the real login form selectors from ' +
        'collectio.co.kr in your own browser and update selectors.ts before running this.',
    );
  }

  const page = await browser.newPage();
  // TODO: verify this is the real login URL — guessed from search results
  // (site uses /user/*.jsp paths), never actually loaded in this session.
  await page.goto('https://collectio.co.kr/user/login.jsp');
  await page.fill(selectors.login.idInput, credentials.id);
  await page.fill(selectors.login.passwordInput, credentials.password);
  await page.click(selectors.login.submitButton);
  await page.waitForLoadState('networkidle');
  return page;
}
