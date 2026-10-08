import assert from 'node:assert/strict';
import test from 'node:test';

import {
  asVoidCallback,
  coerceMainTab,
  isMainTab,
  isScreen,
  popNavFrame,
  pushNavFrame,
  resolveHardwareBack,
} from '../utils/screen-nav.ts';

test('press events are not treated as a main tab', () => {
  assert.equal(isMainTab('tactics'), true);
  assert.equal(isMainTab({ nativeEvent: { timestamp: 1 } }), false);
  assert.equal(coerceMainTab({ nativeEvent: { timestamp: 1 } }, 'tactics'), 'tactics');
  assert.equal(coerceMainTab('scan'), 'scan');
});

test('lot coach opened from the golden check returns there instead of Tactician Guide', () => {
  const history = pushNavFrame([], { screen: 'scanHub', tab: 'scan' }, 'liveMode');
  const { previous, remaining } = popNavFrame(history);

  assert.deepEqual(previous, { screen: 'scanHub', tab: 'scan' });
  assert.deepEqual(remaining, []);
});

test('opening a nested screen stacks the previous one', () => {
  const afterLot = pushNavFrame([], { screen: 'scanHub', tab: 'scan' }, 'liveMode');
  const afterNotes = pushNavFrame(afterLot, { screen: 'liveMode', tab: 'tactics' }, 'notes');
  const firstBack = popNavFrame(afterNotes);
  const secondBack = popNavFrame(firstBack.remaining);

  assert.deepEqual(firstBack.previous, { screen: 'liveMode', tab: 'tactics' });
  assert.deepEqual(secondBack.previous, { screen: 'scanHub', tab: 'scan' });
});

test('navigating to the same screen does not add a history frame', () => {
  const history = pushNavFrame([], { screen: 'liveMode', tab: 'tactics' }, 'liveMode');
  assert.deepEqual(history, []);
});

test('press events are not treated as screens or success callbacks', () => {
  assert.equal(isScreen('liveMode'), true);
  assert.equal(isScreen({ nativeEvent: { timestamp: 1 } }), false);
  assert.equal(asVoidCallback({ nativeEvent: { timestamp: 1 } }), undefined);
  assert.equal(asVoidCallback(undefined), undefined);

  let called = false;
  const callback = asVoidCallback(() => {
    called = true;
  });
  callback?.();
  assert.equal(called, true);
});

test('Android back on the walk-away explainer stays on the screen', () => {
  assert.equal(
    resolveHardwareBack({ drawerOpen: false, screen: 'firstRunWalkthrough', questionIndex: 0, canWalkthroughBack: false }),
    'stay'
  );
});

test('Android back from Lot Coach or Tactician Guide stays in the app', () => {
  assert.equal(
    resolveHardwareBack({ drawerOpen: false, screen: 'liveMode', questionIndex: 0, canWalkthroughBack: false }),
    'popScreen'
  );
  assert.equal(
    resolveHardwareBack({ drawerOpen: false, screen: 'tacticsHub', questionIndex: 0, canWalkthroughBack: false }),
    'goShield'
  );
  assert.equal(
    resolveHardwareBack({ drawerOpen: false, screen: 'scanHub', questionIndex: 0, canWalkthroughBack: false }),
    'exit'
  );
  assert.equal(
    resolveHardwareBack({ drawerOpen: true, screen: 'scanHub', questionIndex: 0, canWalkthroughBack: false }),
    'closeDrawer'
  );
});
