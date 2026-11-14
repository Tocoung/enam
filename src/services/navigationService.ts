/**
 * Navigation Service & URL Synchronization for FINN.
 *
 * Coordinates deep-linking and browser history synchronization across
 * Dashboard, Research Copilot, Announcements, and Network Intelligence views.
 */

export type AppPage = 'dashboard' | 'research' | 'announcements' | 'network';

export interface NavigationState {
  readonly page: AppPage;
  readonly ticker?: string;
}

/**
 * Parses a query string into a canonical NavigationState.
 *
 * Preserves initial-load behavior:
 * - ?page=network -> network
 * - ?page=announcements -> announcements (with optional ticker)
 * - ?page=research or ?ticker=... -> research (with optional ticker)
 * - empty, unknown, or ?page=dashboard -> dashboard
 */
export function parseNavigationFromUrl(search: string): NavigationState {
  if (!search) {
    return { page: 'dashboard' };
  }

  const cleanSearch = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(cleanSearch);
  const pageParam = params.get('page');
  const tickerParam = params.get('ticker');
  const normalizedTicker = tickerParam ? tickerParam.trim().toUpperCase() : undefined;

  if (pageParam === 'network') {
    return { page: 'network' };
  }
  if (pageParam === 'announcements') {
    return { page: 'announcements', ticker: normalizedTicker };
  }
  if (pageParam === 'research' || normalizedTicker) {
    return { page: 'research', ticker: normalizedTicker };
  }

  return { page: 'dashboard' };
}

/**
 * Builds the canonical relative URL for a given NavigationState.
 *
 * Requirements:
 * - Dashboard has NO query parameter (clean pathname).
 * - Network has ?page=network.
 * - Research has ?page=research (plus &ticker=... if provided).
 * - Announcements has ?page=announcements (plus &ticker=... if provided).
 */
export function buildUrlForNavigation(
  state: NavigationState,
  pathname = '/'
): string {
  const cleanPathname = pathname || '/';
  const params = new URLSearchParams();

  if (state.page === 'network') {
    params.set('page', 'network');
  } else if (state.page === 'announcements') {
    params.set('page', 'announcements');
    if (state.ticker) {
      params.set('ticker', state.ticker.toUpperCase());
    }
  } else if (state.page === 'research') {
    params.set('page', 'research');
    if (state.ticker) {
      params.set('ticker', state.ticker.toUpperCase());
    }
  }
  // Dashboard: no query parameters attached.

  const query = params.toString();
  return query ? `${cleanPathname}?${query}` : cleanPathname;
}

/**
 * Determines whether a target navigation transition is redundant (already active).
 */
export function isRedundantNavigation(
  current: NavigationState,
  target: NavigationState
): boolean {
  if (current.page !== target.page) {
    return false;
  }
  const currentTicker = current.ticker ? current.ticker.trim().toUpperCase() : undefined;
  const targetTicker = target.ticker ? target.ticker.trim().toUpperCase() : undefined;
  return currentTicker === targetTicker;
}
