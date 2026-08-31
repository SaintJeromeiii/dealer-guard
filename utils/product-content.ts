export type FreeVsProRow = {
  feature: string;
  free: string;
  pro: string;
};

export type LifetimeProFeature = {
  title: string;
  benefit: string;
};

/** Pro-only tools — single source of truth for Settings, upgrade hub, and monetization cards. */
export const LIFETIME_PRO_FEATURES: LifetimeProFeature[] = [
  {
    title: 'Live dealership mode',
    benefit: 'Stay on script at the lot with Lot Coach AI, live coaching, pressure tracking, and response scripts when the salesperson turns up the heat.',
  },
  {
    title: 'What-if lab & counter scripts',
    benefit: 'Model cleaner APR, term, fee, and down-payment structures before you counter at the desk.',
  },
  {
    title: 'Finance office defense',
    benefit: 'Prepare for warranty, GAP, and add-on pressure after the sales desk with F&I-specific scripts and checklists.',
  },
  {
    title: 'Shareable buyer report',
    benefit: 'Package the verdict, negotiation plan, and key risk checks into one summary you can text or export before anyone signs.',
  },
  {
    title: 'Dealer scorecards',
    benefit: 'See how each dealership stacks up across offer quality, pressure tactics, and kept or broken promises.',
  },
];

export const LIFETIME_PRO_PURCHASE_NOTE = 'One-time purchase · No subscription · Restore on new devices';

export const LIFETIME_PRO_ACTIVE_NOTE = 'Lifetime Pro is active on this account. All features below are unlocked.';

export function extractStorePrice(packageLabel?: string | null) {
  if (!packageLabel) return null;
  const parts = packageLabel.split('—');
  if (parts.length < 2) return null;
  const price = parts[parts.length - 1]?.trim() ?? '';
  if (!price || !/\d/.test(price)) return null;
  if (/active|preview|mock/i.test(price)) return null;
  return price;
}

export function getLifetimeUpgradeCtaLabel(busy: boolean, packageLabel?: string | null) {
  if (busy) return 'Processing...';
  const price = extractStorePrice(packageLabel);
  return price ? `Unlock lifetime Pro · ${price}` : 'Unlock lifetime Pro';
}

const FREE_PLAN_ROWS: FreeVsProRow[] = [
  { feature: 'Guided buyer setup & roadmap', free: 'Yes', pro: 'Yes' },
  { feature: 'Budget guardrails', free: 'Yes', pro: 'Yes' },
  { feature: 'Deal review & quick payment estimator', free: 'Yes', pro: 'Yes' },
  { feature: 'Save & compare offers', free: 'Yes', pro: 'Yes' },
  { feature: 'Vehicle watchlist (photo + price/location)', free: 'Yes', pro: 'Yes' },
];

export const AI_LOT_COACH_FEATURE_ROW: FreeVsProRow = {
  feature: 'AI Lot Coach',
  free: 'No',
  pro: 'Yes',
};

const PRO_PLAN_ROWS: FreeVsProRow[] = LIFETIME_PRO_FEATURES.map((feature) => ({
  feature: feature.title,
  free: '—',
  pro: 'Yes',
}));

export const FREE_VS_PRO_ROWS: FreeVsProRow[] = [...FREE_PLAN_ROWS, AI_LOT_COACH_FEATURE_ROW, ...PRO_PLAN_ROWS];

export const SAMPLE_QUOTE = {
  dealershipName: 'Metro Auto Group',
  vehiclePrice: '25995',
  salesTax: '1560',
  dealerFees: '799',
  addOns: '0',
  downPayment: '3000',
  tradeIn: '4500',
  apr: '7.9',
  months: '72',
};

export const MATH_DISCLAIMER =
  'Estimates only. Verify every number against the dealer’s written buyer’s order before signing.';
