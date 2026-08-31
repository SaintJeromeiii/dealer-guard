import assert from 'node:assert/strict';
import test from 'node:test';

import { createInitialAppData, createInitialDeal, sanitizeAppData, sanitizeSavedDeals, sanitizeWatchedVehicles } from '../utils/app-state.ts';

test('sanitizeAppData preserves valid records and falls back for invalid fields', () => {
  const sanitized = sanitizeAppData({
    answers: { budget: 'Under $300', ignoreMe: 7 },
    checkedItems: { 'Ask for the out-the-door price': true, broken: 'yes' },
    notes: 'Keep the printed quote.',
    negotiationFlags: ['paymentShift', 'nope'],
    pressureIncidents: [
      { id: 'incident-1', flag: 'paymentShift', dealershipName: 'Example Auto', notedAt: '2026-04-19T12:00:00.000Z' },
      { id: 'incident-2', flag: 'madeUpFlag', dealershipName: 'Example Auto', notedAt: '2026-04-19T12:05:00.000Z' },
    ],
    promises: [
      { id: 'promise-1', dealershipName: 'Example Auto', text: 'We will remove the prep fee.', status: 'open', notedAt: '2026-04-19T12:00:00.000Z', resolvedAt: null },
      { id: 'promise-2', dealershipName: 'Example Auto', text: 'Bad status', status: 'unknown', notedAt: '2026-04-19T12:05:00.000Z', resolvedAt: null },
    ],
    deal: {
      buyerStateCode: 'MI',
      dealershipName: 'Example Auto',
      offerNotes: 'Mentioned manager special.',
      vehiclePrice: '21000',
      marketVehiclePrice: '19800',
      marketComparablePricesText: '19800, 20100, 20500',
      outsideLenderApr: '5.9',
      outsideLenderTerm: '60',
      targetTotalPaid: '26500',
      tradeReferenceValue: '7000',
      tradePayoff: '5400',
      contractImportedPhotoUri: 'file://contract.png',
      contractImportReviewNotes: ['Imported from contract OCR'],
      contractVehiclePrice: '21000',
      contractFees: '499',
      contractAddOns: '0',
      contractDownPayment: '1000',
      contractTradeIn: '6500',
      contractApr: '6.9',
      contractMonths: '72',
      feeItems: [{ id: 'fee-1', label: 'Doc fee', amount: '499' }],
      addOnItems: [{ id: 'addon-1', label: 'Warranty', amount: '1200' }],
      months: '72',
    },
    preferences: {
      experienceMode: 'firstTimeBuyer',
      onboardingComplete: true,
      buyerStage: 'firstCar',
      financingNeed: 'finance',
      creditBand: 'good',
      hasTrade: true,
    },
    analyticsEvents: [
      { id: 'event-1', type: 'quote_imported', label: 'Quote imported', createdAt: '2026-04-19T12:10:00.000Z', detail: 'Imported a printed quote.' },
    ],
  });

  assert.deepEqual(sanitized.answers, { budget: 'Under $300' });
  assert.deepEqual(sanitized.checkedItems, { 'Ask for the out-the-door price': true });
  assert.deepEqual(sanitized.negotiationFlags, ['paymentShift']);
  assert.equal(sanitized.pressureIncidents.length, 1);
  assert.equal(sanitized.promises.length, 1);
  assert.equal(sanitized.deal.dealershipName, 'Example Auto');
  assert.equal(sanitized.deal.months, '72');
  assert.equal(sanitized.deal.tradeReferenceValue, '7000');
  assert.equal(sanitized.deal.tradePayoff, '5400');
  assert.equal(sanitized.deal.marketVehiclePrice, '19800');
  assert.equal(sanitized.deal.marketComparablePricesText, '19800, 20100, 20500');
  assert.equal(sanitized.deal.outsideLenderApr, '5.9');
  assert.equal(sanitized.deal.targetTotalPaid, '26500');
  assert.equal(sanitized.deal.contractImportedPhotoUri, 'file://contract.png');
  assert.equal(sanitized.deal.contractApr, '6.9');
  assert.equal(sanitized.deal.contractMonths, '72');
  assert.equal(sanitized.deal.feeItems.length, 1);
  assert.equal(sanitized.deal.addOnItems.length, 1);
  assert.deepEqual(sanitized.deal.importReviewNotes, []);
  assert.equal(sanitized.preferences.onboardingComplete, true);
  assert.equal(sanitized.preferences.walkthroughComplete, true);
  assert.equal(sanitized.preferences.buyerSituation, 'undecided');
  assert.equal(sanitized.preferences.buyerStage, 'firstCar');
  assert.equal(sanitized.analyticsEvents.length, 1);
});

