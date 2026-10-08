import type { DealActionRecommendation, DealAnalysis, DealState, NegotiationFlag, SavedDeal } from './types.ts';
import { currency } from './finance.ts';
import { getAddOnTotal, getFeeTotal } from './deals.ts';

export type LotCoachContext = {
  mode: 'live' | 'compare';
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
  compareSummary?: string;
};

const PRESSURE_LABELS: Record<NegotiationFlag, string> = {
  paymentShift: 'Payment-only focus',
  todayOnly: 'Today-only urgency',
  managerTrip: 'Manager approval theater',
  bundleAddOn: 'Bundled add-ons',
  wontPrint: 'Won’t print breakdown',
  tradeMix: 'Trade mixed into payment',
};

function summarizeOffer(label: string, deal: DealState | SavedDeal, analysis: DealAnalysis) {
  return [
    `${label}: ${deal.dealershipName.trim() || 'Unnamed dealership'}`,
    `  Verdict: ${analysis.dealVerdict}`,
    `  Vehicle price: $${deal.vehiclePrice || '0'}`,
    `  Fees: $${getFeeTotal(deal)}`,
    `  Add-ons: $${getAddOnTotal(deal)}`,
    `  APR: ${deal.apr || 'n/a'}% for ${deal.months || 'n/a'} months`,
    `  Down: $${deal.downPayment || '0'} · Trade: $${deal.tradeIn || '0'}`,
    `  Est. monthly: ${currency(analysis.monthlyPayment)} · Est. total paid: ${currency(analysis.totalPaid)}`,
    `  Warnings: ${analysis.dangerScore}`,
  ].join('\n');
}

export function buildLotCoachContext(options: {
  deal: DealState;
  analysis: DealAnalysis;
  negotiationFlags: NegotiationFlag[];
  recommendation: DealActionRecommendation;
  readinessLabel: string;
}): LotCoachContext {
  const { deal, analysis, negotiationFlags, recommendation, readinessLabel } = options;

  return {
    mode: 'live',
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

export function buildCompareLotCoachContext(options: {
  leftDeal: SavedDeal;
  rightDeal: SavedDeal;
  leftAnalysis: DealAnalysis;
  rightAnalysis: DealAnalysis;
  whyWinsHeadline?: string;
  whyWinsBullets?: string[];
  readinessLabel: string;
  buyerStateCode?: string;
  targetTotalPaid?: string;
}): LotCoachContext {
  const {
    leftDeal,
    rightDeal,
    leftAnalysis,
    rightAnalysis,
    whyWinsHeadline,
    whyWinsBullets,
    readinessLabel,
    buyerStateCode,
    targetTotalPaid,
  } = options;

  const compareSummary = [
    summarizeOffer('Offer A', leftDeal, leftAnalysis),
    summarizeOffer('Offer B', rightDeal, rightAnalysis),
    whyWinsHeadline ? `Sign Check ranking note: ${whyWinsHeadline}` : null,
    ...(whyWinsBullets ?? []).map((bullet) => `• ${bullet}`),
  ]
    .filter(Boolean)
    .join('\n');

  return {
    mode: 'compare',
    buyerStateCode: buyerStateCode || leftDeal.buyerStateCode || rightDeal.buyerStateCode || 'unknown',
    verdict: `${leftAnalysis.dealVerdict} vs ${rightAnalysis.dealVerdict}`,
    amountFinanced: leftAnalysis.amountFinanced,
    monthlyPayment: leftAnalysis.monthlyPayment,
    totalPaid: leftAnalysis.totalPaid,
    apr: leftDeal.apr || 'not set',
    termMonths: leftDeal.months || 'not set',
    downPayment: leftDeal.downPayment || '0',
    tradeIn: leftDeal.tradeIn || '0',
    targetTotalPaid: targetTotalPaid || leftDeal.targetTotalPaid || 'not set',
    flaggedFees: [...leftAnalysis.flaggedFees, ...rightAnalysis.flaggedFees].map((fee) => `${fee.label}: ${fee.reason}`),
    dealWarnings: [...leftAnalysis.dealWarnings, ...rightAnalysis.dealWarnings].slice(0, 8),
    activePressureTactics: [],
    recommendationHeadline: whyWinsHeadline || 'Explain which offer is better and why',
    readinessLabel,
    compareSummary,
  };
}

export function formatLotCoachContextForPrompt(context: LotCoachContext): string {
  if (context.mode === 'compare' && context.compareSummary) {
    return [
      'Mode: compare saved offers',
      `Buyer state: ${context.buyerStateCode}`,
      `Readiness: ${context.readinessLabel}`,
      `Budget ceiling (total paid): ${context.targetTotalPaid}`,
      '',
      context.compareSummary,
      '',
      'Task: explain what differs between Offer A and Offer B, which is better overall, and any payment-packing or fee tricks. Do not default to generic “keep the price down” coaching unless the numbers support it.',
    ].join('\n');
  }

  return [
    'Mode: live desk coaching',
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
