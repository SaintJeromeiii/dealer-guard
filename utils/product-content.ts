export type FreeVsProRow = {
  feature: string;
  free: string;
  pro: string;
};

export const FREE_VS_PRO_ROWS: FreeVsProRow[] = [
  { feature: 'Guided buyer setup & roadmap', free: 'Yes', pro: 'Yes' },
  { feature: 'Budget guardrails', free: 'Yes', pro: 'Yes' },
  { feature: 'Deal review & quick payment estimator', free: 'Yes', pro: 'Yes' },
  { feature: 'Save & compare offers', free: 'Yes', pro: 'Yes' },
  { feature: 'Live dealership mode', free: '—', pro: 'Yes' },
  { feature: 'What-if lab & counter scripts', free: '—', pro: 'Yes' },
  { feature: 'Finance office defense', free: '—', pro: 'Yes' },
  { feature: 'Shareable buyer report', free: '—', pro: 'Yes' },
  { feature: 'Dealer scorecards', free: '—', pro: 'Yes' },
];

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
