import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildComparisonInsights,
  buildComparisonSummary,
  buildCounterOfferMoves,
  buildBuyerReport,
  buildCurrentDealSummary,
  buildDealConfidence,
  buildDealerScorecards,
  buildDealerReputationReports,
  buildDealActionRecommendation,
  buildDealAnalysis,
  buildHonestyScore,
  buildLiveCoachingPlan,
  buildMarketBenchmarkAssessment,
  buildMarketCompSnapshot,
  buildMonetizationSummary,
  buildNegotiationPlan,
  buildPaperworkAudit,
  buildOfferTimeline,
  buildPaperworkAuditSummary,
  buildPressureSummary,
  buildPromiseSummary,
  buildQuickStartGuide,
  buildReferralLoop,
  buildSavingsOpportunity,
  buildSecondOpinionShare,
  buildNegotiationSimulator,
  buildVisitCaseSummary,
  buildSessionPlaybook,
  buildTradeInAssessment,
  compareSavedDeals,
  detectSuspiciousFees,
  estimateMonthlyPayment,
  getAddOnTotal,
  getFeeTotal,
  getReadinessLabel,
  importQuoteText,
  scoreAnswers,
} from '../utils/deals.ts';
import { createInitialAppData, createInitialDeal, sanitizeAppData } from '../utils/app-state.ts';
import { salesTacticItems } from '../data/deal-content.ts';

test('scoreAnswers and readiness label reflect missing prep work', () => {
  const readiness = scoreAnswers({
    budget: 'Under $300',
    downPayment: 'Yes',
    credit: 'Good',
    preapproved: 'Yes',
    targetPrice: 'Yes',
    tradeIn: 'No trade-in',
    walkAway: 'Yes',
  });

  assert.equal(readiness.score, 9);
  assert.equal(getReadinessLabel(readiness.score), 'Strong');
});

test('estimateMonthlyPayment falls back cleanly for zero APR', () => {
  assert.equal(estimateMonthlyPayment(12000, 0, 60), 200);
});

test('buildDealAnalysis flags risky fee patterns and pricing structure', () => {
  const deal = {
    ...createInitialDeal(),
    buyerStateCode: 'MI',
    dealershipName: 'Metro Auto',
    vehiclePrice: '25000',
    dealerFees: '1499',
    feeNames: 'doc fee, nitrogen package, dealer prep',
    feeItems: [
      { id: 'fee-1', label: 'Doc fee', amount: '799' },
      { id: 'fee-2', label: 'Dealer prep', amount: '700' },
    ],
    addOns: '2500',
    addOnItems: [{ id: 'addon-1', label: 'Warranty', amount: '2500' }],
    apr: '10.2',
    months: '84',
  };

  const analysis = buildDealAnalysis(deal, 'Almost Ready');

  assert.equal(analysis.dealVerdict, 'Walk Away');
  assert.ok(analysis.flaggedFees.length >= 2);
  assert.ok(analysis.dealWarnings.some((item) => item.includes('APR')));
  assert.ok(analysis.stateContext.includes('Michigan'));
  assert.equal(getFeeTotal(deal), 1499);
  assert.equal(getAddOnTotal(deal), 2500);
});

test('buildHonestyScore and compareSavedDeals favor the cleaner offer', () => {
  const safer = {
    ...createInitialDeal(),
    id: 'safe',
    savedAt: '2026-04-18T12:00:00.000Z',
    seriesId: 'series-safe',
    revisionNumber: 1,
    basedOnDealId: null,
    dealershipName: 'Safer Deal',
    vehiclePrice: '22000',
    dealerFees: '400',
    addOns: '0',
    apr: '4.9',
    months: '60',
  };

  const riskier = {
    ...createInitialDeal(),
    id: 'risk',
    savedAt: '2026-04-18T12:01:00.000Z',
    seriesId: 'series-risk',
    revisionNumber: 1,
    basedOnDealId: null,
    dealershipName: 'Risky Deal',
    dealerFees: '1800',
    feeNames: 'doc fee, market adjustment',
    vehiclePrice: '21500',
    addOns: '2500',
    apr: '11',
    months: '84',
  };

  const comparison = compareSavedDeals([riskier, safer], 'Strong');
  assert.ok(comparison);
  assert.equal(comparison?.winner.deal.id, 'safe');

  const honesty = buildHonestyScore(buildDealAnalysis(riskier, 'Strong'), 'Strong', ['paymentShift']);
  assert.equal(honesty.tone, 'bad');
  assert.ok(honesty.breakdown.length > 0);
});

