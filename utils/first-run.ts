import type { BuyerSituation, DealerGuardAppData, MainTab, Screen } from './types.ts';
import { createInitialDeal } from './app-state.ts';
import { dealHasQuickCheckData } from './roadmap.ts';

export type ActiveBuyerSituation = Exclude<BuyerSituation, 'undecided'>;
export type DealReviewWizardStep = 'import' | 'numbers' | 'details' | 'verdict';

export type FirstRunProfile = {
  situation: ActiveBuyerSituation;
  isFirstTimeBuyer: boolean;
};

export const BUYER_SITUATIONS: Array<{
  id: ActiveBuyerSituation;
  title: string;
  detail: string;
}> = [
  {
    id: 'home',
    title: 'At home researching',
    detail: 'Set a walk-away number and check quotes before you visit.',
  },
  {
    id: 'lot',
    title: 'Sitting at the dealership',
    detail: 'Get the next line to say and log pressure tactics.',
  },
  {
    id: 'signing',
    title: 'About to sign',
    detail: 'Compare the paperwork to the numbers you already reviewed.',
  },
];

export const DEAL_REVIEW_WIZARD_STEPS: Array<{
  id: DealReviewWizardStep;
  label: string;
  title: string;
  hint: string;
}> = [
  { id: 'import', label: '1', title: 'Add the quote', hint: 'Photo, paste, or type. You only need the big numbers.' },
  { id: 'numbers', label: '2', title: 'Confirm 4 numbers', hint: 'Price, down payment, APR, and loan length.' },
  { id: 'details', label: '3', title: 'Extra detail', hint: 'Fees, add-ons, and trade. Skip if you do not have them yet.' },
  { id: 'verdict', label: '4', title: 'See the verdict', hint: 'Whether this quote is over your walk-away, and what to say.' },
];

export const ADVANCED_DRAWER_IDS = new Set([
  'compare-offers',
  'what-if-lab',
  'finance-defense',
  'trap-library',
  'tactic-decoder',
  'contract-blocks',
  'incident-logs',
]);

export const HUB_SCREENS = new Set<Screen>(['scanHub', 'analyzerHub', 'tacticsHub', 'settingsHub']);

export function isBuyerSituation(value: unknown): value is ActiveBuyerSituation {
  return value === 'home' || value === 'lot' || value === 'signing';
}

export function isDealReviewWizardStep(value: unknown): value is DealReviewWizardStep {
  return value === 'import' || value === 'numbers' || value === 'details' || value === 'verdict';
}

export function shouldShowFirstRunWalkthrough(preferences: {
  walkthroughComplete?: boolean;
  onboardingComplete?: boolean;
}) {
  if (preferences.walkthroughComplete) return false;
  return !preferences.onboardingComplete;
}

export function hasQuoteToReview(appData: Pick<DealerGuardAppData, 'deal' | 'savedDeals'>) {
  return dealHasQuickCheckData(appData.deal) || appData.savedDeals.some(dealHasQuickCheckData);
}

export function shouldShowAdvancedTools(appData: Pick<DealerGuardAppData, 'deal' | 'savedDeals'>, walkthroughComplete: boolean) {
  return walkthroughComplete && hasQuoteToReview(appData);
}

export function getHomeForSituation(situation: BuyerSituation): { screen: Screen; tab: MainTab } {
  if (situation === 'lot') return { screen: 'liveMode', tab: 'tactics' };
  if (situation === 'signing') return { screen: 'dealReview', tab: 'analyzer' };
  return { screen: 'scanHub', tab: 'scan' };
}

export function getNextDealReviewStep(step: DealReviewWizardStep): DealReviewWizardStep | null {
  if (step === 'import') return 'numbers';
  if (step === 'numbers') return 'details';
  if (step === 'details') return 'verdict';
  return null;
}

export function getPreviousDealReviewStep(step: DealReviewWizardStep): DealReviewWizardStep | null {
  if (step === 'verdict') return 'details';
  if (step === 'details') return 'numbers';
  if (step === 'numbers') return 'import';
  return null;
}

export function appDataAfterWalkthrough(appData: DealerGuardAppData): DealerGuardAppData {
  return {
    ...appData,
    deal: createInitialDeal(),
    negotiationFlags: [],
    preferences: {
      ...appData.preferences,
      onboardingComplete: true,
      walkthroughComplete: true,
    },
  };
}
