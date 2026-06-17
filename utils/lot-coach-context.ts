import type { DealActionRecommendation, DealAnalysis, DealState, NegotiationFlag } from './types.ts';

export type LotCoachContext = {
  buyerStateCode: string;
  verdict: string;
  amountFinanced: number;
  monthlyPayment: number;
  totalPaid: number;
  apr: string;
  termMonths: string;
  downPayment: string;
  tradeIn: string;
  targetTotalPaid: string;
  flaggedFees: string[];
  dealWarnings: string[];
  activePressureTactics: string[];
  recommendationHeadline: string;
  readinessLabel: string;
};

const PRESSURE_LABELS: Record<NegotiationFlag, string> = {
  paymentShift: 'Payment-only focus',
  todayOnly: 'Today-only urgency',
  managerTrip: 'Manager approval theater',
  bundleAddOn: 'Bundled add-ons',
  wontPrint: 'Won’t print breakdown',
  tradeMix: 'Trade mixed into payment',
};

export function buildLotCoachContext(options: {
  deal: DealState;
  analysis: DealAnalysis;
  negotiationFlags: NegotiationFlag[];
  recommendation: DealActionRecommendation;
  readinessLabel: string;
}): LotCoachContext {
  const { deal, analysis, negotiationFlags, recommendation, readinessLabel } = options;

  return {
    buyerStateCode: deal.buyerStateCode || 'unknown',
    verdict: analysis.dealVerdict,
    amountFinanced: analysis.amountFinanced,
    monthlyPayment: analysis.monthlyPayment,
    totalPaid: analysis.totalPaid,
    apr: deal.apr || 'not set',
    termMonths: deal.months || 'not set',
    downPayment: deal.downPayment || '0',
    tradeIn: deal.tradeIn || '0',
    targetTotalPaid: deal.targetTotalPaid || 'not set',
    flaggedFees: analysis.flaggedFees.map((fee) => `${fee.label}: ${fee.reason}`),
    dealWarnings: analysis.dealWarnings.slice(0, 5),
    activePressureTactics: negotiationFlags.map((flag) => PRESSURE_LABELS[flag]),
    recommendationHeadline: recommendation.headline,
    readinessLabel,
  };
}

export function formatLotCoachContextForPrompt(context: LotCoachContext): string {
  return [
    `Buyer state: ${context.buyerStateCode}`,
    `Readiness: ${context.readinessLabel}`,
    `Verdict: ${context.verdict}`,
    `Amount financed (est.): $${context.amountFinanced.toFixed(2)}`,
    `Monthly payment (est.): $${context.monthlyPayment.toFixed(2)}`,
    `Total paid (est.): $${context.totalPaid.toFixed(2)}`,
    `APR: ${context.apr}%`,
    `Term: ${context.termMonths} months`,
    `Down payment: $${context.downPayment}`,
    `Trade credit: $${context.tradeIn}`,
    `Budget ceiling (total paid): ${context.targetTotalPaid}`,
    `Recommended move: ${context.recommendationHeadline}`,
    `Flagged fees: ${context.flaggedFees.length ? context.flaggedFees.join('; ') : 'none noted'}`,
    `Warnings: ${context.dealWarnings.length ? context.dealWarnings.join('; ') : 'none noted'}`,
    `Active pressure tactics this session: ${context.activePressureTactics.length ? context.activePressureTactics.join(', ') : 'none logged yet'}`,
  ].join('\n');
}