test('summary builders include decision context', () => {
  const firstDeal = {
    ...createInitialDeal(),
    id: '1',
    savedAt: '2026-04-18T12:00:00.000Z',
    seriesId: 'series-1',
    revisionNumber: 1,
    basedOnDealId: null,
    buyerStateCode: 'OH',
    dealershipName: 'Offer One',
    vehiclePrice: '20000',
    apr: '5',
    months: '60',
  };
  const secondDeal = {
    ...createInitialDeal(),
    id: '2',
    savedAt: '2026-04-18T12:01:00.000Z',
    seriesId: 'series-2',
    revisionNumber: 1,
    basedOnDealId: null,
    buyerStateCode: 'MI',
    dealershipName: 'Offer Two',
    vehiclePrice: '21000',
    dealerFees: '1500',
    feeNames: 'doc fee',
    apr: '8',
    months: '72',
  };

  const firstAnalysis = buildDealAnalysis(firstDeal, 'Strong');
  const secondAnalysis = buildDealAnalysis(secondDeal, 'Strong');
  const comparisonSummary = buildComparisonSummary(firstDeal, secondDeal, firstAnalysis, secondAnalysis);
  const currentSummary = buildCurrentDealSummary(secondDeal, secondAnalysis);
  const insights = buildComparisonInsights(firstDeal, secondDeal, firstAnalysis, secondAnalysis);
  const counterMoves = buildCounterOfferMoves(secondDeal, firstDeal, secondAnalysis, firstAnalysis);
  const livePlan = buildLiveCoachingPlan(salesTacticItems[0], secondAnalysis, ['paymentShift', 'wontPrint']);
  const confidence = buildDealConfidence(secondDeal);
  const negotiationPlan = buildNegotiationPlan(secondDeal, secondAnalysis);
  const recommendation = buildDealActionRecommendation(secondDeal, secondAnalysis, negotiationPlan);
  const buyerReport = buildBuyerReport(
    secondDeal,
    secondAnalysis,
    confidence,
    recommendation,
    negotiationPlan,
    null,
    null,
    null
  );

  assert.match(comparisonSummary, /Current winner:/);
  assert.match(currentSummary, /Why it scored this way:/);
  assert.ok(detectSuspiciousFees('doc fee').length > 0);
  assert.ok(insights.length >= 4);
  assert.ok(counterMoves.length >= 1);
  assert.ok(livePlan.nextQuestions.some((item) => item.includes('print')));
  assert.match(buyerReport, /buyer report/i);
  assert.match(buyerReport, /Recommendation/);
  const secondOpinionShare = buildSecondOpinionShare(secondDeal, secondAnalysis, recommendation, negotiationPlan);
  assert.match(secondOpinionShare, /sanity-check this car deal/i);
  assert.match(secondOpinionShare, /Dealer Guard/i);
  const referralLoop = buildReferralLoop(secondDeal, secondAnalysis, recommendation, secondOpinionShare);
  assert.match(referralLoop.headline, /before you sign/i);
  assert.match(referralLoop.inviteMessage, /Dealer Guard/i);
  const visitCaseSummary = buildVisitCaseSummary(
    [
      {
        id: 'timeline-1',
        dealershipName: 'Offer Two',
        type: 'offerSaved',
        title: 'Offer saved',
        detail: 'Saved the current revision.',
        createdAt: '2026-04-20T12:00:00.000Z',
      },
    ],
    'Offer Two'
  );
  assert.match(visitCaseSummary, /visit case file/i);
});

