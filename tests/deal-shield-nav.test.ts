import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEALSHIELD_DRAWER_ITEMS,
  handleDrawerItemPress,
  isMainDealShieldPath,
} from '../components/navigation/deal-shield-nav-config.ts';

function press(id: string) {
  const item = DEALSHIELD_DRAWER_ITEMS.find((entry) => entry.id === id);
  assert.ok(item, `missing drawer item ${id}`);

  const calls: string[] = [];
  handleDrawerItemPress(item, {
    closeDrawer: () => calls.push('close'),
    setBottomTab: (tab) => calls.push(`tab:${tab}`),
    navigate: (screen, tab) => calls.push(`nav:${screen}:${tab ?? ''}`),
    onRoute: (href) => calls.push(`route:${String(href)}`),
  });
  return calls;
}

test('hamburger items each navigate to their own screen instead of resetting home', () => {
  assert.deepEqual(press('shield'), ['close', 'nav:scanHub:scan']);
  assert.deepEqual(press('calculator'), ['close', 'nav:analyzerHub:analyzer']);
  assert.deepEqual(press('lot-coach'), ['close', 'nav:liveMode:tactics']);
  assert.deepEqual(press('contract-blocks'), ['close', 'nav:dealReview:analyzer']);
  assert.deepEqual(press('incident-logs'), ['close', 'nav:notes:settings']);
  assert.deepEqual(press('watchlist'), ['close', 'nav:watchlist:analyzer']);
  assert.deepEqual(press('compare-offers'), ['close', 'nav:compareDeals:analyzer']);
  assert.deepEqual(press('what-if-lab'), ['close', 'nav:whatIfLab:analyzer']);
  assert.deepEqual(press('finance-defense'), ['close', 'nav:financeDefense:analyzer']);
  assert.deepEqual(press('trap-library'), ['close', 'nav:traps:tactics']);
  assert.deepEqual(press('buyer-checklist'), ['close', 'nav:checklist:tactics']);
  assert.deepEqual(press('tactic-decoder'), ['close', 'nav:tacticDecoder:tactics']);
  assert.deepEqual(press('feature-matrix'), ['close', 'nav:upgradeHub:settings']);
  assert.deepEqual(press('settings'), ['close', 'nav:settingsHub:settings']);
  assert.deepEqual(press('about-legal'), ['close', 'route:/(main)/about-legal']);
});

test('hamburger destinations are unique', () => {
  const destinations = DEALSHIELD_DRAWER_ITEMS.map((item) => item.screen ?? String(item.href));
  assert.equal(new Set(destinations).size, destinations.length);
});

test('hamburger never resets the app home route', () => {
  for (const item of DEALSHIELD_DRAWER_ITEMS) {
    const calls = press(item.id);
    assert.equal(calls.includes('route:/(main)'), false);
    assert.equal(calls.some((call) => call.startsWith('tab:')), false);
  }
});

test('stacked legal screen is not treated as the main app', () => {
  assert.equal(isMainDealShieldPath('/(main)'), true);
  assert.equal(isMainDealShieldPath('/(main)/index'), true);
  assert.equal(isMainDealShieldPath('/'), true);
  assert.equal(isMainDealShieldPath('/(main)/about-legal'), false);
});
