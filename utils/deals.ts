import { suspiciousFeeRules, stateOptions } from '../data/deal-content.ts';
import { currency, estimateMonthlyPayment } from './finance.ts';
import { getReadinessLabel, scoreAnswers } from './scoring.ts';
import type {
  ComparisonInsight,
  CounterOfferMove,
  DealAnalysis,
  DealActionRecommendation,
  DealAnalysisBreakdownItem,
  DealConfidence,
  DealInputGuidance,
  DealerReputationReport,
  DealerScorecard,
  DealLineItem,
  DealState,
  DealVerdict,
  GuidedSessionFlow,
  HonestyScore,
  HonestyScorePart,
  ImportFieldReview,
  ImportLineItemReview,
  LiveCoachingPlan,
  LiveResponsePack,
  MarketCompSnapshot,
  MarketBenchmarkAssessment,
  MonetizationFeatureCard,
  MonetizationSummary,
  NegotiationPlan,
  NegotiationFlag,
  NegotiationSimulationTurn,
  OcrRecoverySuggestion,
  PaperworkAudit,
  PaperworkAuditItem,
  PersonalizedInsight,
  PremiumTier,
  PressureIncident,
  PromiseRecord,
  PromiseSummary,
  QuoteImportResult,
  ReadinessLabel,
  ReferralLoop,
  SavedDeal,
  SalesTacticItem,
  SigningReadiness,
  VisitTimelineEntry,
  SavingsOpportunity,
  SavingsProof,
  SessionPlaybook,
  SessionPlaybookStep,
  SubscriptionState,
  SuspiciousFeeRule,
  Tone,
  TradeInAssessment,
  QuickStartGuide,
  OfferTimelineEntry,
  OfferRevisionInsight,
  WhatIfComparison,
  WhatIfFieldChange,
} from './types.ts';

export { currency, estimateMonthlyPayment, getReadinessLabel, scoreAnswers };

export function detectSuspiciousFees(rawFeeNames: string) {
  const text = (rawFeeNames || '').toLowerCase();
  if (!text.trim()) return [] as SuspiciousFeeRule[];
  return suspiciousFeeRules.filter((rule) => text.includes(rule.key));
}

export function getStateName(code: string) {
  return stateOptions.find((option) => option.code === code)?.name ?? 'your state';
}

export function buildStateContext(stateCode: string) {
  if (!stateCode) {
    return 'Dealer fee norms can vary by state. Select your state so saved offers keep local context attached to the deal.';
  }

  const stateName = getStateName(stateCode);
  return `Using ${stateName} as the comparison context. Confirm whether doc fees, required disclosures, and bundled products are standard for ${stateName} before treating them as non-negotiable.`;
}

function addBreakdownItem(items: DealAnalysisBreakdownItem[], label: string, effect: number, reason: string, tone: Tone) {
  items.push({ label, effect, reason, tone });
}

function buildVerdict(dangerScore: number): DealVerdict {
  if (dangerScore >= 6) return 'Walk Away';
  if (dangerScore >= 4) return 'Bad Deal';
  if (dangerScore >= 2) return 'Review Carefully';
  return 'Fair Deal';
}

function sumLineItems(items: DealLineItem[]) {
  return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

export function getFeeTotal(deal: DealState) {
  const lineItemTotal = sumLineItems(deal.feeItems);
  return lineItemTotal > 0 ? lineItemTotal : Number(deal.dealerFees || 0);
}

export function getAddOnTotal(deal: DealState) {
  const lineItemTotal = sumLineItems(deal.addOnItems);
  return lineItemTotal > 0 ? lineItemTotal : Number(deal.addOns || 0);
}

export function buildFeeNameString(deal: DealState) {
  const labels = deal.feeItems.map((item) => item.label.trim()).filter(Boolean);
  return [deal.feeNames, labels.join(', ')].filter(Boolean).join(', ');
}

export function buildTradeInAssessment(deal: DealState): TradeInAssessment | null {
  const offeredValue = Number(deal.tradeIn || 0);
  const benchmarkValue = Number(deal.tradeReferenceValue || 0);
  const payoffBalance = Number(deal.tradePayoff || 0);

  if (offeredValue <= 0 && benchmarkValue <= 0 && payoffBalance <= 0) return null;

  const valueGap = benchmarkValue > 0 && offeredValue > 0 ? offeredValue - benchmarkValue : 0;
  const equity = offeredValue - payoffBalance;

  if (benchmarkValue > 0 && offeredValue > 0 && valueGap <= -1500) {
    return {
      offeredValue,
      benchmarkValue,
      payoffBalance,
      equity,
      valueGap,
      tone: 'bad',
      headline: 'The trade offer looks meaningfully low.',
      detail: `The dealership is offering about ${currency(Math.abs(valueGap))} less than your outside benchmark on the trade.`,
      negotiationScript: `My outside trade benchmark is closer to ${currency(benchmarkValue)}. Match that trade value or separate the trade from this deal.`,
    };
  }

  if (equity < -1000) {
    return {
      offeredValue,
      benchmarkValue,
      payoffBalance,
      equity,
      valueGap,
      tone: 'bad',
      headline: 'Negative equity may be getting buried in the deal.',
      detail: `You appear to be about ${currency(Math.abs(equity))} upside down based on the current trade offer and payoff balance.`,
      negotiationScript: 'Show me exactly how the negative equity is being handled, line by line, without changing vehicle price, APR, or term.',
    };
  }

  if (benchmarkValue > 0 && offeredValue > 0 && Math.abs(valueGap) <= 1000) {
    return {
      offeredValue,
      benchmarkValue,
      payoffBalance,
      equity,
      valueGap,
      tone: 'good',
      headline: 'The trade offer looks close to your benchmark.',
      detail: `The current trade number is within about ${currency(Math.abs(valueGap))} of your reference value.`,
      negotiationScript: 'Keep the trade line separate and make sure the rest of the deal stands on its own.',
    };
  }

  return {
    offeredValue,
    benchmarkValue,
    payoffBalance,
    equity,
    valueGap,
    tone: 'warn',
    headline: 'The trade needs a separate written breakdown.',
    detail: 'Trade value, payoff, and deal structure should be reviewed separately so the store cannot hide changes in the numbers.',
    negotiationScript: 'Please separate vehicle price, trade value, payoff, and financing into four written numbers.',
  };
}

function parseComparablePrices(rawText: string) {
  return rawText
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(parseMoneyToken(item)))
    .filter((value) => value > 0);
}

export function buildMarketCompSnapshot(deal: DealState, analysis: DealAnalysis): MarketCompSnapshot | null {
  const comparablePrices = parseComparablePrices(deal.marketComparablePricesText);
  const comparableCount = comparablePrices.length;
  const averageComparablePrice = comparableCount
    ? Math.round(comparablePrices.reduce((sum, value) => sum + value, 0) / comparableCount)
    : 0;
  const lenderApr = Number(deal.outsideLenderApr || 0);
  const lenderTerm = Number(deal.outsideLenderTerm || deal.months || 0);

  if (!averageComparablePrice && !lenderApr) return null;

  let lenderSavingsEstimate = 0;
  if (lenderApr > 0 && lenderTerm > 0 && Number(deal.apr || 0) > lenderApr) {
    const currentMonthly = estimateMonthlyPayment(analysis.amountFinanced, Number(deal.apr || 0), lenderTerm);
    const outsideMonthly = estimateMonthlyPayment(analysis.amountFinanced, lenderApr, lenderTerm);
    lenderSavingsEstimate = Math.max(0, Math.round((currentMonthly - outsideMonthly) * lenderTerm));
  }

  const headline =
    averageComparablePrice > 0
      ? `Comparable listings average about ${currency(averageComparablePrice)}.`
      : `Outside lender rate entered at about ${lenderApr}% for ${lenderTerm || Number(deal.months || 0)} months.`;

  const detailParts = [];
  if (averageComparablePrice > 0) {
    detailParts.push(`Use the comparable average instead of a single researched number when you want a more grounded price anchor.`);
  }
  if (lenderSavingsEstimate > 0) {
    detailParts.push(`An outside rate near ${lenderApr}% could save about ${currency(lenderSavingsEstimate)} over the loan.`);
  } else if (lenderApr > 0) {
    detailParts.push(`Outside financing at ${lenderApr}% gives you a written rate benchmark to push against the dealership offer.`);
  }

  return {
    averageComparablePrice,
    comparableCount,
    lenderApr,
    lenderTerm,
    lenderSavingsEstimate,
    headline,
    detail: detailParts.join(' '),
  };
}

export function buildMarketBenchmarkAssessment(deal: DealState, analysis: DealAnalysis): MarketBenchmarkAssessment | null {
  const comparablePrices = parseComparablePrices(deal.marketComparablePricesText);
  const averageComparablePrice = comparablePrices.length
    ? Math.round(comparablePrices.reduce((sum, value) => sum + value, 0) / comparablePrices.length)
    : 0;
  const marketVehiclePrice = Number(deal.marketVehiclePrice || averageComparablePrice || 0);
  const targetTotalPaid = Number(deal.targetTotalPaid || 0);
  const currentVehiclePrice = Number(deal.vehiclePrice || 0);
  const outsideLenderApr = Number(deal.outsideLenderApr || 0);

  if (marketVehiclePrice <= 0 && targetTotalPaid <= 0) return null;

  const vehiclePriceGap = marketVehiclePrice > 0 ? currentVehiclePrice - marketVehiclePrice : 0;
  const totalPaidGap = targetTotalPaid > 0 ? analysis.totalPaid - targetTotalPaid : 0;

  if ((marketVehiclePrice > 0 && vehiclePriceGap > 1500) || (targetTotalPaid > 0 && totalPaidGap > 2000)) {
    return {
      headline: 'This offer is meaningfully above your benchmark.',
      tone: 'bad',
      vehiclePriceGap,
      totalPaidGap,
      detail:
        marketVehiclePrice > 0 && targetTotalPaid > 0
          ? `The vehicle price is about ${currency(vehiclePriceGap)} above your researched market price, and total paid is about ${currency(totalPaidGap)} above your target.`
          : marketVehiclePrice > 0
            ? `The vehicle price is about ${currency(vehiclePriceGap)} above your researched market price.`
            : `Estimated total paid is about ${currency(totalPaidGap)} above your target.`,
      negotiationScript:
        marketVehiclePrice > 0
          ? `My research puts this vehicle closer to ${currency(marketVehiclePrice)}. Bring the price down to that range or I am moving on.`
          : `My total-paid target is ${currency(targetTotalPaid)}. If you cannot get there on paper, I am not signing this deal.`,
    };
  }

  if ((marketVehiclePrice > 0 && Math.abs(vehiclePriceGap) <= 1000) || (targetTotalPaid > 0 && Math.abs(totalPaidGap) <= 1000)) {
    return {
      headline: 'This offer is close to your benchmark.',
      tone: 'good',
      vehiclePriceGap,
      totalPaidGap,
      detail:
        marketVehiclePrice > 0 && targetTotalPaid > 0
          ? 'The current numbers are in the neighborhood of your researched target. Focus on keeping the paperwork clean.'
          : 'The current numbers are close to your benchmark. Focus on fees, add-ons, and final contract consistency.',
      negotiationScript: 'This is close to my target. Keep the structure clean and do not add anything new in the paperwork.',
    };
  }

  return {
    headline: 'This offer needs benchmark confirmation.',
    tone: 'warn',
    vehiclePriceGap,
    totalPaidGap,
    detail:
      outsideLenderApr > 0 && Number(deal.apr || 0) > outsideLenderApr
        ? `The current offer and your benchmark are not far apart, but the store is still above your outside lender rate of ${outsideLenderApr}%.`
        : 'The current offer and your benchmark are not far apart, but the gap is still large enough to justify a direct counter.',
    negotiationScript:
      targetTotalPaid > 0
        ? `My target total paid is ${currency(targetTotalPaid)}. Show me what you can do to close that gap without changing the structure.`
        : `My researched market price is ${currency(marketVehiclePrice)}. Work from that number, not from a payment target.`,
  };
}

function parseMoneyToken(value: string) {
  const cleaned = value.replace(/[$,]/g, '').trim();
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  return match ? match[0] : '';
}

function normalizeNumericOCR(value: string) {
  return value
    .toUpperCase()
    .replace(/[OQD]/g, '0')
    .replace(/[ILS]/g, (char) => (char === 'S' ? '5' : '1'))
    .replace(/B/g, '8')
    .replace(/G/g, '6')
    .replace(/Z/g, '2');
}

function cleanMoneyValue(raw: string) {
  const cleaned = parseMoneyToken(normalizeNumericOCR(raw));
  return cleaned;
}

function cleanPercentValue(raw: string) {
  return parsePercentToken(normalizeNumericOCR(raw));
}