test('live coaching changes meaningfully for multiple pressure tactics', () => {
  const analysis = buildDealAnalysis(
    {
      ...createInitialDeal(),
      dealershipName: 'Pressure Store',
      vehiclePrice: '22000',
      dealerFees: '1800',
      feeNames: 'doc fee, protection package',
      addOns: '2400',
      apr: '9.9',
      months: '84',
    },
    'Strong'
  );

  const livePlan = buildLiveCoachingPlan(salesTacticItems[0], analysis, [
    'paymentShift',
    'todayOnly',
    'managerTrip',
    'bundleAddOn',
    'wontPrint',
    'tradeMix',
  ]);

  assert.match(livePlan.headline, /Pressure detected/);
  assert.ok(livePlan.immediateScript.includes('vehicle price') || livePlan.immediateScript.includes('writing') || livePlan.immediateScript.includes('optional'));
  assert.ok(livePlan.nextQuestions.some((item) => item.includes('monthly payment')));
  assert.ok(livePlan.nextQuestions.some((item) => item.includes('trade-in value')));
  assert.ok(livePlan.walkAwayTriggers.some((item) => item.includes('urgency')));
  assert.ok(livePlan.walkAwayTriggers.some((item) => item.includes('mandatory')));
});

test('buildNegotiationPlan surfaces high-value fixes with scripts', () => {
  const riskyDeal = {
    ...createInitialDeal(),
    dealershipName: 'Leverage Motors',
    vehiclePrice: '30000',
    dealerFees: '1200',
    feeNames: 'doc fee',
    feeItems: [{ id: 'f1', label: 'Doc fee', amount: '1200' }],
    addOns: '1800',
    addOnItems: [{ id: 'a1', label: 'Protection package', amount: '1800' }],
    apr: '9.5',
    months: '72',
  };

  const analysis = buildDealAnalysis(riskyDeal, 'Strong');
  const plan = buildNegotiationPlan(riskyDeal, analysis);

  assert.ok(plan.scenarios.length > 0);
  assert.ok(plan.scenarios.some((item) => item.title.includes('add-ons') || item.title.includes('APR') || item.title.includes('fee')));
  assert.ok(plan.strongestMove.length > 20);
  assert.ok(plan.headline.includes('savings') || plan.headline.includes('upside'));
});

test('buildOfferTimeline reveals real concessions versus payment reshuffling', () => {
  const revisionOne = {
    ...createInitialDeal(),
    id: 'rev-1',
    savedAt: '2026-04-19T10:00:00.000Z',
    seriesId: 'series-1',
    revisionNumber: 1,
    basedOnDealId: null,
    dealershipName: 'Metro Auto',
    vehiclePrice: '30000',
    dealerFees: '1200',
    addOns: '1800',
    apr: '9.5',
    months: '72',
  };
  const revisionTwo = {
    ...revisionOne,
    id: 'rev-2',
    savedAt: '2026-04-19T10:30:00.000Z',
    revisionNumber: 2,
    basedOnDealId: 'rev-1',
    addOns: '0',
    months: '84',
  };

  const timeline = buildOfferTimeline([revisionTwo, revisionOne], 'series-1', 'Strong');

  assert.equal(timeline.length, 2);
  assert.ok(timeline[1]?.insights.some((item) => item.label === 'Packaged extras'));
});

test('buildMonetizationSummary highlights premium value around existing usage', () => {
  const appData = createInitialAppData();
  const savedDeal = {
    ...createInitialDeal(),
    id: 'deal-1',
    savedAt: '2026-04-20T10:00:00.000Z',
    seriesId: 'series-1',
    revisionNumber: 1,
    basedOnDealId: null,
    dealershipName: 'Metro Auto',
    vehiclePrice: '25000',
    apr: '6.4',
    months: '60',
  };

  const summary = buildMonetizationSummary(
    {
      ...appData.subscription,
      tier: 'free',
    },
    [savedDeal, { ...savedDeal, id: 'deal-2', dealershipName: 'North Motors' }],
    [{ id: 'incident-1', flag: 'todayOnly', dealershipName: 'Metro Auto', notedAt: '2026-04-20T10:05:00.000Z' }],
    [{ id: 'promise-1', dealershipName: 'Metro Auto', text: 'We will remove the prep fee.', status: 'open', notedAt: '2026-04-20T10:06:00.000Z', resolvedAt: null }]
  );

  assert.match(summary.headline, /free-to-pro/i);
  assert.equal(summary.featureCards.length, 3);
  assert.ok(summary.reasons.some((reason) => reason.includes('saved offer')));
});

