import { currency } from './finance.ts';
import type { DealActionRecommendation, DealAnalysis, DealState, NegotiationFlag, Tone } from './types.ts';

export type DeskTacticChip = {
  id: NegotiationFlag;
  label: string;
  script: string;
};

export type CapVsQuoteRow = {
  id: 'monthly' | 'otd' | 'apr';
  label: string;
  them: string;
  cap: string;
  overCap: boolean;
};

export const DESK_TACTIC_CHIPS: DeskTacticChip[] = [
  {
    id: 'todayOnly',
    label: 'Today-only',
    script: 'If it’s only good today, print the full out-the-door number and I’ll decide today.',
  },
  {
    id: 'wontPrint',
    label: 'Won’t print',
    script: 'I decide on the written out-the-door number, not the monthly. Can you print or email the full breakdown?',
  },
  {
    id: 'paymentShift',
    label: 'Payment shift',
    script: 'Keep the monthly aside for a second. What’s the out-the-door price with every fee itemized?',
  },
  {
    id: 'bundleAddOn',
    label: 'Add-ons',
    script: 'Please itemize each product. Remove anything optional so I can compare the clean number.',
  },
];

const FALLBACK_SCRIPTS: Record<DealActionRecommendation['action'], string> = {
  Leave: 'I’m not signing this structure. Print the full breakdown and I’ll compare it at my number, not the monthly.',
  Counter: 'I need this in writing. I’m comparing out-the-door numbers, not monthly payments.',
  Buy: 'If this is the number, print the full breakdown and I’ll review every line before I sign.',
};

export function getDeskScript(flag: NegotiationFlag | null, action: DealActionRecommendation['action'] = 'Counter') {
  if (!flag) return FALLBACK_SCRIPTS[action];
  return DESK_TACTIC_CHIPS.find((chip) => chip.id === flag)?.script ?? FALLBACK_SCRIPTS[action];
}

export function buildCapVsQuote(
  deal: DealState,
  analysis: DealAnalysis,
  recommendation?: Pick<DealActionRecommendation, 'targetMonthlyPayment' | 'targetTotalPaid'> | null
): CapVsQuoteRow[] {
  const months = Number(deal.months || 0);
  const monthlyCap =
    recommendation?.targetMonthlyPayment && recommendation.targetMonthlyPayment > 0
      ? recommendation.targetMonthlyPayment
      : Number(deal.targetTotalPaid || 0) > 0 && months > 0
        ? Number(deal.targetTotalPaid) / months
        : 0;
  const otdCap =
    Number(deal.targetTotalPaid || 0) > 0
      ? Number(deal.targetTotalPaid)
      : recommendation?.targetTotalPaid && recommendation.targetTotalPaid > 0
        ? recommendation.targetTotalPaid
        : 0;
  const aprCap = Number(deal.outsideLenderApr || 0);
  const theirApr = Number(deal.apr || 0);

  return [
    {
      id: 'monthly',
      label: 'Monthly',
      them: analysis.monthlyPayment > 0 ? currency(analysis.monthlyPayment) : '—',
      cap: monthlyCap > 0 ? currency(monthlyCap) : 'Set cap',
      overCap: monthlyCap > 0 && analysis.monthlyPayment > monthlyCap + 1,
    },
    {
      id: 'otd',
      label: 'Total paid',
      them: analysis.totalPaid > 0 ? currency(analysis.totalPaid) : '—',
      cap: otdCap > 0 ? currency(otdCap) : 'Set cap',
      overCap: otdCap > 0 && analysis.totalPaid > otdCap + 50,
    },
    {
      id: 'apr',
      label: 'APR',
      them: theirApr > 0 ? `${theirApr}%` : '—',
      cap: aprCap > 0 ? `${aprCap}%` : 'Lender APR',
      overCap: aprCap > 0 && theirApr > aprCap + 0.05,
    },
  ];
}

export function isQuoteOverCap(rows: CapVsQuoteRow[]) {
  return rows.some((row) => row.overCap);
}

export function deskActionLabel(action: DealActionRecommendation['action']) {
  if (action === 'Leave') return 'WALK AWAY';
  if (action === 'Buy') return 'FAIR';
  return 'COUNTER';
}

export function deskActionTone(action: DealActionRecommendation['action']): Tone {
  if (action === 'Leave') return 'bad';
  if (action === 'Buy') return 'good';
  return 'warn';
}
