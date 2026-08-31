import type { MainTab, Screen } from './types.ts';

export type ScreenNavFrame = {
  screen: Screen;
  tab: MainTab;
};

export const MAIN_TABS: MainTab[] = ['scan', 'analyzer', 'tactics', 'settings'];

export const ALL_SCREENS: Screen[] = [
  'scanHub',
  'analyzerHub',
  'tacticsHub',
  'settingsHub',
  'questions',
  'result',
  'traps',
  'checklist',
  'liveMode',
  'dealReview',
  'whatIfLab',
  'financeDefense',
  'tacticDecoder',
  'compareDeals',
  'watchlist',
  'upgradeHub',
  'notes',
  'firstRunWalkthrough',
];

const HUB_SCREENS = new Set<Screen>(['scanHub', 'analyzerHub', 'tacticsHub', 'settingsHub']);

export type HardwareBackAction = 'closeDrawer' | 'walkthroughBack' | 'stay' | 'questionBack' | 'popScreen' | 'goShield' | 'exit';

export function isMainTab(value: unknown): value is MainTab {
  return value === 'scan' || value === 'analyzer' || value === 'tactics' || value === 'settings';
}

export function coerceMainTab(value: unknown, fallback: MainTab = 'tactics'): MainTab {
  return isMainTab(value) ? value : fallback;
}

export function isScreen(value: unknown): value is Screen {
  return typeof value === 'string' && ALL_SCREENS.includes(value as Screen);
}

export function asVoidCallback(value: unknown): (() => void) | undefined {
  return typeof value === 'function' ? (value as () => void) : undefined;
}

export function resolveHardwareBack(input: {
  drawerOpen: boolean;
  screen: Screen;
  questionIndex: number;
  canWalkthroughBack: boolean;
}): HardwareBackAction {
  if (input.drawerOpen) return 'closeDrawer';
  if (input.screen === 'firstRunWalkthrough') {
    return input.canWalkthroughBack ? 'walkthroughBack' : 'stay';
  }
  if (input.screen === 'questions' && input.questionIndex > 0) return 'questionBack';
  if (!HUB_SCREENS.has(input.screen)) return 'popScreen';
  if (input.screen !== 'scanHub') return 'goShield';
  return 'exit';
}

export function pushNavFrame(
  history: ScreenNavFrame[],
  current: ScreenNavFrame,
  nextScreen: Screen,
  max = 20
): ScreenNavFrame[] {
  if (current.screen === nextScreen) return history;
  const next = [...history, current];
  return next.length > max ? next.slice(-max) : next;
}

export function popNavFrame(history: ScreenNavFrame[]): {
  previous: ScreenNavFrame | null;
  remaining: ScreenNavFrame[];
} {
  if (history.length === 0) {
    return { previous: null, remaining: history };
  }

  return {
    previous: history[history.length - 1],
    remaining: history.slice(0, -1),
  };
}