test('buildSavingsOpportunity surfaces a concrete savings hook when leverage exists', () => {
  const deal = {
    ...createInitialDeal(),
    dealershipName: 'Metro Auto',
    vehiclePrice: '30000',
    dealerFees: '1200',
    addOns: '1800',
    apr: '9.5',
    months: '72',
  };

  const analysis = buildDealAnalysis(deal, 'Strong');
  const plan = buildNegotiationPlan(deal, analysis);
  const recommendation = buildDealActionRecommendation(deal, analysis, plan);
  const result = buildSavingsOpportunity(analysis, plan, recommendation);

  assert.ok(result.estimatedSavings > 0);
  assert.match(result.headline, /save about/i);
});

test('buildQuickStartGuide gives a low-friction first-use path', () => {
  const guide = buildQuickStartGuide();

  assert.match(guide.headline, /fastest path/i);
  assert.equal(guide.steps.length, 3);
});

test('buildMarketCompSnapshot combines comparable prices and lender leverage', () => {
  const deal = {
    ...createInitialDeal(),
    vehiclePrice: '25000',
    marketComparablePricesText: '23995, 24150, 24400',
    outsideLenderApr: '5.4',
    outsideLenderTerm: '60',
    apr: '7.9',
    months: '60',
  };
  const analysis = buildDealAnalysis(deal, 'Strong');
  const snapshot = buildMarketCompSnapshot(deal, analysis);

  assert.ok(snapshot);
  assert.equal(snapshot?.comparableCount, 3);
  assert.ok((snapshot?.averageComparablePrice ?? 0) > 0);
});

test('sanitizeAppData preserves subscription defaults and accepts pro state', () => {
  const defaults = sanitizeAppData({});
  assert.equal(defaults.subscription.tier, 'free');
  assert.equal(defaults.subscription.usage.ocrImports, 0);

  const upgraded = sanitizeAppData({
    subscription: {
      tier: 'pro',
      upgradedAt: '2026-04-20T11:00:00.000Z',
      usage: {
        ocrImports: 3,
        reportsShared: 2,
        dealsSaved: 5,
        tacticsLogged: 4,
      },
    },
  });

  assert.equal(upgraded.subscription.tier, 'pro');
  assert.equal(upgraded.subscription.usage.reportsShared, 2);
  assert.equal(upgraded.subscription.usage.referralShares, 0);
});

test('buildDealActionRecommendation chooses counter for negotiable risky deals', () => {
  const deal = {
    ...createInitialDeal(),
    dealershipName: 'Metro Auto',
    vehiclePrice: '30000',
    dealerFees: '1200',
    addOns: '1800',
    apr: '9.5',
    months: '72',
  };

  const analysis = buildDealAnalysis(deal, 'Strong');
  const plan = buildNegotiationPlan(deal, analysis);
  const recommendation = buildDealActionRecommendation(deal, analysis, plan);

  assert.equal(recommendation.action, 'Counter');
  assert.ok(typeof recommendation.targetTotalPaid === 'number');
});

test('buildTradeInAssessment flags low trade offers and negative equity risk', () => {
  const lowTradeDeal = {
    ...createInitialDeal(),
    tradeIn: '4500',
    tradeReferenceValue: '7000',
    tradePayoff: '6200',
  };

  const assessment = buildTradeInAssessment(lowTradeDeal);

  assert.ok(assessment);
  assert.equal(assessment?.tone, 'bad');
  assert.ok(assessment?.headline.includes('low') || assessment?.headline.includes('Negative equity'));
  assert.ok(assessment?.negotiationScript.includes('trade'));
});