test('sanitizeSavedDeals only keeps complete saved offers', () => {
  const deals = sanitizeSavedDeals([
    {
      ...createInitialDeal(),
      id: 'deal-1',
      savedAt: '2026-04-18T12:00:00.000Z',
      dealershipName: 'Saved Deal',
    },
    {
      dealershipName: 'Broken Deal',
    },
  ]);

  assert.equal(deals.length, 1);
  assert.equal(deals[0]?.id, 'deal-1');
  assert.equal(deals[0]?.seriesId, 'deal-1');
  assert.equal(deals[0]?.revisionNumber, 1);
});

test('sanitizeWatchedVehicles keeps complete listings and drops broken ones', () => {
  const vehicles = sanitizeWatchedVehicles([
    {
      id: 'watch-1',
      savedAt: '2026-04-18T12:00:00.000Z',
      photoUri: 'file://a.jpg',
      rawOcrText: '2021 Honda Civic',
      year: '2021',
      make: 'Honda',
      model: 'Civic',
      trim: 'EX',
      title: '2021 Honda Civic EX',
      askingPrice: '18995',
      cityOrCounty: 'Detroit',
      stateCode: 'MI',
      milesAway: '12',
      mileage: '42150',
      dealerOrSeller: 'Lakeside Honda',
      listingUrl: '',
      notes: '',
    },
    {
      title: 'Missing id',
      askingPrice: '10000',
    },
  ]);

  assert.equal(vehicles.length, 1);
  assert.equal(vehicles[0]?.id, 'watch-1');
  assert.equal(vehicles[0]?.askingPrice, '18995');
  assert.equal(vehicles[0]?.cityOrCounty, 'Detroit');
  assert.equal(vehicles[0]?.stateCode, 'MI');
  assert.equal(vehicles[0]?.milesAway, '12');
});

test('sanitizeWatchedVehicles migrates legacy location strings', () => {
  const vehicles = sanitizeWatchedVehicles([
    {
      id: 'watch-legacy',
      savedAt: '2026-04-18T12:00:00.000Z',
      location: 'Ann Arbor, MI',
      askingPrice: '16400',
    },
  ]);

  assert.equal(vehicles.length, 1);
  assert.equal(vehicles[0]?.cityOrCounty, 'Ann Arbor');
  assert.equal(vehicles[0]?.stateCode, 'MI');
});

test('createInitialAppData returns the version-safe default shape', () => {
  const initial = createInitialAppData();
  assert.deepEqual(initial.answers, {});
  assert.equal(initial.deal.months, '');
  assert.equal(initial.pressureIncidents.length, 0);
  assert.equal(initial.promises.length, 0);
  assert.equal(initial.visitTimeline.length, 0);
  assert.equal(initial.savedDeals.length, 0);
  assert.equal(initial.watchedVehicles.length, 0);
  assert.equal(initial.billing.provider, 'mock');
  assert.equal(initial.billing.entitlementStatus, 'inactive');
  assert.equal(initial.subscription.usage.whatIfRuns, 0);
  assert.equal(initial.subscription.usage.checkpointPasses, 0);
  assert.equal(initial.preferences.onboardingComplete, false);
  assert.equal(initial.preferences.walkthroughComplete, false);
  assert.equal(initial.preferences.buyerSituation, 'undecided');
  assert.equal(initial.preferences.buyerStage, 'undecided');
  assert.equal(initial.analyticsEvents.length, 0);
});