function cleanMonthValue(raw: string) {
  const normalized = normalizeNumericOCR(raw);
  const match = normalized.match(/(\d{2,3})/);
  if (!match) return '';
  const candidate = match[1];
  const commonTerms = ['24', '36', '48', '60', '72', '84'];
  if (commonTerms.includes(candidate)) return candidate;
  if (candidate.length === 2) {
    const nearest = commonTerms
      .map((term) => ({ term, gap: Math.abs(Number(term) - Number(candidate)) }))
      .sort((a, b) => a.gap - b.gap)[0];
    if (nearest && nearest.gap <= 12) return nearest.term;
  }
  return candidate;
}

function parsePercentToken(value: string) {
  const match = value.match(/(\d+(?:\.\d+)?)\s*%?/);
  return match ? match[1] : '';
}

function parseLabeledValue(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

export function importQuoteText(rawText: string): QuoteImportResult {
  const text = rawText.trim();
  if (!text) {
    return { parsedDeal: {}, reviewNotes: ['Paste the quote text first.'], matchedFields: [], missingFields: [], fieldReviews: [], feeItemReviews: [], addOnItemReviews: [] };
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsedDeal: Partial<DealState> = {};
  const reviewNotes: string[] = [];
  const matchedFields: string[] = [];
  const missingFields: string[] = [];
  const fieldReviews: ImportFieldReview[] = [];
  const feeItems: DealLineItem[] = [];
  const addOnItems: DealLineItem[] = [];
  const feeItemReviews: ImportLineItemReview[] = [];
  const addOnItemReviews: ImportLineItemReview[] = [];

  const dealershipName = parseLabeledValue(text, [
    /dealer(?:ship)?\s*[:\-]\s*(.+)/i,
    /store\s*[:\-]\s*(.+)/i,
  ]);
  if (dealershipName) {
    parsedDeal.dealershipName = dealershipName;
    matchedFields.push('dealership name');
  }

  const vehiclePrice = parseLabeledValue(text, [
    /(?:selling|sale|vehicle|cash)\s+price\s*[:\-]?\s*\$?([0-9,]+(?:\.\d+)?)/i,
    /market\s+value\s*[:\-]?\s*\$?([0-9,]+(?:\.\d+)?)/i,
    /\bprice\s*[:\-]?\s*\$?([A-Z0-9,]+(?:\.\d+)?)/i,
    /\bvehicle\s*[:\-]?\s*\$?([A-Z0-9,]+(?:\.\d+)?)/i,
  ]);
  if (vehiclePrice) {
    const cleaned = cleanMoneyValue(vehiclePrice);
    parsedDeal.vehiclePrice = cleaned;
    matchedFields.push('vehicle price');
    fieldReviews.push({
      field: 'Vehicle price',
      value: cleaned,
      confidence: cleaned === vehiclePrice ? 'high' : 'medium',
      note: cleaned === vehiclePrice ? 'Matched directly from labeled price text.' : `Cleaned OCR text "${vehiclePrice}" into ${cleaned}.`,
    });
  }

  const apr = parseLabeledValue(text, [
    /\bapr\s*[:\-]?\s*([0-9.]+%?)/i,
    /\brate\s*[:\-]?\s*([0-9.]+%?)/i,
    /\bint(?:erest)?\s+rate\s*[:\-]?\s*([A-Z0-9.]+%?)/i,
    /\bfinance\s+rate\s*[:\-]?\s*([A-Z0-9.]+%?)/i,
  ]);
  if (apr) {
    const cleaned = cleanPercentValue(apr);
    parsedDeal.apr = cleaned;
    matchedFields.push('APR');
    fieldReviews.push({
      field: 'APR',
      value: cleaned,
      confidence: cleaned === apr.replace('%', '') ? 'high' : 'medium',
      note: cleaned === apr.replace('%', '') ? 'Matched directly from labeled APR text.' : `Cleaned OCR text "${apr}" into ${cleaned}%.`,
    });
  }

  const months = parseLabeledValue(text, [
    /\bterm\s*[:\-]?\s*([A-Z0-9]{2,3})\s*(?:months?|mos?)?/i,
    /\b([A-Z0-9]{2,3})\s*(?:months?|mos?)\b/i,
  ]);
  if (months) {
    const cleaned = cleanMonthValue(months);
    parsedDeal.months = cleaned;
    matchedFields.push('term');
    fieldReviews.push({
      field: 'Term',
      value: cleaned,
      confidence: cleaned === months ? 'high' : 'medium',
      note: cleaned === months ? 'Matched directly from the term field.' : `Corrected OCR text "${months}" to ${cleaned} months.`,
    });
  }

  const downPayment = parseLabeledValue(text, [
    /down\s+payment\s*[:\-]?\s*\$?([0-9,]+(?:\.\d+)?)/i,
    /cash\s+down\s*[:\-]?\s*\$?([0-9,]+(?:\.\d+)?)/i,
    /\bdown\s*[:\-]?\s*\$?([A-Z0-9,]+(?:\.\d+)?)/i,
    /\bdp\s*[:\-]?\s*\$?([A-Z0-9,]+(?:\.\d+)?)/i,
  ]);
  if (downPayment) {
    const cleaned = cleanMoneyValue(downPayment);
    parsedDeal.downPayment = cleaned;
    matchedFields.push('down payment');
    fieldReviews.push({
      field: 'Down payment',
      value: cleaned,
      confidence: cleaned === downPayment ? 'high' : 'medium',
      note: cleaned === downPayment ? 'Matched directly from labeled down payment text.' : `Cleaned OCR text "${downPayment}" into ${cleaned}.`,
    });
  }

  const tradeIn = parseLabeledValue(text, [
    /trade(?:-|\s)?(?:in)?\s*(?:value|allowance)?\s*[:\-]?\s*\$?([0-9,]+(?:\.\d+)?)/i,
    /\btrade\s*[:\-]?\s*\$?([A-Z0-9,]+(?:\.\d+)?)/i,
  ]);
  if (tradeIn) {
    const cleaned = cleanMoneyValue(tradeIn);
    parsedDeal.tradeIn = cleaned;
    matchedFields.push('trade-in');
    fieldReviews.push({
      field: 'Trade-in',
      value: cleaned,
      confidence: cleaned === tradeIn ? 'high' : 'medium',
      note: cleaned === tradeIn ? 'Matched directly from the trade field.' : `Cleaned OCR text "${tradeIn}" into ${cleaned}.`,
    });
  }

  for (const line of lines) {
    const moneyMatch = line.match(/\$?\s*([0-9,]+(?:\.\d+)?)/);
    if (!moneyMatch) continue;

    const amount = cleanMoneyValue(moneyMatch[1]);
    const lower = line.toLowerCase();
    const label = line.replace(/\$?\s*[0-9,]+(?:\.\d+)?/g, '').replace(/[:\-]+/g, ' ').trim();
    if (!label) continue;

    if (/(doc|documentation|title|license|registration|prep|dmv|dealer fee|processing|filing|government|tax)/i.test(lower)) {
      const id = `fee-${feeItems.length + 1}`;
      feeItems.push({ id, label, amount });
      feeItemReviews.push({
        id,
        label,
        amount,
        confidence: moneyMatch[1] === amount ? 'high' : 'medium',
        note: moneyMatch[1] === amount ? 'Detected from a printed-looking fee line.' : `Cleaned OCR amount "${moneyMatch[1]}" into ${amount}.`,
      });
      continue;
    }

    if (/(warranty|gap|protection|etch|nitrogen|accessor|maintenance|service contract|fabric|paint|wheel|tire)/i.test(lower)) {
      const id = `addon-${addOnItems.length + 1}`;
      addOnItems.push({ id, label, amount });
      addOnItemReviews.push({
        id,
        label,
        amount,
        confidence: moneyMatch[1] === amount ? 'high' : 'medium',
        note: moneyMatch[1] === amount ? 'Detected from a printed-looking add-on line.' : `Cleaned OCR amount "${moneyMatch[1]}" into ${amount}.`,
      });
    }
  }

  if (feeItems.length > 0) {
    parsedDeal.feeItems = feeItems;
    parsedDeal.feeNames = feeItems.map((item) => item.label).join(', ');
    matchedFields.push('fee line items');
  }

  if (addOnItems.length > 0) {
    parsedDeal.addOnItems = addOnItems;
    matchedFields.push('add-on line items');
  }

  if (!matchedFields.length) {
    reviewNotes.push('No standard quote fields were confidently recognized. Try pasting the itemized quote with labels like price, APR, term, fee, and trade-in.');
  } else {
    reviewNotes.push(`Matched ${matchedFields.join(', ')} from the pasted quote.`);
  }

  if (!feeItems.length) {
    reviewNotes.push('No fee line items were detected automatically. Add them manually if the quote lists doc, title, registration, prep, or taxes.');
  }

  if (!addOnItems.length) {
    reviewNotes.push('No add-on line items were detected automatically. Add them manually if the quote includes warranty, GAP, protection, or accessory products.');
  }

  if (!parsedDeal.vehiclePrice) missingFields.push('Vehicle price');
  if (!parsedDeal.apr) missingFields.push('APR');
  if (!parsedDeal.months) missingFields.push('Term');
  if (!parsedDeal.downPayment && !parsedDeal.tradeIn) missingFields.push('Down payment or trade-in');

  if (missingFields.length > 0) {
    reviewNotes.push(`Still missing: ${missingFields.join(', ')}. Printed documents usually work best; handwritten notes often need manual fill-in.`);
  }

  if (fieldReviews.some((item) => item.confidence === 'medium')) {
    reviewNotes.push('Some imported fields were corrected from OCR-like text and should be confirmed before saving.');
  }

  return { parsedDeal, reviewNotes, matchedFields, missingFields, fieldReviews, feeItemReviews, addOnItemReviews };
}

export function buildOcrRecoverySuggestion(result: QuoteImportResult | null): OcrRecoverySuggestion | null {
  if (!result) return null;

  const lowConfidenceFields = result.fieldReviews.filter((item) => item.confidence === 'medium').map((item) => item.field);
  const suggestions: string[] = [];

  if (lowConfidenceFields.some((item) => item === 'Term')) {
    suggestions.push('Double-check the term carefully. OCR often confuses 60, 66, 68, and GO/80-style text.');
  }
  if (lowConfidenceFields.some((item) => item === 'Vehicle price' || item === 'Down payment' || item === 'Trade-in')) {
    suggestions.push('Large money fields should be checked digit by digit before you apply them.');
  }
  if (result.missingFields.includes('APR')) {
    suggestions.push('If APR did not import, ask for the exact written rate instead of relying on payment-only talk.');
  }
  if (result.missingFields.includes('Down payment or trade-in')) {
    suggestions.push('If the quote includes cash down or a trade, add it manually so the payment analysis is not distorted.');
  }
  if (!result.feeItemReviews.length) {
    suggestions.push('If the worksheet lists doc, title, registration, prep, or tax lines, add them manually so the compare and audit screens stay accurate.');
  }

  if (!lowConfidenceFields.length && !result.missingFields.length && result.feeItemReviews.length > 0) {
    return {
      headline: 'OCR captured the important fields cleanly.',
      detail: 'This import looks relatively clean. A quick manual scan before applying should be enough.',
      lowConfidenceFields: [],
      suggestions: ['Confirm the biggest money fields once, then apply the import.'],
    };
  }

  return {
    headline: lowConfidenceFields.length > 0 ? 'OCR found likely fields that should be confirmed' : 'OCR still needs a little manual help',
    detail:
      lowConfidenceFields.length > 0
        ? 'These fields were recovered from OCR-like text, so a quick confirmation step is worth doing before you rely on them.'
        : 'The import is still useful, but filling the missing fields manually will make the recommendation much more trustworthy.',
    lowConfidenceFields,
    suggestions: suggestions.length > 0 ? suggestions : ['Review the extracted fields and compare them against the original quote before applying.'],
  };
}

export function buildDealAnalysis(deal: DealState, readinessLabel: ReadinessLabel): DealAnalysis {
  const feeTotal = getFeeTotal(deal);
  const addOnTotal = getAddOnTotal(deal);
  const flaggedFees = detectSuspiciousFees(buildFeeNameString(deal));
  const amountFinanced = Math.max(
    0,
    Number(deal.vehiclePrice || 0) +
      feeTotal +
      addOnTotal -
      Number(deal.downPayment || 0) -
      Number(deal.tradeIn || 0)
  );
  const monthlyPayment = estimateMonthlyPayment(amountFinanced, Number(deal.apr || 0), Number(deal.months || 0));
  const totalPaid = monthlyPayment * Number(deal.months || 0);
  const scoreBreakdown: DealAnalysisBreakdownItem[] = [];
  const dealWarnings: string[] = [];

  if (addOnTotal > 1500) {
    dealWarnings.push('Add-ons look high. Review every extra item carefully.');
    addBreakdownItem(scoreBreakdown, 'High add-ons', 1, 'Optional extras are large enough to meaningfully change the deal.', 'warn');
  }

  if (feeTotal > 1000) {
    dealWarnings.push('Dealer fees look high. Ask for a full itemized breakdown.');
    addBreakdownItem(scoreBreakdown, 'High dealer fees', 1, 'Large fee totals often deserve a line-by-line explanation.', 'warn');
  }

  if (Number(deal.months || 0) >= 72) {
    dealWarnings.push('Long loan term. This can hide the real cost of the deal.');
    addBreakdownItem(scoreBreakdown, 'Long term', 1, 'Longer terms lower the payment while increasing total cost.', 'warn');
  }

  if (Number(deal.apr || 0) >= 8) {
    dealWarnings.push('APR may be high. Compare outside financing before agreeing.');
    addBreakdownItem(scoreBreakdown, 'High APR', 1, 'A high interest rate can overwhelm small price concessions.', 'warn');
  }

  if (Number(deal.vehiclePrice || 0) > 0 && addOnTotal / Math.max(Number(deal.vehiclePrice || 1), 1) > 0.08) {
    dealWarnings.push('Add-ons are a large share of the vehicle price.');
    addBreakdownItem(scoreBreakdown, 'Add-on share', 1, 'Extras are consuming a large portion of the base vehicle price.', 'warn');
  }

  if (deal.feeItems.length > 0) {
    addBreakdownItem(scoreBreakdown, 'Structured fee capture', 0, `Captured ${deal.feeItems.length} fee line items instead of relying only on a lump-sum number.`, 'good');
  }

  if (deal.addOnItems.length > 0) {
    addBreakdownItem(scoreBreakdown, 'Structured add-on capture', 0, `Captured ${deal.addOnItems.length} add-on line items for easier negotiation and comparison.`, 'good');
  }

  if (!deal.dealershipName.trim()) {
    addBreakdownItem(scoreBreakdown, 'Missing offer label', 0, 'Naming the offer makes saved comparisons easier to trust later.', 'warn');
  }

  if (flaggedFees.length > 0) {
    addBreakdownItem(scoreBreakdown, 'Suspicious fee keywords', flaggedFees.length, `Detected ${flaggedFees.length} fee labels that usually deserve follow-up questions.`, 'bad');
  }

  if (readinessLabel === 'Not Ready') {
    addBreakdownItem(scoreBreakdown, 'Buyer readiness', 1, 'When your prep is weak, the same deal becomes riskier to judge accurately.', 'warn');
  }

  if (!scoreBreakdown.length) {
    addBreakdownItem(scoreBreakdown, 'No major flags', 0, 'The numbers do not show a major pricing or structure issue yet.', 'good');
  }

  const dangerScore = scoreBreakdown.reduce((sum, item) => sum + item.effect, 0);
  const dealVerdict = buildVerdict(dangerScore);
  const dealGradeTone: Tone = dealVerdict === 'Fair Deal' ? 'good' : dealVerdict === 'Review Carefully' ? 'warn' : 'bad';
  const explanation = [
    `Estimated amount financed: ${currency(amountFinanced)}.`,
    `Estimated monthly payment: ${currency(monthlyPayment)} over ${deal.months || '0'} months.`,
    buildStateContext(deal.buyerStateCode),
  ];

  const dealGuidance =
    dealVerdict === 'Fair Deal'
      ? 'The numbers do not show major warning signs yet. Still review every line item and compare outside financing before signing.'
      : dealVerdict === 'Review Carefully'
        ? 'There are enough warning signs to slow down and ask more questions. Review fees, add-ons, and financing terms one by one.'
        : dealVerdict === 'Bad Deal'
          ? 'This deal shows multiple signs of being overpriced or padded. Ask for a full printed breakdown and remove optional products before moving forward.'
          : 'This deal has enough red flags that walking away may be the smartest choice unless the numbers change significantly.';

  return {
    flaggedFees,
    amountFinanced,
    monthlyPayment,
    totalPaid,
    dealWarnings,
    dangerScore,
    dealVerdict,
    dealGradeTone,
    dealGuidance,
    scoreBreakdown,
    explanation,
    stateContext: buildStateContext(deal.buyerStateCode),
  };
}

export function buildDealConfidence(deal: DealState): DealConfidence {
  const checks = [
    { label: 'Vehicle price', present: !!deal.vehiclePrice.trim() },
    { label: 'Fees', present: getFeeTotal(deal) > 0 || !!deal.dealerFees.trim() },
    { label: 'Add-ons', present: deal.addOnItems.length > 0 || !!deal.addOns.trim() || deal.addOns === '0' },
    { label: 'APR', present: !!deal.apr.trim() },
    { label: 'Term', present: !!deal.months.trim() },
    { label: 'Down payment or trade-in', present: !!deal.downPayment.trim() || !!deal.tradeIn.trim() },
    { label: 'Dealership name', present: !!deal.dealershipName.trim() },
  ];

  const presentFields = checks.filter((item) => item.present).map((item) => item.label);
  const missingFields = checks.filter((item) => !item.present).map((item) => item.label);
  const score = Math.round((presentFields.length / checks.length) * 100);
  const label: DealConfidence['label'] =
    score >= 85 ? 'High confidence' : score >= 60 ? 'Medium confidence' : 'Low confidence';
  const tone: Tone = score >= 85 ? 'good' : score >= 60 ? 'warn' : 'bad';
  const detail =
    tone === 'good'
      ? 'The core pricing and financing fields are filled in, so the recommendation should be relatively trustworthy.'
      : tone === 'warn'
        ? 'The app has enough information to guide you, but a few missing numbers could still change the recommendation.'
        : 'Too many core fields are missing to fully trust the recommendation. Fill in the missing items before making a decision.';

  return {
    score,
    label,
    tone,
    presentFields,
    missingFields,
    detail,
  };
}

export function buildDealInputGuidance(deal: DealState, confidence: DealConfidence): DealInputGuidance {
  const prompts: Record<string, { question: string; reason: string }> = {
    'Vehicle price': {
      question: 'What is the written vehicle selling price before fees and add-ons?',
      reason: 'This keeps the store from hiding markup inside the out-the-door total.',
    },
    Fees: {
      question: 'Can you show every dealer fee line by line on paper?',
      reason: 'Fee detail is where padded or duplicated charges often show up.',
    },
    'Add-ons': {
      question: 'Which products are optional add-ons, and what does each one cost?',
      reason: 'This helps separate the car price from extras you may not want.',
    },
    APR: {
      question: 'What APR are you using on this offer, in writing?',
      reason: 'A payment can look manageable while the rate quietly drives up total cost.',
    },
    Term: {
      question: 'How many months is this loan written for?',
      reason: 'Longer terms can hide a weak deal by lowering the monthly payment.',
    },
    'Down payment or trade-in': {
      question: 'What down payment or trade value are you assuming in these numbers?',
      reason: 'Cash down and trade value can change the payment without improving the deal itself.',
    },
    'Dealership name': {
      question: 'Which dealership and location is this quote from?',
      reason: 'Saving the store name makes comparison, timeline history, and follow-up much easier.',
    },
  };

  const questions = confidence.missingFields.map((label) => ({
    label,
    question: prompts[label]?.question ?? `Can you confirm the written ${label.toLowerCase()} for this offer?`,
    reason: prompts[label]?.reason ?? 'This missing field could still change the recommendation.',
  }));

  if (questions.length === 0) {
    return {
      headline: 'You have the core deal numbers.',
      detail: deal.dealershipName.trim()
        ? 'This quote has enough structure for a stronger review. Focus on negotiating or checking the final contract against the saved offer.'
        : 'This quote has enough structure for a stronger review. Adding the dealership name will make your saved history and comparisons easier to read later.',
      tone: 'good',
      questions: [],
    };
  }

  return {
    headline: questions.length >= 3 ? 'Ask for these missing numbers next' : 'A few key fields are still missing',
    detail:
      questions.length >= 3
        ? 'The recommendation is still useful, but these missing written numbers could change the outcome. Ask for them before you rely on the deal.'
        : 'You are close to a solid review. Filling these last gaps should make the recommendation more trustworthy.',
    tone: questions.length >= 3 ? 'bad' : 'warn',
    questions,
  };
}

export function buildHonestyScore(analysis: DealAnalysis, readinessLabel: ReadinessLabel, activeFlags: NegotiationFlag[]): HonestyScore {
  const breakdown: HonestyScorePart[] = [];

  if (analysis.flaggedFees.length) {
    breakdown.push({
      label: 'Suspicious fees',
      delta: -analysis.flaggedFees.length * 6,
      reason: 'Fee labels like doc, prep, etching, and protection often deserve written clarification.',
    });
  }

  if (analysis.dealWarnings.length) {
    breakdown.push({
      label: 'Deal structure warnings',
      delta: -analysis.dealWarnings.length * 7,
      reason: 'The pricing structure itself shows risk before any live pressure is considered.',
    });
  }

  if (activeFlags.length) {
    breakdown.push({
      label: 'Live pressure flags',
      delta: -activeFlags.length * 8,
      reason: 'Reported negotiation tactics lower the transparency score directly.',
    });
  }

  if (analysis.dealVerdict === 'Review Carefully') {
    breakdown.push({ label: 'Verdict adjustment', delta: -8, reason: 'The deal already deserves more scrutiny.' });
  } else if (analysis.dealVerdict === 'Bad Deal') {
    breakdown.push({ label: 'Verdict adjustment', delta: -18, reason: 'Multiple structural red flags are present.' });
  } else if (analysis.dealVerdict === 'Walk Away') {
    breakdown.push({ label: 'Verdict adjustment', delta: -28, reason: 'The current numbers look risky enough to leave.' });
  }

  if (readinessLabel === 'Not Ready') {
    breakdown.push({ label: 'Buyer readiness', delta: -6, reason: 'Lower readiness makes transparency harder to judge in real time.' });
  }

  let score = 100 + breakdown.reduce((sum, item) => sum + item.delta, 0);
  score = Math.max(0, Math.min(100, score));

  const label = score >= 80 ? 'Transparent' : score >= 60 ? 'Questionable' : score >= 40 ? 'Aggressive' : 'High Risk';
  const tone: Tone = score >= 80 ? 'good' : score >= 60 ? 'warn' : 'bad';
  const notes: string[] = [];

  if (analysis.flaggedFees.length > 0) notes.push('Suspicious fee patterns detected.');
  if (analysis.dealWarnings.length > 0) notes.push('Deal structure shows warning signs.');
  if (activeFlags.length > 0) notes.push('Pressure tactics were reported during negotiation.');
  if (!notes.length) notes.push('No major transparency issues detected yet.');

  return { score, label, tone, notes, breakdown };
}

export function compareSavedDeals(deals: SavedDeal[], readinessLabel: ReadinessLabel) {
  if (!deals.length) return null;

  const ranked = deals
    .map((deal) => {
      const analysis = buildDealAnalysis(deal, readinessLabel);
      const rankScore = analysis.dangerScore * 100000 + analysis.totalPaid;
      return { deal, analysis, rankScore };
    })
    .sort((a, b) => a.rankScore - b.rankScore);

  const winner = ranked[0];
  const runnerUp = ranked[1] || null;
  const reasons: string[] = [];

  if (runnerUp) {
    if (winner.analysis.dangerScore < runnerUp.analysis.dangerScore) {
      reasons.push(`fewer warning signs (${winner.analysis.dangerScore} vs ${runnerUp.analysis.dangerScore})`);
    }
    if (winner.analysis.totalPaid < runnerUp.analysis.totalPaid) {
      reasons.push(`lower estimated total paid (${currency(winner.analysis.totalPaid)} vs ${currency(runnerUp.analysis.totalPaid)})`);
    }
    if (winner.analysis.monthlyPayment < runnerUp.analysis.monthlyPayment) {
      reasons.push(`lower estimated monthly payment (${currency(winner.analysis.monthlyPayment)} vs ${currency(runnerUp.analysis.monthlyPayment)})`);
    }
  }

  return { winner, runnerUp, ranked, reasons };
}

export function buildComparisonInsights(
  firstDeal: SavedDeal,
  secondDeal: SavedDeal,
  firstAnalysis: DealAnalysis,
  secondAnalysis: DealAnalysis
) {
  const insights: ComparisonInsight[] = [];

  const verdictWinner =
    firstAnalysis.dangerScore === secondAnalysis.dangerScore ? 'tie' : firstAnalysis.dangerScore < secondAnalysis.dangerScore ? 'left' : 'right';
  insights.push({
    label: 'Risk profile',
    winner: verdictWinner,
    detail:
      verdictWinner === 'tie'
        ? 'Both offers show a similar number of warning signs.'
        : `${verdictWinner === 'left' ? firstDeal.dealershipName || 'Left offer' : secondDeal.dealershipName || 'Right offer'} carries fewer warning signs.`,
  });

  const totalWinner =
    firstAnalysis.totalPaid === secondAnalysis.totalPaid ? 'tie' : firstAnalysis.totalPaid < secondAnalysis.totalPaid ? 'left' : 'right';
  insights.push({
    label: 'Total paid',
    winner: totalWinner,
    detail:
      totalWinner === 'tie'
        ? 'Both offers land at about the same total paid.'
        : `${totalWinner === 'left' ? firstDeal.dealershipName || 'Left offer' : secondDeal.dealershipName || 'Right offer'} is cheaper by ${currency(
            Math.abs(firstAnalysis.totalPaid - secondAnalysis.totalPaid)
          )}.`,
  });

  const aprFirst = Number(firstDeal.apr || 0);
  const aprSecond = Number(secondDeal.apr || 0);
  const aprWinner = aprFirst === aprSecond ? 'tie' : aprFirst < aprSecond ? 'left' : 'right';
  insights.push({
    label: 'APR',
    winner: aprWinner,
    detail:
      aprWinner === 'tie'
        ? 'Both offers list the same APR.'
        : `${aprWinner === 'left' ? firstDeal.dealershipName || 'Left offer' : secondDeal.dealershipName || 'Right offer'} has the lower APR (${Math.min(
            aprFirst,
            aprSecond
          )}% vs ${Math.max(aprFirst, aprSecond)}%).`,
  });

  const feeFirst = getFeeTotal(firstDeal);
  const feeSecond = getFeeTotal(secondDeal);
  const feeWinner = feeFirst === feeSecond ? 'tie' : feeFirst < feeSecond ? 'left' : 'right';
  insights.push({
    label: 'Fees',
    winner: feeWinner,
    detail:
      feeWinner === 'tie'
        ? 'Fee totals are roughly the same.'
        : `${feeWinner === 'left' ? firstDeal.dealershipName || 'Left offer' : secondDeal.dealershipName || 'Right offer'} is carrying ${currency(
            Math.abs(feeFirst - feeSecond)
          )} less in fees.`,
  });

  const addOnFirst = getAddOnTotal(firstDeal);
  const addOnSecond = getAddOnTotal(secondDeal);
  const addOnWinner = addOnFirst === addOnSecond ? 'tie' : addOnFirst < addOnSecond ? 'left' : 'right';
  insights.push({
    label: 'Add-ons',
    winner: addOnWinner,
    detail:
      addOnWinner === 'tie'
        ? 'Add-on totals are roughly the same.'
        : `${addOnWinner === 'left' ? firstDeal.dealershipName || 'Left offer' : secondDeal.dealershipName || 'Right offer'} is lighter on add-ons by ${currency(
            Math.abs(addOnFirst - addOnSecond)
          )}.`,
  });

  return insights;
}

export function buildCounterOfferMoves(
  targetDeal: SavedDeal,
  benchmarkDeal: SavedDeal,
  targetAnalysis: DealAnalysis,
  benchmarkAnalysis: DealAnalysis
) {
  const moves: CounterOfferMove[] = [];
  const feeGap = Math.max(0, getFeeTotal(targetDeal) - getFeeTotal(benchmarkDeal));
  const addOnGap = Math.max(0, getAddOnTotal(targetDeal) - getAddOnTotal(benchmarkDeal));
  const aprGap = Math.max(0, Number(targetDeal.apr || 0) - Number(benchmarkDeal.apr || 0));
  const monthGap = Math.max(0, Number(targetDeal.months || 0) - Number(benchmarkDeal.months || 0));

  if (feeGap > 0) {
    moves.push({
      title: 'Cut the fee gap',
      detail: `Ask them to reduce or justify at least ${currency(feeGap)} in fees to match the stronger offer.`,
    });
  }

  if (addOnGap > 0) {
    moves.push({
      title: 'Remove add-ons first',
      detail: `Request removal of at least ${currency(addOnGap)} in add-ons before discussing payment.`,
    });
  }

  if (aprGap > 0) {
    moves.push({
      title: 'Match the better APR',
      detail: `Use the competing offer to ask for a rate closer to ${benchmarkDeal.apr || 'the lower'}% instead of ${targetDeal.apr || 'the current'}%.`,
    });
  }

  if (monthGap > 0) {
    moves.push({
      title: 'Avoid stretching the term',
      detail: `They are using ${monthGap} extra months to soften the payment. Ask them to rework the deal at ${benchmarkDeal.months || 'the shorter'} months.`,
    });
  }

  if (!moves.length) {
    moves.push({
      title: 'Pressure the total price instead',
      detail: `This offer is already close on structure. Ask for a cleaner out-the-door number below ${currency(targetAnalysis.totalPaid - benchmarkAnalysis.totalPaid)} in total paid difference.`,
    });
  }

  return moves;
}

export function buildLiveCoachingPlan(selectedTactic: SalesTacticItem, analysis: DealAnalysis, activeFlags: NegotiationFlag[]): LiveCoachingPlan {
  const scripts = [selectedTactic.script];
  const nextQuestions = [
    'Show me the out-the-door price with every fee itemized.',
    'Which of these products are optional, and what is the exact price of each one?',
    'What does this look like at the same APR and a shorter term?',
  ];

  const walkAwayTriggers = [
    'They refuse to print or text the breakdown.',
    'They keep changing payment while dodging total price.',
    'They insist optional products cannot be removed.',
  ];

  if (activeFlags.includes('paymentShift')) {
    scripts.unshift('I am not agreeing to a payment target. Show me the out-the-door price and amount financed.');
    nextQuestions.unshift('What is the out-the-door number before we discuss monthly payment?');
  }

  if (activeFlags.includes('todayOnly')) {
    scripts.unshift('If the numbers are fair, I can review them and come back. I do not sign because of a deadline.');
    nextQuestions.push('Will you honor this same breakdown if I come back after reviewing it?');
    walkAwayTriggers.unshift('They use urgency to stop you from reviewing the numbers.');
  }

  if (activeFlags.includes('managerTrip')) {
    scripts.unshift('That is fine. When you come back, bring the full written breakdown and your best number.');
    nextQuestions.push('What exactly changed after talking to the manager: price, fee, APR, or term?');
  }

  if (activeFlags.includes('bundleAddOn')) {
    scripts.unshift('Itemize every add-on separately and remove anything optional.');
    nextQuestions.unshift('Which products are optional, and what is the stand-alone price of each one?');
    walkAwayTriggers.unshift('They say add-ons are mandatory but will not show them separately.');
  }

  if (activeFlags.includes('wontPrint')) {
    nextQuestions.unshift('Can you print or text me this breakdown before we go any further?');
    scripts.unshift('I do not move forward without the numbers in writing.');
  }

  if (activeFlags.includes('tradeMix')) {
    nextQuestions.unshift('Please separate vehicle price, trade-in value, and financing into three different numbers.');
    scripts.unshift('Let us separate the vehicle price, trade-in, and financing one at a time.');
  }

  if (analysis.dealVerdict === 'Walk Away') {
    walkAwayTriggers.unshift('The current numbers already score as Walk Away.');
  }

  const uniqueScripts = Array.from(new Set(scripts));
  const uniqueQuestions = Array.from(new Set(nextQuestions));
  const uniqueTriggers = Array.from(new Set(walkAwayTriggers));

  return {
    headline:
      activeFlags.length > 0
        ? `Pressure detected: ${activeFlags.length} tactic${activeFlags.length === 1 ? '' : 's'} active. Stay on the written numbers, not the story.`
        : `${selectedTactic.tactic}: stay on the written numbers, not the story.`,
    immediateScript: uniqueScripts[0] ?? selectedTactic.script,
    nextQuestions: uniqueQuestions,
    walkAwayTriggers: uniqueTriggers,
  };
}

export function buildLiveResponsePack(
  selectedTactic: SalesTacticItem,
  analysis: DealAnalysis,
  activeFlags: NegotiationFlag[]
): LiveResponsePack {
  const responses = [
    {
      label: 'Say this now',
      script: selectedTactic.script,
      reason: 'This answers the current tactic without arguing about their story.',
    },
    {
      label: 'Bring it back to paper',
      script: 'Please show me the full out-the-door number, APR, term, and every fee in writing before we go further.',
      reason: 'Written numbers are harder to manipulate than verbal payment talk.',
    },
    {
      label: 'Clean exit line',
      script: 'I am going to pause here and review the written breakdown before I make any decision.',
      reason: 'A calm exit line protects you from rushed signing pressure.',
    },
  ];

  if (activeFlags.includes('paymentShift')) {
    responses.unshift({
      label: 'Stop the payment pivot',
      script: 'Do not move me to a payment target. Show me the out-the-door price and amount financed first.',
      reason: 'This keeps them from stretching term or rate to make the payment look smaller.',
    });
  }

  if (activeFlags.includes('bundleAddOn')) {
    responses.unshift({
      label: 'Strip add-ons out',
      script: 'Itemize each add-on separately and remove anything optional before we continue.',
      reason: 'Optional products often carry the biggest hidden markup.',
    });
  }

  if (activeFlags.includes('wontPrint')) {
    responses.unshift({
      label: 'Demand the written breakdown',
      script: 'If you cannot print or text the breakdown, I am not moving forward with this deal.',
      reason: 'Refusing to put the numbers in writing is a major transparency warning.',
    });
  }

  if (activeFlags.includes('todayOnly')) {
    responses.push({
      label: 'Defuse urgency',
      script: 'If the numbers are fair today, they should still be fair after I review them carefully.',
      reason: 'This breaks the false deadline and gives you room to think.',
    });
  }

  if (activeFlags.includes('tradeMix')) {
    responses.push({
      label: 'Separate the trade',
      script: 'Please separate vehicle price, trade value, payoff, and financing into distinct written numbers.',
      reason: 'Mixing the trade into the payment can hide where the deal actually changed.',
    });
  }

  if (analysis.dealVerdict === 'Walk Away') {
    responses.push({
      label: 'Final boundary',
      script: 'These numbers are not workable for me, so I am leaving unless the full structure changes in writing.',
      reason: 'When the structure already scores as a walk-away deal, a firmer boundary is appropriate.',
    });
  }

  return {
    headline:
      activeFlags.length > 0
        ? 'Use these lines to keep control of the conversation when pressure starts.'
        : 'Use these lines to keep the conversation grounded in written numbers.',
    responses: Array.from(new Map(responses.map((item) => [item.script, item])).values()).slice(0, 6),
  };
}

export function buildNegotiationSimulator(
  selectedTactic: SalesTacticItem,
  analysis: DealAnalysis,
  activeFlags: NegotiationFlag[]
): NegotiationSimulationTurn[] {
  const turns: NegotiationSimulationTurn[] = [
    {
      title: 'Payment pivot',
      salespersonLine: 'What monthly payment are you trying to stay under?',
      bestResponse: 'I am deciding from the written out-the-door price, APR, and term first. Show me those numbers before we talk payment.',
      ifYouFold: 'The conversation moves away from total cost and into a payment-focused structure they can manipulate.',
      ifYouHold: 'You keep the discussion grounded in numbers that are harder to hide.',
    },
    {
      title: 'Urgency pressure',
      salespersonLine: 'This deal is only good if you sign today.',
      bestResponse: 'If the numbers are fair on paper, I can review them and come back. I do not sign because of a deadline.',
      ifYouFold: 'Urgency can force a rushed decision before you verify fees, add-ons, or contract changes.',
      ifYouHold: 'You regain time to compare, think, and verify the written breakdown.',
    },
  ];

  if (activeFlags.includes('bundleAddOn') || analysis.dealWarnings.some((item) => item.toLowerCase().includes('add-ons'))) {
    turns.push({
      title: 'Mandatory add-on push',
      salespersonLine: 'That package is already on every car, so it stays.',
      bestResponse: 'Itemize every product separately and show me which ones are required by law versus optional dealer products.',
      ifYouFold: 'Optional profit products stay hidden inside the deal structure.',
      ifYouHold: 'You force the store to separate mandatory charges from markup and add-ons.',
    });
  }

  turns.push({
    title: selectedTactic.tactic,
    salespersonLine: selectedTactic.line,
    bestResponse: selectedTactic.script,
    ifYouFold: 'The salesperson keeps control of the frame and you lose clarity about what changed.',
    ifYouHold: 'You answer with a prepared line and move the conversation back to the written numbers.',
  });

  return turns.slice(0, 4);
}

function pushPlaybookStep(steps: SessionPlaybookStep[], title: string, detail: string, tone: Tone) {
  steps.push({ title, detail, tone });
}

export function buildSessionPlaybook(
  analysis: DealAnalysis,
  liveCoachingPlan: LiveCoachingPlan,
  recommendation: DealActionRecommendation,
  negotiationPlan: NegotiationPlan,
  marketBenchmarkAssessment: MarketBenchmarkAssessment | null,
  tradeInAssessment: TradeInAssessment | null,
  paperworkAudit: PaperworkAudit | null
): SessionPlaybook {
  const steps: SessionPlaybookStep[] = [];

  pushPlaybookStep(steps, 'Start with the anchor', liveCoachingPlan.immediateScript, 'good');

  if (marketBenchmarkAssessment) {
    pushPlaybookStep(steps, 'Use your research', marketBenchmarkAssessment.negotiationScript, marketBenchmarkAssessment.tone);
  }

  if (tradeInAssessment) {
    pushPlaybookStep(steps, 'Separate the trade', tradeInAssessment.negotiationScript, tradeInAssessment.tone);
  }

  pushPlaybookStep(steps, 'Push the next best move', negotiationPlan.strongestMove, recommendation.tone);

  if (liveCoachingPlan.nextQuestions.length > 0) {
    pushPlaybookStep(steps, 'Ask these questions next', liveCoachingPlan.nextQuestions.slice(0, 3).join(' '), 'warn');
  }

  if (paperworkAudit) {
    pushPlaybookStep(steps, 'Before signing', paperworkAudit.headline, paperworkAudit.summaryTone);
  } else {
    pushPlaybookStep(steps, 'Before signing', 'Run the final paperwork audit against the buyer order or contract before agreeing to anything.', 'warn');
  }

  if (liveCoachingPlan.walkAwayTriggers.length > 0) {
    pushPlaybookStep(steps, 'Walk away if this happens', liveCoachingPlan.walkAwayTriggers.slice(0, 3).join(' '), 'bad');
  }

  return {
    headline: `${recommendation.action} plan: follow this order so the conversation stays on written numbers, not pressure.`,
    steps,
  };
}

function roundCurrencyValue(value: number) {
  return Math.round(value);
}

function pushScenario(
  scenarios: NegotiationPlan['scenarios'],
  title: string,
  detail: string,
  script: string,
  baseline: DealAnalysis,
  candidate: DealAnalysis,
  tradeoff?: string
) {
  const monthlyChange = roundCurrencyValue(baseline.monthlyPayment - candidate.monthlyPayment);
  const totalChange = roundCurrencyValue(baseline.totalPaid - candidate.totalPaid);

  if (totalChange <= 0 && monthlyChange <= 0) return;

  scenarios.push({
    title,
    detail,
    monthlyChange,
    totalChange,
    script,
    tradeoff,
  });
}

export function buildNegotiationPlan(deal: DealState, analysis: DealAnalysis): NegotiationPlan {
  const scenarios: NegotiationPlan['scenarios'] = [];
  const vehiclePrice = Number(deal.vehiclePrice || 0);
  const feeTotal = getFeeTotal(deal);
  const addOnTotal = getAddOnTotal(deal);
  const apr = Number(deal.apr || 0);
  const months = Number(deal.months || 0);

  if (vehiclePrice > 0) {
    const targetDiscount = Math.max(500, Math.min(1500, Math.round(vehiclePrice * 0.02)));
    const discountedDeal = {
      ...deal,
      vehiclePrice: String(Math.max(0, vehiclePrice - targetDiscount)),
    };
    pushScenario(
      scenarios,
      'Lower the vehicle price',
      `A ${currency(targetDiscount)} price cut would reduce the real cost without playing games with the loan structure.`,
      `I want the vehicle price reduced by at least ${currency(targetDiscount)} before we talk about payment again.`,
      analysis,
      buildDealAnalysis(discountedDeal, 'Strong')
    );
  }

  if (addOnTotal > 0) {
    const noAddOnDeal = {
      ...deal,
      addOns: '0',
      addOnItems: [],
    };
    pushScenario(
      scenarios,
      'Remove optional add-ons',
      `Dropping the current add-ons would remove ${currency(addOnTotal)} from the deal structure immediately.`,
      'Please remove every optional add-on and show me a clean buyer order with only the vehicle and required fees.',
      analysis,
      buildDealAnalysis(noAddOnDeal, 'Strong')
    );
  }

  if (feeTotal > 500) {
    const targetFeeTotal = 500;
    const trimmedFeeDeal = {
      ...deal,
      dealerFees: String(targetFeeTotal),
      feeItems: [],
      feeNames: deal.feeNames,
    };
    pushScenario(
      scenarios,
      'Trim the fee stack',
      `Bringing fees closer to ${currency(targetFeeTotal)} would cut out about ${currency(feeTotal - targetFeeTotal)} in extra charges.`,
      `These fees are too high. Bring the fee total closer to ${currency(targetFeeTotal)} or itemize why each dollar belongs there.`,
      analysis,
      buildDealAnalysis(trimmedFeeDeal, 'Strong')
    );
  }

  if (apr > 5.9 && months > 0) {
    const targetApr = Math.max(3.9, Number((apr - (apr >= 8 ? 2 : 1)).toFixed(1)));
    const lowerRateDeal = {
      ...deal,
      apr: String(targetApr),
    };
    pushScenario(
      scenarios,
      'Push for a better APR',
      `Moving the APR from ${apr}% to about ${targetApr}% would lower the finance charge without changing the vehicle itself.`,
      `If you want this deal to work, match a rate closer to ${targetApr}% and put that in writing.`,
      analysis,
      buildDealAnalysis(lowerRateDeal, 'Strong')
    );
  }

  if (months > 60) {
    const shorterTermDeal = {
      ...deal,
      months: '60',
    };
    const shorterTermAnalysis = buildDealAnalysis(shorterTermDeal, 'Strong');
    const monthlyChange = roundCurrencyValue(analysis.monthlyPayment - shorterTermAnalysis.monthlyPayment);
    const totalChange = roundCurrencyValue(analysis.totalPaid - shorterTermAnalysis.totalPaid);

    if (totalChange > 0) {
      scenarios.push({
        title: 'Stop payment stretching',
        detail: 'A shorter term exposes the real payment and cuts interest cost, even if the monthly number rises.',
        monthlyChange,
        totalChange,
        script: 'Rework this at 60 months so I can see the honest payment instead of a stretched term.',
        tradeoff:
          monthlyChange < 0
            ? `Monthly payment would increase by about ${currency(Math.abs(monthlyChange))}, but total paid would drop by about ${currency(totalChange)}.`
            : undefined,
      });
    }
  }

  const rankedScenarios = scenarios
    .sort((left, right) => {
      if (right.totalChange !== left.totalChange) return right.totalChange - left.totalChange;
      return right.monthlyChange - left.monthlyChange;
    })
    .slice(0, 4);

  const strongestMove =
    rankedScenarios[0]?.script ??
    'Keep the focus on out-the-door price, written fees, APR, and term instead of monthly payment alone.';

  const headline = rankedScenarios.length
    ? `The cleanest upside right now is ${currency(rankedScenarios[0].totalChange)} in estimated total savings.`
    : 'The numbers are already fairly clean. Press for a better written out-the-door price instead of chasing payment changes.';

  return {
    headline,
    strongestMove,
    scenarios: rankedScenarios,
  };
}

function deltaDirection(value: number, betterWhenLower = true) {
  if (value === 0) return 'unchanged';
  if (betterWhenLower) return value < 0 ? 'down' : 'up';
  return value > 0 ? 'up' : 'down';
}

function currencyDelta(value: number) {
  const absolute = currency(Math.abs(value));
  return value === 0 ? absolute : `${value > 0 ? '+' : '-'}${absolute}`;
}

export function buildOfferTimeline(savedDeals: SavedDeal[], seriesId: string, readinessLabel: ReadinessLabel): OfferTimelineEntry[] {
  const seriesDeals = savedDeals
    .filter((deal) => deal.seriesId === seriesId)
    .sort((left, right) => left.revisionNumber - right.revisionNumber || left.savedAt.localeCompare(right.savedAt));

  return seriesDeals.map((deal, index) => {
    const analysis = buildDealAnalysis(deal, readinessLabel);
    const previous = seriesDeals[index - 1] ?? null;
    const insights: OfferRevisionInsight[] = [];

    if (!previous) {
      insights.push({
        label: 'Opening position',
        tone: 'warn',
        detail: 'This is the first saved version of the offer, so future revisions will be compared against it.',
      });
    } else {
      const previousAnalysis = buildDealAnalysis(previous, readinessLabel);
      const totalDelta = analysis.totalPaid - previousAnalysis.totalPaid;
      const monthlyDelta = analysis.monthlyPayment - previousAnalysis.monthlyPayment;
      const aprDelta = Number(deal.apr || 0) - Number(previous.apr || 0);
      const termDelta = Number(deal.months || 0) - Number(previous.months || 0);
      const feeDelta = getFeeTotal(deal) - getFeeTotal(previous);
      const addOnDelta = getAddOnTotal(deal) - getAddOnTotal(previous);

      if (totalDelta !== 0) {
        insights.push({
          label: 'Total paid',
          tone: totalDelta < 0 ? 'good' : 'bad',
          detail: `Estimated total paid moved ${deltaDirection(totalDelta)} ${currency(Math.abs(totalDelta))} compared with the last revision.`,
        });
      }

      if (aprDelta !== 0) {
        insights.push({
          label: 'APR shift',
          tone: aprDelta < 0 ? 'good' : 'bad',
          detail: `APR moved from ${previous.apr || '0'}% to ${deal.apr || '0'}%.`,
        });
      }

      if (termDelta !== 0) {
        insights.push({
          label: 'Term change',
          tone: termDelta < 0 ? 'good' : 'warn',
          detail: `Loan term changed from ${previous.months || '0'} to ${deal.months || '0'} months.`,
        });
      }

      if (feeDelta !== 0 || addOnDelta !== 0) {
        insights.push({
          label: 'Packaged extras',
          tone: feeDelta + addOnDelta <= 0 ? 'good' : 'bad',
          detail: `Fees changed ${currencyDelta(feeDelta)} and add-ons changed ${currencyDelta(addOnDelta)}.`,
        });
      }

      if (monthlyDelta !== 0 && termDelta !== 0 && monthlyDelta <= 0 && totalDelta >= 0) {
        insights.push({
          label: 'Payment game',
          tone: 'bad',
          detail: 'The payment fell, but the overall deal did not improve. This often means the term was stretched to hide cost.',
        });
      }

      if (!insights.length) {
        insights.push({
          label: 'Minimal movement',
          tone: 'warn',
          detail: 'This revision looks very close to the previous one. Ask them what truly changed in writing.',
        });
      }
    }

    return { deal, analysis, insights };
  });
}

export function buildDealActionRecommendation(
  deal: DealState,
  analysis: DealAnalysis,
  negotiationPlan: NegotiationPlan
): DealActionRecommendation {
  if (analysis.dealVerdict === 'Walk Away' || analysis.dangerScore >= 6) {
    return {
      action: 'Leave',
      tone: 'bad',
      headline: 'Leave unless the structure changes materially.',
      detail: 'The current mix of price, fees, add-ons, APR, or loan term is risky enough that walking away is the safest call right now.',
    };
  }

  const bestScenario = negotiationPlan.scenarios[0] ?? null;

  if (analysis.dealVerdict === 'Fair Deal' && analysis.flaggedFees.length === 0 && analysis.dealWarnings.length <= 1) {
    return {
      action: 'Buy',
      tone: 'good',
      headline: 'This is close to a signable deal.',
      detail: 'The structure looks comparatively clean. Keep the written breakdown, confirm optional products are removed, and only move forward if the final contract matches this offer.',
      targetTotalPaid: Math.round(analysis.totalPaid),
      targetMonthlyPayment: Math.round(analysis.monthlyPayment),
    };
  }

  return {
    action: 'Counter',
    tone: 'warn',
    headline: bestScenario
      ? `Counter with the ${bestScenario.title.toLowerCase()} ask first.`
      : 'Counter on the written out-the-door total first.',
    detail: bestScenario
      ? `${bestScenario.detail} Use the suggested script and make them respond to that number in writing.`
      : 'There is still room to improve the structure. Keep the focus on total paid, required fees, APR, and term.',
    targetTotalPaid: bestScenario ? Math.max(0, Math.round(analysis.totalPaid - bestScenario.totalChange)) : Math.round(analysis.totalPaid),
    targetMonthlyPayment: bestScenario ? Math.max(0, Math.round(analysis.monthlyPayment - bestScenario.monthlyChange)) : Math.round(analysis.monthlyPayment),
  };
}

export function buildWhatIfComparison(currentDeal: DealState, scenarioDeal: DealState, readinessLabel: ReadinessLabel): WhatIfComparison {
  const currentAnalysis = buildDealAnalysis(currentDeal, readinessLabel);
  const scenarioAnalysis = buildDealAnalysis(scenarioDeal, readinessLabel);
  const monthlyDifference = Math.round(scenarioAnalysis.monthlyPayment - currentAnalysis.monthlyPayment);
  const totalDifference = Math.round(scenarioAnalysis.totalPaid - currentAnalysis.totalPaid);
  const fieldChanges: WhatIfFieldChange[] = [];

  const maybeAddChange = (label: string, currentValue: string, scenarioValue: string, impact: string) => {
    if ((currentValue || '') === (scenarioValue || '')) return;
    fieldChanges.push({ label, currentValue: currentValue || 'Not entered', scenarioValue: scenarioValue || 'Not entered', impact });
  };

  maybeAddChange('Vehicle price', currentDeal.vehiclePrice, scenarioDeal.vehiclePrice, 'Directly changes the base amount you are financing.');
  maybeAddChange('Fees', String(getFeeTotal(currentDeal) || ''), String(getFeeTotal(scenarioDeal) || ''), 'Lower fees reduce financed amount without changing the car.');
  maybeAddChange('Add-ons', String(getAddOnTotal(currentDeal) || ''), String(getAddOnTotal(scenarioDeal) || ''), 'Removing optional products is often the fastest clean savings lever.');
  maybeAddChange('APR', currentDeal.apr, scenarioDeal.apr, 'APR changes affect the payment and total cost across the whole loan.');
  maybeAddChange('Term', currentDeal.months, scenarioDeal.months, 'Term changes can lower the payment but may raise total paid if stretched out.');
  maybeAddChange('Down payment', currentDeal.downPayment, scenarioDeal.downPayment, 'More cash down can lower the payment without fixing a weak structure.');
  maybeAddChange('Trade-in', currentDeal.tradeIn, scenarioDeal.tradeIn, 'A stronger trade offer can improve the deal if the price stays honest.');

  const biggestWins: string[] = [];
  if (Number(currentDeal.apr || 0) > Number(scenarioDeal.apr || 0) && Number(scenarioDeal.apr || 0) > 0) {
    biggestWins.push(`rate closer to ${scenarioDeal.apr}%`);
  }
  if (getAddOnTotal(currentDeal) > getAddOnTotal(scenarioDeal)) {
    biggestWins.push(`remove about ${currency(Math.max(0, getAddOnTotal(currentDeal) - getAddOnTotal(scenarioDeal)))} in add-ons`);
  }
  if (getFeeTotal(currentDeal) > getFeeTotal(scenarioDeal)) {
    biggestWins.push(`cut about ${currency(Math.max(0, getFeeTotal(currentDeal) - getFeeTotal(scenarioDeal)))} in fees`);
  }
  if (Number(currentDeal.vehiclePrice || 0) > Number(scenarioDeal.vehiclePrice || 0) && Number(scenarioDeal.vehiclePrice || 0) > 0) {
    biggestWins.push(`bring vehicle price closer to ${currency(Number(scenarioDeal.vehiclePrice || 0))}`);
  }

  const strongestMove =
    biggestWins.length > 0
      ? `Rework this using ${biggestWins.slice(0, 2).join(' and ')}. Show me the full written breakdown with those exact changes.`
      : 'Use this scenario to ask for a cleaner written structure and make the store respond line by line.';

  const tone: Tone = totalDifference <= -2000 ? 'good' : totalDifference < 0 ? 'warn' : totalDifference > 1500 ? 'bad' : 'warn';
  const headline =
    totalDifference < 0
      ? `This scenario could save about ${currency(Math.abs(totalDifference))} overall and ${currency(Math.abs(monthlyDifference))} per month.`
      : totalDifference > 0
        ? `This scenario actually looks about ${currency(totalDifference)} more expensive overall.`
        : 'This scenario keeps the cost about the same overall.';

  const detail =
    totalDifference < 0
      ? 'Use this as a negotiation anchor. If the dealership cannot match something close to this structure on paper, the current deal may not be the best version available.'
      : totalDifference > 0
        ? 'This is a useful reminder that some lower-payment scenarios still cost more overall. Watch term extensions and hidden extras.'
        : 'This scenario is mainly a structure check. Compare the changed fields carefully before deciding whether it really helps you.';

  return {
    headline,
    detail,
    tone,
    currentMonthlyPayment: currentAnalysis.monthlyPayment,
    scenarioMonthlyPayment: scenarioAnalysis.monthlyPayment,
    monthlyDifference,
    currentTotalPaid: currentAnalysis.totalPaid,
    scenarioTotalPaid: scenarioAnalysis.totalPaid,
    totalDifference,
    fieldChanges,
    strongestMove,
  };
}

export function buildPressureSummary(incidents: PressureIncident[], activeFlags: NegotiationFlag[], dealershipName: string) {
  const normalizedDealer = dealershipName.trim().toLowerCase();
  const filtered = normalizedDealer
    ? incidents.filter((incident) => incident.dealershipName.trim().toLowerCase() === normalizedDealer)
    : incidents;

  const counts = new Map<NegotiationFlag, number>();
  filtered.forEach((incident) => {
    counts.set(incident.flag, (counts.get(incident.flag) ?? 0) + 1);
  });

  const repeatedFlags = Array.from(counts.entries())
    .filter(([, count]) => count >= 2)
    .sort((left, right) => right[1] - left[1]);

  const headline = normalizedDealer
    ? filtered.length > 0
      ? `${filtered.length} pressure event${filtered.length === 1 ? '' : 's'} logged for this dealership.`
      : 'No pressure events logged for this dealership yet.'
    : incidents.length > 0
      ? `${incidents.length} pressure event${incidents.length === 1 ? '' : 's'} logged across sessions.`
      : 'No pressure events logged yet.';

  const notes: string[] = [];
  if (activeFlags.length > 0) {
    notes.push(`Current live session shows ${activeFlags.length} active tactic${activeFlags.length === 1 ? '' : 's'}.`);
  }
  if (repeatedFlags.length > 0) {
    notes.push(
      `Repeated pattern: ${repeatedFlags
        .map(([flag, count]) => `${flag} (${count}x)`)
        .join(', ')}.`
    );
  }
  if (!notes.length && filtered.length > 0) {
    notes.push('A few isolated tactics have been logged, but there is not a repeated pattern yet.');
  }
  if (!notes.length) {
    notes.push('Use the live toggles whenever a tactic shows up so the session record becomes more useful over time.');
  }

  return {
    headline,
    notes,
    recent: filtered
      .slice()
      .sort((left, right) => right.notedAt.localeCompare(left.notedAt))
      .slice(0, 6),
  };
}

export function buildPersonalizedInsight(
  savedDeals: SavedDeal[],
  incidents: PressureIncident[],
  promises: PromiseRecord[],
  dealershipName: string
): PersonalizedInsight {
  const normalizedDealer = dealershipName.trim().toLowerCase();
  const relatedDeals = normalizedDealer
    ? savedDeals.filter((deal) => deal.dealershipName.trim().toLowerCase() === normalizedDealer)
    : savedDeals;
  const relatedIncidents = normalizedDealer
    ? incidents.filter((incident) => incident.dealershipName.trim().toLowerCase() === normalizedDealer)
    : incidents;
  const relatedPromises = normalizedDealer
    ? promises.filter((promise) => promise.dealershipName.trim().toLowerCase() === normalizedDealer)
    : promises;

  const bullets: string[] = [];

  if (relatedDeals.length >= 2) {
    bullets.push(`You have already saved ${relatedDeals.length} offer revisions for this dealership, so compare what actually changed before trusting a “new” quote.`);
  }
  if (relatedIncidents.length >= 2) {
    bullets.push(`This dealership has logged ${relatedIncidents.length} pressure incidents in your history. Slow the pace down and keep asking for written numbers.`);
  }
  if (relatedPromises.some((promise) => promise.status === 'broken')) {
    bullets.push('At least one prior promise has already been marked broken here. Do not rely on verbal reassurance.');
  }

  const allIncidentCounts = new Map<NegotiationFlag, number>();
  incidents.forEach((incident) => {
    allIncidentCounts.set(incident.flag, (allIncidentCounts.get(incident.flag) ?? 0) + 1);
  });
  const topPattern = Array.from(allIncidentCounts.entries()).sort((left, right) => right[1] - left[1])[0] ?? null;
  if (topPattern && topPattern[1] >= 2) {
    bullets.push(`Your most common pressure pattern so far is "${topPattern[0]}". Be ready for it early.`);
  }

  if (!bullets.length) {
    bullets.push('You do not have much pattern history yet, so focus on capturing this visit cleanly with imports, pressure logs, and the signing checkpoint.');
  }

  return {
    headline: normalizedDealer ? 'What your history says about this dealership' : 'What your recent deal history suggests',
    detail: normalizedDealer
      ? 'DealShield is starting to build memory across revisions, promises, and pressure tactics so you do not have to rely on instinct alone.'
      : 'DealShield is starting to learn where your negotiation friction tends to happen.',
    bullets: bullets.slice(0, 4),
  };
}

export function buildPromiseSummary(promises: PromiseRecord[], dealershipName: string): PromiseSummary {
  const normalizedDealer = dealershipName.trim().toLowerCase();
  const filtered = normalizedDealer
    ? promises.filter((promise) => promise.dealershipName.trim().toLowerCase() === normalizedDealer)
    : promises;

  const openCount = filtered.filter((promise) => promise.status === 'open').length;
  const keptCount = filtered.filter((promise) => promise.status === 'kept').length;
  const brokenCount = filtered.filter((promise) => promise.status === 'broken').length;

  const headline = normalizedDealer
    ? filtered.length > 0
      ? `${filtered.length} promise${filtered.length === 1 ? '' : 's'} logged for this dealership.`
      : 'No promises logged for this dealership yet.'
    : promises.length > 0
      ? `${promises.length} promises logged across sessions.`
      : 'No promises logged yet.';

  return {
    headline,
    openCount,
    keptCount,
    brokenCount,
    recent: filtered
      .slice()
      .sort((left, right) => right.notedAt.localeCompare(left.notedAt))
      .slice(0, 8),
  };
}

export function buildDealerScorecards(
  savedDeals: SavedDeal[],
  pressureIncidents: PressureIncident[],
  promises: PromiseRecord[],
  readinessLabel: ReadinessLabel
): DealerScorecard[] {
  const dealershipNames = new Set<string>();

  savedDeals.forEach((deal) => dealershipNames.add(deal.dealershipName.trim() || 'Unnamed dealership'));
  pressureIncidents.forEach((incident) => dealershipNames.add(incident.dealershipName.trim() || 'Unnamed dealership'));
  promises.forEach((promise) => dealershipNames.add(promise.dealershipName.trim() || 'Unnamed dealership'));

  return Array.from(dealershipNames)
    .map((dealershipName) => {
      const normalized = dealershipName.trim().toLowerCase();
      const dealerDeals = savedDeals.filter((deal) => (deal.dealershipName.trim() || 'Unnamed dealership').toLowerCase() === normalized);
      const dealerIncidents = pressureIncidents.filter((incident) => (incident.dealershipName.trim() || 'Unnamed dealership').toLowerCase() === normalized);
      const dealerPromises = promises.filter((promise) => (promise.dealershipName.trim() || 'Unnamed dealership').toLowerCase() === normalized);

      const latestDeal =
        dealerDeals
          .slice()
          .sort((left, right) => right.savedAt.localeCompare(left.savedAt))[0] ?? null;
      const latestAnalysis = latestDeal ? buildDealAnalysis(latestDeal, readinessLabel) : null;
      const brokenPromiseCount = dealerPromises.filter((promise) => promise.status === 'broken').length;
      const keptPromiseCount = dealerPromises.filter((promise) => promise.status === 'kept').length;
      const pressureCount = dealerIncidents.length;

      const riskSignals =
        pressureCount +
        brokenPromiseCount * 2 +
        (latestAnalysis ? latestAnalysis.dangerScore : 0);

      const tone: Tone = riskSignals >= 6 ? 'bad' : riskSignals >= 3 ? 'warn' : 'good';
      const headline =
        tone === 'bad'
          ? 'Pattern shows meaningful caution signs.'
          : tone === 'warn'
            ? 'Some issues are showing up across the deal and behavior history.'
            : 'History looks relatively clean so far.';

      const latestVerdict: DealerScorecard['latestVerdict'] = latestAnalysis ? latestAnalysis.dealVerdict : 'No saved offer yet';

      return {
        dealershipName,
        tone,
        headline,
        revisionCount: dealerDeals.length,
        pressureCount,
        brokenPromiseCount,
        keptPromiseCount,
        latestVerdict,
        latestTotalPaid: latestAnalysis ? latestAnalysis.totalPaid : null,
      };
    })
    .sort((left, right) => {
      const toneRank = { bad: 0, warn: 1, good: 2 };
      if (toneRank[left.tone] !== toneRank[right.tone]) return toneRank[left.tone] - toneRank[right.tone];
      return left.dealershipName.localeCompare(right.dealershipName);
    });
}

export function buildDealerReputationReports(
  scorecards: DealerScorecard[],
  visitTimeline: VisitTimelineEntry[]
): DealerReputationReport[] {
  return scorecards.map((scorecard) => {
    const relatedEntries = visitTimeline.filter(
      (entry) => entry.dealershipName.trim().toLowerCase() === scorecard.dealershipName.trim().toLowerCase()
    );
    const trustScore = Math.max(
      0,
      100 -
        scorecard.pressureCount * 10 -
        scorecard.brokenPromiseCount * 18 -
        Math.max(0, scorecard.revisionCount - 1) * 4
    );
    const tone: Tone = trustScore >= 75 ? 'good' : trustScore >= 50 ? 'warn' : 'bad';
    const highlights = [
      `${scorecard.pressureCount} pressure incident${scorecard.pressureCount === 1 ? '' : 's'} logged`,
      `${scorecard.keptPromiseCount} kept / ${scorecard.brokenPromiseCount} broken promise${scorecard.brokenPromiseCount === 1 ? '' : 's'}`,
      `${relatedEntries.length} timeline event${relatedEntries.length === 1 ? '' : 's'} captured`,
    ];

    return {
      dealershipName: scorecard.dealershipName,
      trustScore,
      tone,
      headline:
        tone === 'good'
          ? 'History looks comparatively consistent so far.'
          : tone === 'warn'
            ? 'Mixed trust signals are showing up across this dealership history.'
            : 'This dealership is building a risk pattern across offers and behavior.',
      highlights,
    };
  });
}

function createFeatureCard(title: string, detail: string, tier: PremiumTier): MonetizationFeatureCard {
  return {
    title,
    detail,
    badge: tier === 'pro' ? 'Unlocked in Pro' : 'Pro feature',
    unlocked: tier === 'pro',
  };
}

export function buildMonetizationSummary(
  subscription: SubscriptionState,
  savedDeals: SavedDeal[],
  pressureIncidents: PressureIncident[],
  promises: PromiseRecord[]
): MonetizationSummary {
  const tier = subscription.tier;
  const reasons: string[] = [];

  if (savedDeals.length >= 2) {
    reasons.push(`You already have ${savedDeals.length} saved offers, so Pro comparison tools and dealer scorecards can help you choose between them.`);
  }

  if (pressureIncidents.length > 0) {
    reasons.push(`You have logged ${pressureIncidents.length} pressure incident${pressureIncidents.length === 1 ? '' : 's'}, so Pro can turn that history into a clearer dealership scorecard.`);
  }

  if (promises.length > 0) {
    reasons.push('You are tracking dealer promises, which Pro can fold into a stronger accountability view before you sign.');
  }

  if (!reasons.length) {
    reasons.push('Pro helps you share a full buyer report, compare dealerships over time, and stay on script when the pressure starts.');
  }

  return {
    headline: tier === 'pro' ? 'DealShield Pro is active' : 'You are on DealShield Free',
    detail:
      tier === 'pro'
        ? 'Premium tools are unlocked: shareable buyer report, dealer scorecards, and your in-store session playbook.'
        : 'Core quote review stays free. Upgrade when you need a full report to share, dealership scorecards, or a step-by-step plan for live negotiations.',
    monthlyPriceLabel: 'One-time purchase',
    annualPriceLabel: 'Lifetime unlock',
    reasons,
    featureCards: [
      createFeatureCard(
        'Shareable buyer report',
        'Package the verdict, negotiation plan, and key risk checks into one summary you can text or export before anyone signs.',
        tier
      ),
      createFeatureCard(
        'Dealer scorecards',
        'See how each dealership stacks up across offer quality, pressure tactics, and kept or broken promises.',
        tier
      ),
      createFeatureCard(
        'Session playbook',
        'Get a step-by-step visit plan for live negotiations so you know what to say and ask in order.',
        tier
      ),
    ],
  };
}

export function buildSavingsOpportunity(
  analysis: DealAnalysis,
  negotiationPlan: NegotiationPlan,
  recommendation: DealActionRecommendation
): SavingsOpportunity {
  const bestScenario = negotiationPlan.scenarios[0] ?? null;
  const estimatedSavings = bestScenario?.totalChange ?? 0;

  if (estimatedSavings > 0) {
    return {
      headline: `You may be able to save about ${currency(estimatedSavings)} on this deal.`,
      detail: `${bestScenario?.detail ?? 'There is still room to improve the deal.'} That makes the review feel immediately valuable, even before the buyer reads every detail.`,
      estimatedSavings,
      strongestLever: bestScenario?.title ?? 'Lower the total paid',
      tone: recommendation.action === 'Leave' ? 'bad' : 'good',
    };
  }

  if (recommendation.action === 'Leave') {
    return {
      headline: 'The biggest savings move may be walking away from this deal.',
      detail: 'When the structure is too risky, the real win is avoiding an overpriced or padded contract entirely.',
      estimatedSavings: 0,
      strongestLever: 'Walk away from the current structure',
      tone: 'bad',
    };
  }

  return {
    headline: 'This deal does not show a large obvious savings lever yet.',
    detail: 'The next value move is keeping the paperwork clean and preventing last-minute changes instead of chasing a small concession.',
    estimatedSavings: 0,
    strongestLever: 'Protect the clean structure',
    tone: 'warn',
  };
}

export function buildSavingsProof(
  subscription: SubscriptionState,
  savingsOpportunity: SavingsOpportunity,
  whatIfComparison: WhatIfComparison | null
): SavingsProof {
  const scenarioProtected = whatIfComparison && whatIfComparison.totalDifference < 0 ? Math.abs(whatIfComparison.totalDifference) : 0;
  const currentProtected = Math.max(0, savingsOpportunity.estimatedSavings);
  const totalProtectedEstimate = currentProtected + scenarioProtected;

  return {
    headline:
      totalProtectedEstimate > 0
        ? `DealShield is currently helping protect about ${currency(totalProtectedEstimate)} in visible deal value.`
        : 'DealShield is helping turn hidden risk into something you can actually inspect before you sign.',
    detail:
      totalProtectedEstimate > 0
        ? 'This is not a guaranteed savings number. It is a simple estimate of the dollars you can now see, question, and negotiate because the structure is clearer.'
        : 'Even without a giant savings number, the app still creates value by surfacing bad structure, contract changes, and pressure before you commit.',
    totalProtectedEstimate,
    proofPoints: [
      currentProtected > 0
        ? `Current deal review shows about ${currency(currentProtected)} in visible upside.`
        : 'The current review is still useful because it can stop bad structure and paperwork drift.',
      scenarioProtected > 0
        ? `Your what-if lab is modeling about ${currency(scenarioProtected)} in scenario-based protection.`
        : 'Try the what-if lab to turn a vague counter into a dollar-backed scenario.',
      `You have saved ${subscription.usage.dealsSaved} offer${subscription.usage.dealsSaved === 1 ? '' : 's'} and modeled ${subscription.usage.whatIfRuns} what-if scenario${subscription.usage.whatIfRuns === 1 ? '' : 's'} so far.`,
      subscription.usage.checkpointPasses > 0
        ? `The signing checkpoint has already helped you clear ${subscription.usage.checkpointPasses} pre-sign review${subscription.usage.checkpointPasses === 1 ? '' : 's'}.`
        : 'The signing checkpoint is there to stop rushed signing when the contract still needs review.',
    ],
  };
}

export function buildQuickStartGuide(): QuickStartGuide {
  return {
    headline: 'New here? Start with the fastest path to a useful answer.',
    steps: [
      'Paste or import the quote first so the app can estimate the real deal structure.',
      'Review the verdict, savings opportunity, and biggest warning before looking at the deeper screens.',
      'Share the second-opinion message with someone you trust before signing anything.',
    ],
  };
}

export function buildOnboardingSummary(preferences: {
  experienceMode: 'standard' | 'firstTimeBuyer';
  onboardingComplete: boolean;
  buyerStage: 'firstCar' | 'replacingCar' | 'tradeShopper' | 'undecided';
  financingNeed: 'finance' | 'cash' | 'undecided';
  creditBand: 'unknown' | 'building' | 'fair' | 'good' | 'excellent';
  hasTrade: boolean;
}) {
  const buyerStageLabel =
    preferences.buyerStage === 'firstCar'
      ? 'first car'
      : preferences.buyerStage === 'replacingCar'
        ? 'replacement purchase'
        : preferences.buyerStage === 'tradeShopper'
          ? 'trade-in focused purchase'
          : 'general deal review';
  const financingLabel =
    preferences.financingNeed === 'finance' ? 'financing-focused' : preferences.financingNeed === 'cash' ? 'cash-buyer' : 'still deciding about financing';
  const creditLabel =
    preferences.creditBand === 'unknown'
      ? 'unknown credit profile'
      : `${preferences.creditBand} credit profile`;

  return {
    headline: preferences.onboardingComplete ? 'Your guided setup is active.' : 'Finish this 30-second setup for sharper guidance.',
    detail: `DealShield is currently tuned for a ${buyerStageLabel}, ${financingLabel}, ${creditLabel}${preferences.hasTrade ? ', and a trade-in' : ''}.`,
  };
}

export function buildGuidedSessionFlow(
  hasImportedQuote: boolean,
  pressureSummary: { recent: PressureIncident[] },
  signingReadiness: SigningReadiness,
  promiseSummary: PromiseSummary
): GuidedSessionFlow {
  const steps: GuidedSessionFlow['steps'] = [
    {
      title: 'Capture the quote',
      detail: 'Import or enter the written numbers first so everything else is grounded in the actual deal.',
      status: hasImportedQuote ? 'done' : 'active',
    },
    {
      title: 'Log pressure live',
      detail: 'Mark tactics when they happen so the coaching and history stay specific to this visit.',
      status: pressureSummary.recent.length > 0 ? 'done' : hasImportedQuote ? 'active' : 'todo',
    },
    {
      title: 'Save promises',
      detail: 'Anything they say they will remove, change, or fix should be written down here before you trust it.',
      status: promiseSummary.recent.length > 0 ? 'done' : pressureSummary.recent.length > 0 ? 'active' : 'todo',
    },
    {
      title: 'Run the signing checkpoint',
      detail: 'Before signing, compare the contract against the reviewed offer and clear every blocker on paper.',
      status: signingReadiness.readyToSign ? 'done' : signingReadiness.blockers.length > 0 ? 'active' : 'todo',
    },
  ];
  const currentStep = steps.find((step) => step.status === 'active') ?? steps.find((step) => step.status === 'todo') ?? steps[steps.length - 1];

  return {
    headline: 'Use this live order when you are physically at the dealership.',
    currentStepLabel: currentStep?.title ?? 'Run the signing checkpoint',
    steps,
  };
}

export function buildReferralLoop(
  deal: DealState,
  analysis: DealAnalysis,
  recommendation: DealActionRecommendation,
  secondOpinionShare: string
): ReferralLoop {
  const dealerLabel = deal.dealershipName.trim() || 'this dealership';

  return {
    headline: 'Bring another person into the decision before you sign.',
    detail: `People naturally ask a spouse, friend, or advisor to sanity-check a big purchase. Give them a quick summary first, then invite them into DealShield if they want the deeper breakdown.`,
    inviteMessage: `${secondOpinionShare}\n\nIf you want the same kind of breakdown for your own car deal, I used DealShield to catch the structure fast.`,
    followUpMessage: `I just ran ${dealerLabel} through DealShield and it came back as ${analysis.dealVerdict}. The app says my best move is ${recommendation.action.toLowerCase()}. If you want, I can send you the quick summary I shared.`,
  };
}

export function buildVisitCaseSummary(entries: VisitTimelineEntry[], dealershipName: string) {
  const normalizedDealer = dealershipName.trim().toLowerCase();
  const filtered = normalizedDealer
    ? entries.filter((entry) => entry.dealershipName.trim().toLowerCase() === normalizedDealer)
    : entries;

  if (!filtered.length) {
    return 'No dealership visit timeline has been captured yet.';
  }

  const ordered = filtered
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 8);

  return [
    `DealShield visit case file${dealershipName ? `: ${dealershipName}` : ''}`,
    '',
    ...ordered.map((entry) => `- ${new Date(entry.createdAt).toLocaleString()}: ${entry.title}. ${entry.detail}`),
  ].join('\n');
}

function stringifyMoney(value: string) {
  return currency(Number(value || 0));
}

function stringifyPercent(value: string) {
  return `${Number(value || 0)}%`;
}

function stringifyMonths(value: string) {
  return `${value || '0'} months`;
}

function pushAuditItem(
  items: PaperworkAuditItem[],
  label: string,
  expectedRaw: string,
  contractRaw: string,
  format: (value: string) => string,
  worseWhenHigher = true
) {
  if (!contractRaw.trim()) return;

  const expected = Number(expectedRaw || 0);
  const contract = Number(contractRaw || 0);

  if (contract === expected) {
    items.push({
      label,
      expectedValue: format(expectedRaw),
      contractValue: format(contractRaw),
      tone: 'good',
      detail: 'Matches the reviewed offer.',
    });
    return;
  }

  const gotWorse = worseWhenHigher ? contract > expected : contract < expected;
  items.push({
    label,
    expectedValue: format(expectedRaw),
    contractValue: format(contractRaw),
    tone: gotWorse ? 'bad' : 'warn',
    detail: gotWorse
      ? 'This changed against you between the reviewed offer and the paperwork.'
      : 'This changed from the reviewed offer. Confirm why before signing.',
  });
}

export function buildPaperworkAudit(deal: DealState): PaperworkAudit | null {
  const contractFields = [
    deal.contractVehiclePrice,
    deal.contractFees,
    deal.contractAddOns,
    deal.contractDownPayment,
    deal.contractTradeIn,
    deal.contractApr,
    deal.contractMonths,
  ];

  if (!contractFields.some((value) => value.trim())) return null;

  const items: PaperworkAuditItem[] = [];
  pushAuditItem(items, 'Vehicle price', deal.vehiclePrice, deal.contractVehiclePrice, stringifyMoney, true);
  pushAuditItem(items, 'Fees', String(getFeeTotal(deal)), deal.contractFees, stringifyMoney, true);
  pushAuditItem(items, 'Add-ons', String(getAddOnTotal(deal)), deal.contractAddOns, stringifyMoney, true);
  pushAuditItem(items, 'Down payment', deal.downPayment, deal.contractDownPayment, stringifyMoney, false);
  pushAuditItem(items, 'Trade-in', deal.tradeIn, deal.contractTradeIn, stringifyMoney, false);
  pushAuditItem(items, 'APR', deal.apr, deal.contractApr, stringifyPercent, true);
  pushAuditItem(items, 'Term', deal.months, deal.contractMonths, stringifyMonths, true);

  const badCount = items.filter((item) => item.tone === 'bad').length;
  const warnCount = items.filter((item) => item.tone === 'warn').length;

  return {
    headline:
      badCount > 0
        ? `Stop and review ${badCount} contract change${badCount === 1 ? '' : 's'} before signing.`
        : warnCount > 0
          ? 'Paperwork is close, but a few numbers changed and should be confirmed.'
          : 'Paperwork matches the reviewed offer closely.',
    summaryTone: badCount > 0 ? 'bad' : warnCount > 0 ? 'warn' : 'good',
    readyToSign: badCount === 0,
    items,
  };
}

export function buildPaperworkAuditSummary(deal: DealState, audit: PaperworkAudit) {
  return [
    `DealShield paperwork audit${deal.dealershipName ? `: ${deal.dealershipName}` : ''}`,
    '',
    audit.headline,
    '',
    ...audit.items.map((item) => `${item.label}: reviewed ${item.expectedValue} vs contract ${item.contractValue}. ${item.detail}`),
  ].join('\n');
}

export function buildSigningReadiness(
  deal: DealState,
  paperworkAudit: PaperworkAudit | null,
  promises: PromiseRecord[],
  pressureIncidents: PressureIncident[],
  dealershipName: string
): SigningReadiness {
  const normalizedDealer = dealershipName.trim().toLowerCase();
  const relatedPromises = normalizedDealer
    ? promises.filter((promise) => promise.dealershipName.trim().toLowerCase() === normalizedDealer)
    : promises;
  const relatedPressure = normalizedDealer
    ? pressureIncidents.filter((incident) => incident.dealershipName.trim().toLowerCase() === normalizedDealer)
    : pressureIncidents;

  const openPromises = relatedPromises.filter((promise) => promise.status === 'open');
  const brokenPromises = relatedPromises.filter((promise) => promise.status === 'broken');
  const badAuditItems = paperworkAudit?.items.filter((item) => item.tone === 'bad') ?? [];
  const missingContractFields = [
    !deal.contractVehiclePrice.trim() ? 'Contract vehicle price' : null,
    !deal.contractApr.trim() ? 'Contract APR' : null,
    !deal.contractMonths.trim() ? 'Contract term' : null,
  ].filter((item): item is string => !!item);

  const blockers: string[] = [];
  const greenLights: string[] = [];
  const checklist: string[] = [];

  if (badAuditItems.length > 0) {
    blockers.push(`The contract still has ${badAuditItems.length} mismatch${badAuditItems.length === 1 ? '' : 'es'} against the reviewed offer.`);
  }
  if (openPromises.length > 0) {
    blockers.push(`${openPromises.length} dealership promise${openPromises.length === 1 ? '' : 's'} is still unresolved.`);
  }
  if (brokenPromises.length > 0) {
    blockers.push(`${brokenPromises.length} promise${brokenPromises.length === 1 ? '' : 's'} has already been marked broken for this dealership.`);
  }
  if (relatedPressure.length >= 3) {
    blockers.push('Multiple pressure incidents were logged during this session.');
  }
  if (missingContractFields.length > 0) {
    blockers.push(`You are still missing key contract fields: ${missingContractFields.join(', ')}.`);
  }

  if (paperworkAudit?.readyToSign) {
    greenLights.push('The entered contract numbers currently match the reviewed offer.');
  }
  if (openPromises.length === 0 && relatedPromises.length > 0) {
    greenLights.push('There are no unresolved dealership promises hanging over this deal.');
  }
  if (relatedPressure.length === 0) {
    greenLights.push('No pressure incidents were logged for this dealership session.');
  }
  if (missingContractFields.length === 0) {
    greenLights.push('The core contract fields are filled in for a real pre-sign review.');
  }

  checklist.push('Match vehicle price, fees, add-ons, APR, term, cash down, and trade line against the contract.');
  checklist.push('Do not rely on verbal promises. Anything important should be fixed on paper before signing.');
  checklist.push('If the dealership resists printing, revising, or explaining the contract, pause the deal.');
  if (openPromises.length > 0) {
    checklist.push('Resolve the open promises first or stop treating them as part of the deal.');
  }
  if (relatedPressure.length > 0) {
    checklist.push('Slow the pace down and use the written numbers, not the monthly payment pitch, to decide.');
  }

  const readyToSign = blockers.length === 0 && !!paperworkAudit?.readyToSign;
  const tone: Tone = readyToSign ? 'good' : badAuditItems.length > 0 || brokenPromises.length > 0 ? 'bad' : 'warn';
  const headline = readyToSign
    ? 'This looks signable if the final contract stays exactly like this.'
    : blockers.length > 0
      ? 'Not ready to sign yet.'
      : 'Close, but still verify a few things before signing.';
  const detail = readyToSign
    ? 'The contract check is clean, the major fields are present, and there are no obvious unresolved issues blocking the deal.'
    : blockers.length > 0
      ? 'One or more pre-sign blockers are still active. Clear them on paper before you make a final decision.'
      : 'The deal is approaching signable, but the safest move is still to double-check the final written contract.';

  return {
    headline,
    detail,
    tone,
    readyToSign,
    blockers,
    greenLights,
    checklist: Array.from(new Set(checklist)),
  };
}

export function buildComparisonSummary(firstDeal: SavedDeal, secondDeal: SavedDeal, firstAnalysis: DealAnalysis, secondAnalysis: DealAnalysis) {
  const winnerName =
    firstAnalysis.dangerScore === secondAnalysis.dangerScore
      ? firstAnalysis.totalPaid <= secondAnalysis.totalPaid
        ? firstDeal.dealershipName || 'Offer 1'
        : secondDeal.dealershipName || 'Offer 2'
      : firstAnalysis.dangerScore < secondAnalysis.dangerScore
        ? firstDeal.dealershipName || 'Offer 1'
        : secondDeal.dealershipName || 'Offer 2';

  return [
    'DealShield comparison summary',
    '',
    `${firstDeal.dealershipName || 'Offer 1'}`,
    `- State context: ${getStateName(firstDeal.buyerStateCode)}`,
    `- Verdict: ${firstAnalysis.dealVerdict}`,
    `- Amount financed: ${currency(firstAnalysis.amountFinanced)}`,
    `- Monthly payment: ${currency(firstAnalysis.monthlyPayment)}`,
    `- Total paid: ${currency(firstAnalysis.totalPaid)}`,
    `- Warning count: ${firstAnalysis.dealWarnings.length + firstAnalysis.flaggedFees.length}`,
    '',
    `${secondDeal.dealershipName || 'Offer 2'}`,
    `- State context: ${getStateName(secondDeal.buyerStateCode)}`,
    `- Verdict: ${secondAnalysis.dealVerdict}`,
    `- Amount financed: ${currency(secondAnalysis.amountFinanced)}`,
    `- Monthly payment: ${currency(secondAnalysis.monthlyPayment)}`,
    `- Total paid: ${currency(secondAnalysis.totalPaid)}`,
    `- Warning count: ${secondAnalysis.dealWarnings.length + secondAnalysis.flaggedFees.length}`,
    '',
    `Current winner: ${winnerName}`,
  ].join('\n');
}

export function buildCurrentDealSummary(deal: DealState, analysis: DealAnalysis) {
  return [
    `DealShield offer review${deal.dealershipName ? `: ${deal.dealershipName}` : ''}`,
    '',
    `State context: ${getStateName(deal.buyerStateCode)}`,
    `Verdict: ${analysis.dealVerdict}`,
    `Estimated amount financed: ${currency(analysis.amountFinanced)}`,
    `Estimated monthly payment: ${currency(analysis.monthlyPayment)}`,
    `Estimated total paid: ${currency(analysis.totalPaid)}`,
    `Structured fee total: ${currency(getFeeTotal(deal))}`,
    `Structured add-on total: ${currency(getAddOnTotal(deal))}`,
    '',
    'Why it scored this way:',
    ...analysis.scoreBreakdown.map((item) => `- ${item.label}: ${item.reason}`),
    '',
    'Flagged fee labels:',
    ...(analysis.flaggedFees.length ? analysis.flaggedFees.map((fee) => `- ${fee.label}: ${fee.reason}`) : ['- None detected from the current fee notes.']),
    '',
    deal.offerNotes ? `Offer notes: ${deal.offerNotes}` : 'Offer notes: None saved yet.',
  ].join('\n');
}

export function buildNegotiationPlanSummary(deal: DealState, analysis: DealAnalysis, plan: NegotiationPlan) {
  return [
    `DealShield negotiation blueprint${deal.dealershipName ? `: ${deal.dealershipName}` : ''}`,
    '',
    `Verdict: ${analysis.dealVerdict}`,
    plan.headline,
    '',
    'Strongest move:',
    `- ${plan.strongestMove}`,
    '',
    'Top leverage points:',
    ...(plan.scenarios.length
      ? plan.scenarios.map(
          (scenario) =>
            `- ${scenario.title}: saves about ${currency(scenario.totalChange)} total and ${currency(scenario.monthlyChange)} per month. ${scenario.detail}`
        )
      : ['- No single lever stands out. Keep pushing for a cleaner written out-the-door price.']),
  ].join('\n');
}

export function buildBuyerReport(
  deal: DealState,
  analysis: DealAnalysis,
  confidence: DealConfidence,
  recommendation: DealActionRecommendation,
  negotiationPlan: NegotiationPlan,
  marketBenchmarkAssessment: MarketBenchmarkAssessment | null,
  tradeInAssessment: TradeInAssessment | null,
  paperworkAudit: PaperworkAudit | null
) {
  return [
    `DealShield buyer report${deal.dealershipName ? `: ${deal.dealershipName}` : ''}`,
    '',
    'Snapshot',
    `- State context: ${getStateName(deal.buyerStateCode)}`,
    `- Verdict: ${analysis.dealVerdict}`,
    `- Confidence: ${confidence.label} (${confidence.score}%)`,
    `- Estimated amount financed: ${currency(analysis.amountFinanced)}`,
    `- Estimated monthly payment: ${currency(analysis.monthlyPayment)}`,
    `- Estimated total paid: ${currency(analysis.totalPaid)}`,
    '',
    'Recommendation',
    `- Action: ${recommendation.action}`,
    `- ${recommendation.headline}`,
    `- ${recommendation.detail}`,
    ...(typeof recommendation.targetTotalPaid === 'number' ? [`- Target total paid: ${currency(recommendation.targetTotalPaid)}`] : []),
    ...(typeof recommendation.targetMonthlyPayment === 'number' ? [`- Target monthly payment: ${currency(recommendation.targetMonthlyPayment)}`] : []),
    '',
    'Negotiation plan',
    `- Best next line: ${negotiationPlan.strongestMove}`,
    ...negotiationPlan.scenarios.slice(0, 3).map(
      (scenario) =>
        `- ${scenario.title}: about ${currency(scenario.totalChange)} total impact and ${currency(scenario.monthlyChange)} monthly impact.`
    ),
    '',
    'Key checks',
    ...(marketBenchmarkAssessment
      ? [`- Market benchmark: ${marketBenchmarkAssessment.headline} ${marketBenchmarkAssessment.detail}`]
      : ['- Market benchmark: Not provided yet.']),
    ...(tradeInAssessment
      ? [`- Trade-in fairness: ${tradeInAssessment.headline} ${tradeInAssessment.detail}`]
      : ['- Trade-in fairness: Not enough trade data yet.']),
    ...(paperworkAudit
      ? [`- Paperwork audit: ${paperworkAudit.headline}`]
      : ['- Paperwork audit: Contract numbers not entered yet.']),
    '',
    'Missing information',
    ...(confidence.missingFields.length ? confidence.missingFields.map((item) => `- ${item}`) : ['- No major fields missing.']),
    '',
    deal.offerNotes ? `Offer notes: ${deal.offerNotes}` : 'Offer notes: None saved yet.',
  ].join('\n');
}

export function buildSecondOpinionShare(
  deal: DealState,
  analysis: DealAnalysis,
  recommendation: DealActionRecommendation,
  negotiationPlan: NegotiationPlan
) {
  const warningCount = analysis.dealWarnings.length + analysis.flaggedFees.length;
  const firstWarning =
    analysis.dealWarnings[0] ??
    analysis.flaggedFees[0]?.reason ??
    'No major warning was detected yet, but I still want another set of eyes on it.';

  return [
    `Can you sanity-check this car deal with me${deal.dealershipName ? ` from ${deal.dealershipName}` : ''}?`,
    '',
    `DealShield flagged it as: ${analysis.dealVerdict}`,
    `Recommended move: ${recommendation.action}`,
    `Estimated monthly: ${currency(analysis.monthlyPayment)}`,
    `Estimated total paid: ${currency(analysis.totalPaid)}`,
    `Warning count: ${warningCount}`,
    '',
    `Biggest concern: ${firstWarning}`,
    `Best next move: ${negotiationPlan.strongestMove}`,
    '',
    'I ran this through DealShield before signing. Want me to send you the full breakdown too?',
  ].join('\n');
}