test('buildPressureSummary highlights repeated dealership tactics', () => {
  const summary = buildPressureSummary(
    [
      { id: '1', flag: 'paymentShift', dealershipName: 'Metro Auto', notedAt: '2026-04-19T12:00:00.000Z' },
      { id: '2', flag: 'paymentShift', dealershipName: 'Metro Auto', notedAt: '2026-04-19T12:10:00.000Z' },
      { id: '3', flag: 'wontPrint', dealershipName: 'Metro Auto', notedAt: '2026-04-19T12:20:00.000Z' },
      { id: '4', flag: 'todayOnly', dealershipName: 'Other Auto', notedAt: '2026-04-19T12:30:00.000Z' },
    ],
    ['paymentShift', 'wontPrint'],
    'Metro Auto'
  );

  assert.ok(summary.headline.includes('3 pressure event'));
  assert.ok(summary.notes.some((item) => item.includes('Repeated pattern')));
  assert.equal(summary.recent.length, 3);
});

test('buildNegotiationSimulator produces realistic practice turns', () => {
  const deal = {
    ...createInitialDeal(),
    dealershipName: 'Metro Auto',
    vehiclePrice: '24000',
    dealerFees: '1200',
    addOns: '1800',
    apr: '8.9',
    months: '72',
  };
  const analysis = buildDealAnalysis(deal, 'Strong');
  const turns = buildNegotiationSimulator(salesTacticItems[0], analysis, ['bundleAddOn']);

  assert.ok(turns.length >= 3);
  assert.match(turns[0]?.salespersonLine ?? '', /monthly payment/i);
});

test('buildPromiseSummary counts open, kept, and broken promises by dealership', () => {
  const summary = buildPromiseSummary(
    [
      { id: '1', dealershipName: 'Metro Auto', text: 'We will remove the prep fee.', status: 'open', notedAt: '2026-04-19T12:00:00.000Z', resolvedAt: null },
      { id: '2', dealershipName: 'Metro Auto', text: 'APR will drop after approval.', status: 'broken', notedAt: '2026-04-19T12:10:00.000Z', resolvedAt: '2026-04-19T13:00:00.000Z' },
      { id: '3', dealershipName: 'Metro Auto', text: 'We will text the worksheet.', status: 'kept', notedAt: '2026-04-19T12:20:00.000Z', resolvedAt: '2026-04-19T12:40:00.000Z' },
      { id: '4', dealershipName: 'Other Auto', text: 'Other promise.', status: 'open', notedAt: '2026-04-19T12:30:00.000Z', resolvedAt: null },
    ],
    'Metro Auto'
  );

  assert.ok(summary.headline.includes('3 promise'));
  assert.equal(summary.openCount, 1);
  assert.equal(summary.keptCount, 1);
  assert.equal(summary.brokenCount, 1);
  assert.equal(summary.recent.length, 3);
});

