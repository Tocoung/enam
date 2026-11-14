#!/usr/bin/env node
/**
 * Direct TypeScript Unit Tests for FINN Navigation Service & URL Synchronization.
 *
 * Verifies URL query parsing, canonical URL construction, browser history simulation,
 * Back/Forward popstate synchronization, and cross-subsystem navigation.
 *
 * Run: node scripts/test_navigation.mjs
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load TypeScript service via jiti
const jiti = require(path.join(rootDir, 'node_modules/jiti'))(path.join(rootDir, 'index.js'));
const navigationService = jiti('./src/services/navigationService.ts');

const {
  parseNavigationFromUrl,
  buildUrlForNavigation,
  isRedundantNavigation,
} = navigationService;

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${testName}${details ? ': ' + details : ''}`);
  }
}

console.log('=== FINN Navigation & URL Synchronization Unit Tests ===\n');

// 1. Initial Load Query String Parsing
console.log('1. Initial Load Query String Parsing:');

const navNetwork = parseNavigationFromUrl('?page=network');
assert(navNetwork.page === 'network', 'Initial load with ?page=network sets activePage to network');
assert(navNetwork.ticker === undefined, 'Network page has no ticker');

const navNetworkLeadingSlash = parseNavigationFromUrl('page=network');
assert(navNetworkLeadingSlash.page === 'network', 'Parses query string without leading question mark');

const navResearch = parseNavigationFromUrl('?page=research');
assert(navResearch.page === 'research', 'Initial load with ?page=research sets activePage to research');
assert(navResearch.ticker === undefined, 'Research page without ticker has undefined ticker');

const navResearchWithTicker = parseNavigationFromUrl('?page=research&ticker=tcs');
assert(navResearchWithTicker.page === 'research', 'Research page with ticker');
assert(navResearchWithTicker.ticker === 'TCS', 'Normalizes ticker to uppercase');

const navTickerOnly = parseNavigationFromUrl('?ticker=infy');
assert(navTickerOnly.page === 'research', 'Initial load with ?ticker=INFY defaults to research page');
assert(navTickerOnly.ticker === 'INFY', 'Extracts ticker from ticker-only query');

const navAnnouncements = parseNavigationFromUrl('?page=announcements');
assert(navAnnouncements.page === 'announcements', 'Initial load with ?page=announcements sets activePage to announcements');
assert(navAnnouncements.ticker === undefined, 'Announcements without ticker has undefined ticker');

const navAnnouncementsWithTicker = parseNavigationFromUrl('?page=announcements&ticker=reliance');
assert(navAnnouncementsWithTicker.page === 'announcements', 'Announcements page with ticker');
assert(navAnnouncementsWithTicker.ticker === 'RELIANCE', 'Normalizes announcement ticker to uppercase');

const navDashboardExplicit = parseNavigationFromUrl('?page=dashboard');
assert(navDashboardExplicit.page === 'dashboard', 'Explicit ?page=dashboard sets activePage to dashboard');

const navEmpty = parseNavigationFromUrl('');
assert(navEmpty.page === 'dashboard', 'Empty query string defaults to dashboard');

const navUnknown = parseNavigationFromUrl('?page=unknown_subsystem');
assert(navUnknown.page === 'dashboard', 'Unknown page parameter defaults to dashboard');


// 2. Canonical URL Construction
console.log('\n2. Canonical URL Construction:');

const urlDashboard = buildUrlForNavigation({ page: 'dashboard' }, '/');
assert(urlDashboard === '/', 'Navigation to Dashboard clears query parameter completely');

const urlDashboardNoQuery = buildUrlForNavigation({ page: 'dashboard', ticker: 'IGNORED' }, '/');
assert(urlDashboardNoQuery === '/', 'Dashboard ignores ticker parameter and stays query-free');

const urlNetwork = buildUrlForNavigation({ page: 'network' }, '/');
assert(urlNetwork === '/?page=network', 'Navigation from Dashboard to Network updates URL to /?page=network');

const urlResearchNoTicker = buildUrlForNavigation({ page: 'research' }, '/');
assert(urlResearchNoTicker === '/?page=research', 'Research without ticker builds /?page=research');

const urlResearchWithTicker = buildUrlForNavigation({ page: 'research', ticker: 'TCS' }, '/');
assert(urlResearchWithTicker === '/?page=research&ticker=TCS', 'Research with ticker builds /?page=research&ticker=TCS');

const urlAnnouncementsNoTicker = buildUrlForNavigation({ page: 'announcements' }, '/');
assert(urlAnnouncementsNoTicker === '/?page=announcements', 'Announcements without ticker builds /?page=announcements');

const urlAnnouncementsWithTicker = buildUrlForNavigation({ page: 'announcements', ticker: 'RELIANCE' }, '/');
assert(urlAnnouncementsWithTicker === '/?page=announcements&ticker=RELIANCE', 'Announcements with ticker builds /?page=announcements&ticker=RELIANCE');

const urlCustomPath = buildUrlForNavigation({ page: 'network' }, '/finn-app');
assert(urlCustomPath === '/finn-app?page=network', 'Preserves custom pathname when constructing URL');


// 3. Navigation Redundancy & History Avoidance
console.log('\n3. Navigation Redundancy & History Optimization:');

assert(
  isRedundantNavigation({ page: 'network' }, { page: 'network' }) === true,
  'Navigating to network when already on network is redundant'
);

assert(
  isRedundantNavigation({ page: 'dashboard' }, { page: 'network' }) === false,
  'Navigating from dashboard to network is not redundant'
);

assert(
  isRedundantNavigation({ page: 'research', ticker: 'TCS' }, { page: 'research', ticker: 'TCS' }) === true,
  'Navigating to research with identical ticker is redundant'
);

assert(
  isRedundantNavigation({ page: 'research', ticker: 'TCS' }, { page: 'research', ticker: 'INFY' }) === false,
  'Navigating to research with different ticker is not redundant'
);

assert(
  isRedundantNavigation({ page: 'research', ticker: 'TCS' }, { page: 'research' }) === false,
  'Clearing research ticker is not redundant'
);


// 4. Simulated Browser History & Popstate Lifecycle
console.log('\n4. Browser History & Popstate Lifecycle Simulation:');

class MockHistorySession {
  constructor(initialUrl = '/') {
    this.stack = [initialUrl];
    this.currentIndex = 0;
    this.activeState = parseNavigationFromUrl(this.currentQuery());
  }

  currentUrl() {
    return this.stack[this.currentIndex];
  }

  currentQuery() {
    const url = this.currentUrl();
    const qIndex = url.indexOf('?');
    return qIndex >= 0 ? url.slice(qIndex) : '';
  }

  push(page, ticker) {
    const targetState = { page, ticker };
    if (isRedundantNavigation(this.activeState, targetState)) {
      return false; // do not push
    }
    const newUrl = buildUrlForNavigation(targetState, '/');
    // Truncate any forward history upon new navigation
    this.stack = this.stack.slice(0, this.currentIndex + 1);
    this.stack.push(newUrl);
    this.currentIndex++;
    this.activeState = targetState;
    return true;
  }

  back() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      // Popstate triggers React state synchronization
      this.activeState = parseNavigationFromUrl(this.currentQuery());
      return true;
    }
    return false;
  }

  forward() {
    if (this.currentIndex < this.stack.length - 1) {
      this.currentIndex++;
      // Popstate triggers React state synchronization
      this.activeState = parseNavigationFromUrl(this.currentQuery());
      return true;
    }
    return false;
  }
}

const session = new MockHistorySession('/');
assert(session.currentUrl() === '/', 'Session starts at /');
assert(session.activeState.page === 'dashboard', 'Initial state is dashboard');

// Step A: Navigate from Dashboard to Network
const pushedNetwork = session.push('network');
assert(pushedNetwork === true, 'Pushed network entry to history');
assert(session.currentUrl() === '/?page=network', 'URL is now /?page=network');
assert(session.activeState.page === 'network', 'Active page synchronized to network');

// Redundant push attempt
const pushedDuplicate = session.push('network');
assert(pushedDuplicate === false, 'Redundant push to network prevented');
assert(session.stack.length === 2, 'History stack length unchanged');

// Step B: Navigate from Network to Dashboard
const pushedDashboard = session.push('dashboard');
assert(pushedDashboard === true, 'Pushed dashboard entry to history');
assert(session.currentUrl() === '/', 'URL clears query parameter on return to dashboard');
assert(session.activeState.page === 'dashboard', 'Active page synchronized to dashboard');

// Step C: Browser Back
const wentBack1 = session.back();
assert(wentBack1 === true, 'Browser Back succeeded');
assert(session.currentUrl() === '/?page=network', 'Back restored URL to /?page=network');
assert(session.activeState.page === 'network', 'Back synchronized active page to network');

// Step D: Browser Back to initial Dashboard
const wentBack2 = session.back();
assert(wentBack2 === true, 'Second Browser Back succeeded');
assert(session.currentUrl() === '/', 'Back restored URL to /');
assert(session.activeState.page === 'dashboard', 'Back synchronized active page to dashboard');

// Step E: Browser Forward to Network
const wentForward1 = session.forward();
assert(wentForward1 === true, 'Browser Forward succeeded');
assert(session.currentUrl() === '/?page=network', 'Forward restored URL to /?page=network');
assert(session.activeState.page === 'network', 'Forward synchronized active page to network');

// Step F: Browser Forward to Dashboard
const wentForward2 = session.forward();
assert(wentForward2 === true, 'Second Browser Forward succeeded');
assert(session.currentUrl() === '/', 'Forward restored URL to /');
assert(session.activeState.page === 'dashboard', 'Forward synchronized active page to dashboard');


// 5. Cross-Subsystem Navigation (Research <-> Announcements)
console.log('\n5. Cross-Subsystem Navigation Tests:');

// Dashboard -> Research with ticker
session.push('research', 'TCS');
assert(session.currentUrl() === '/?page=research&ticker=TCS', 'Cross-navigation to Research sets ?page=research&ticker=TCS');
assert(session.activeState.page === 'research', 'Active page is research');
assert(session.activeState.ticker === 'TCS', 'Active ticker is TCS');

// Research -> Announcements with ticker
session.push('announcements', 'TCS');
assert(session.currentUrl() === '/?page=announcements&ticker=TCS', 'Cross-navigation to Announcements sets ?page=announcements&ticker=TCS');
assert(session.activeState.page === 'announcements', 'Active page is announcements');
assert(session.activeState.ticker === 'TCS', 'Active ticker is TCS');

// Announcements -> Research with different ticker
session.push('research', 'RELIANCE');
assert(session.currentUrl() === '/?page=research&ticker=RELIANCE', 'Cross-navigation to Research sets ?page=research&ticker=RELIANCE');
assert(session.activeState.page === 'research', 'Active page is research');
assert(session.activeState.ticker === 'RELIANCE', 'Active ticker is RELIANCE');

// Research -> Network
session.push('network');
assert(session.currentUrl() === '/?page=network', 'Navigation to Network from Research clears ticker and sets ?page=network');
assert(session.activeState.page === 'network', 'Active page is network');

// Back from Network returns to Research with RELIANCE
session.back();
assert(session.currentUrl() === '/?page=research&ticker=RELIANCE', 'Back returns to Research with RELIANCE');
assert(session.activeState.page === 'research', 'Active page is research');
assert(session.activeState.ticker === 'RELIANCE', 'Ticker is RELIANCE');

console.log('\n========================================');
console.log(`Summary: ${passed} passed, ${failed} failed`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
}
