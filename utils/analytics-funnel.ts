import { dealHasQuickCheckData } from './roadmap.ts';
import type { DealerGuardAppData } from './types.ts';

export type FunnelStep = {
  id: string;
  label: string;
  complete: boolean;
  detail: string;
};

export function buildAnalyticsFunnel(appData: DealerGuardAppData): FunnelStep[] {
  const { deal, preferences, savedDeals, subscription } = appData;
  const proPreviewed = appData.analyticsEvents.some((event) => event.type === 'pro_preview' || event.type === 'paywall_opened');

  return [
    {
      id: 'setup',
      label: 'Setup complete',
      complete: preferences.onboardingComplete,
      detail: preferences.onboardingComplete ? 'Buyer profile saved' : 'Finish guided setup on Shield',
    },
    {
      id: 'budget',
      label: 'Budget guardrails',
      complete: Boolean(deal.targetTotalPaid.trim() || (deal.downPayment.trim() && deal.outsideLenderApr.trim())),
      detail: 'Set walk-away numbers before visiting the lot',
    },
    {
      id: 'quote',
      label: 'Quote reviewed',
      complete: dealHasQuickCheckData(deal) || savedDeals.some(dealHasQuickCheckData),
      detail: 'Import or enter a dealership quote in Deal review',
    },
    {
      id: 'saved',
      label: 'Offer saved',
      complete: savedDeals.length > 0,
      detail: savedDeals.length > 0 ? `${savedDeals.length} offer${savedDeals.length === 1 ? '' : 's'} saved` : 'Save an offer to unlock compare',
    },
    {
      id: 'pro',
      label: 'Pro explored',
      complete: subscription.tier === 'pro' || proPreviewed,
      detail: subscription.tier === 'pro' ? 'Pro active' : 'Preview or unlock Pro tools',
    },
  ];
}

export function getFunnelCompletionRate(steps: FunnelStep[]) {
  if (!steps.length) return 0;
  return Math.round((steps.filter((step) => step.complete).length / steps.length) * 100);
}