test('buildDealerScorecards combines offer quality, pressure, and promises', () => {
  const scorecards = buildDealerScorecards(
    [
      {
        ...createInitialDeal(),
        id: 'deal-1',
        savedAt: '2026-04-19T12:00:00.000Z',
        seriesId: 'series-1',
        revisionNumber: 1,
        basedOnDealId: null,
        dealershipName: 'Metro Auto',
        vehiclePrice: '25000',
        dealerFees: '1500',
        apr: '8.9',
        months: '72',
      },
      {
        ...createInitialDeal(),
        id: 'deal-2',
        savedAt: '2026-04-19T12:05:00.000Z',
        seriesId: 'series-2',
        revisionNumber: 1,
        basedOnDealId: null,
        dealershipName: 'Calm Auto',
        vehiclePrice: '22000',
        dealerFees: '400',
        apr: '4.9',
        months: '60',
      },
    ],
    [
      { id: 'incident-1', flag: 'paymentShift', dealershipName: 'Metro Auto', notedAt: '2026-04-19T12:10:00.000Z' },
      { id: 'incident-2', flag: 'wontPrint', dealershipName: 'Metro Auto', notedAt: '2026-04-19T12:11:00.000Z' },
    ],
    [
      { id: 'promise-1', dealershipName: 'Metro Auto', text: 'We will remove the prep fee.', status: 'broken', notedAt: '2026-04-19T12:00:00.000Z', resolvedAt: '2026-04-19T13:00:00.000Z' },
      { id: 'promise-2', dealershipName: 'Calm Auto', text: 'We will text the worksheet.', status: 'kept', notedAt: '2026-04-19T12:00:00.000Z', resolvedAt: '2026-04-19T12:30:00.000Z' },
    ],
    'Strong'
  );

  assert.equal(scorecards.length, 2);
  assert.equal(scorecards[0]?.dealershipName, 'Metro Auto');
  assert.equal(scorecards[0]?.pressureCount, 2);
  assert.equal(scorecards[0]?.brokenPromiseCount, 1);
});

test('buildDealerReputationReports adds trust-level summaries', () => {
  const reports = buildDealerReputationReports(
    [
      {
        dealershipName: 'Metro Auto',
        tone: 'bad',
        headline: 'Pattern shows meaningful caution signs.',
        revisionCount: 2,
        pressureCount: 2,
        brokenPromiseCount: 1,
        keptPromiseCount: 0,
        latestVerdict: 'Bad Deal',
        latestTotalPaid: 31000,
      },
    ],
    [
      {
        id: 'timeline-1',
        dealershipName: 'Metro Auto',
        type: 'offerSaved',
        title: 'Offer saved',
        detail: 'Saved a revision.',
        createdAt: '2026-04-20T12:00:00.000Z',
      },
    ]
  );

  assert.equal(reports.length, 1);
  assert.ok(reports[0]!.trustScore < 100);
});

test('buildSessionPlaybook creates an ordered in-session action plan', () => {
  const deal = {
    ...createInitialDeal(),
    dealershipName: 'Metro Auto',
    vehiclePrice: '25000',
    marketVehiclePrice: '22500',
    tradeIn: '4000',
    tradeReferenceValue: '5500',
    dealerFees: '1200',
    apr: '8.9',
    months: '72',
  };

  const analysis = buildDealAnalysis(deal, 'Strong');
  const livePlan = buildLiveCoachingPlan(salesTacticItems[0], analysis, ['paymentShift', 'wontPrint']);
  const negotiationPlan = buildNegotiationPlan(deal, analysis);
  const recommendation = buildDealActionRecommendation(deal, analysis, negotiationPlan);
  const playbook = buildSessionPlaybook(
    analysis,
    livePlan,
    recommendation,
    negotiationPlan,
    buildMarketBenchmarkAssessment(deal, analysis),
    buildTradeInAssessment(deal),
    null
  );

  assert.ok(playbook.headline.includes('plan'));
  assert.ok(playbook.steps.length >= 4);
  assert.equal(playbook.steps[0]?.title, 'Start with the anchor');
  assert.ok(playbook.steps.some((step) => step.title.includes('Before signing')));
});

test('buildPaperworkAudit catches late contract changes', () => {
  const deal = {
    ...createInitialDeal(),
    dealershipName: 'Metro Auto',
    vehiclePrice: '25000',
    dealerFees: '995',
    addOns: '0',
    downPayment: '3000',
    tradeIn: '4000',
    apr: '6.9',
    months: '60',
    contractVehiclePrice: '25000',
    contractFees: '1495',
    contractAddOns: '1295',
    contractDownPayment: '3000',
    contractTradeIn: '4000',
    contractApr: '8.9',
    contractMonths: '72',
  };

  const audit = buildPaperworkAudit(deal);

  assert.ok(audit);
  assert.equal(audit?.readyToSign, false);
  assert.ok(audit?.items.some((item) => item.label === 'Fees' && item.tone === 'bad'));
  assert.ok(audit?.items.some((item) => item.label === 'APR' && item.tone === 'bad'));
  assert.ok(buildPaperworkAuditSummary(deal, audit!).includes('paperwork audit'));
});

test('buildMarketBenchmarkAssessment flags overpriced deals against research targets', () => {
  const deal = {
    ...createInitialDeal(),
    vehiclePrice: '25000',
    marketVehiclePrice: '22500',
    targetTotalPaid: '27000',
    dealerFees: '995',
    apr: '8.9',
    months: '72',
  };

  const analysis = buildDealAnalysis(deal, 'Strong');
  const assessment = buildMarketBenchmarkAssessment(deal, analysis);

  assert.ok(assessment);
  assert.equal(assessment?.tone, 'bad');
  assert.ok(assessment?.detail.includes('market price') || assessment?.detail.includes('target'));
  assert.ok(assessment?.negotiationScript.includes('research') || assessment?.negotiationScript.includes('target'));
});

test('buildDealConfidence reflects completeness of deal inputs', () => {
  const sparse = buildDealConfidence(createInitialDeal());
  const complete = buildDealConfidence({
    ...createInitialDeal(),
    dealershipName: 'Metro Auto',
    vehiclePrice: '25000',
    dealerFees: '995',
    addOns: '0',
    downPayment: '3000',
    apr: '6.9',
    months: '60',
  });

  assert.equal(sparse.tone, 'bad');
  assert.ok(sparse.missingFields.length > 3);
  assert.equal(complete.tone, 'good');
  assert.ok(complete.score > sparse.score);
});

test('importQuoteText extracts common quote fields and line items', () => {
  const result = importQuoteText(`
Dealer: Metro Auto
Selling price: $25,995
Doc fee: $499
Title fee: $39
Protection package: $1,295
APR: 8.9%
Term: 72 months
Trade allowance: $6,000
Down payment: $2,000
  `);

  assert.equal(result.parsedDeal.dealershipName, 'Metro Auto');
  assert.equal(result.parsedDeal.vehiclePrice, '25995');
  assert.equal(result.parsedDeal.apr, '8.9');
  assert.equal(result.parsedDeal.months, '72');
  assert.equal(result.parsedDeal.tradeIn, '6000');
  assert.equal(result.parsedDeal.downPayment, '2000');
  assert.equal(result.parsedDeal.feeItems?.length, 2);
  assert.equal(result.parsedDeal.addOnItems?.length, 1);
  assert.ok(result.reviewNotes[0]?.includes('Matched'));
});

test('importQuoteText cleans up OCR-like month mistakes and flags them for review', () => {
  const result = importQuoteText(`
Term: GO months
APR: 8.9%
Selling price: $22,500
  `);

  assert.equal(result.parsedDeal.months, '60');
  assert.ok(result.fieldReviews.some((item) => item.field === 'Term' && item.confidence === 'medium'));
  assert.ok(result.reviewNotes.some((item) => item.includes('corrected') || item.includes('should be confirmed')));
});

test('importQuoteText reports missing core fields when OCR does not find them', () => {
  const result = importQuoteText(`
Protection package: $1,295
Doc fee: $499
  `);

  assert.ok(result.missingFields.includes('Vehicle price'));
  assert.ok(result.missingFields.includes('APR'));
  assert.ok(result.missingFields.includes('Term'));
  assert.ok(result.reviewNotes.some((item) => item.includes('Still missing')));
});

test('importQuoteText recognizes shorthand field labels often seen in worksheets', () => {
  const result = importQuoteText(`
Price: $31,400
DP: $2,500
Interest Rate: 7.4%
Trade: $4,000
Term: 60 months
  `);

  assert.equal(result.parsedDeal.vehiclePrice, '31400');
  assert.equal(result.parsedDeal.downPayment, '2500');
  assert.equal(result.parsedDeal.apr, '7.4');
  assert.equal(result.parsedDeal.tradeIn, '4000');
  assert.equal(result.parsedDeal.months, '60');
});
