import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildWatchlistAnalysis,
  createBlankListingImport,
  createWatchedVehicleFromImport,
  displayWatchedVehicleLocation,
  displayWatchedVehicleTitle,
  importListingText,
} from '../utils/watchlist.ts';

const SAMPLE_AUTOTRADER_TEXT = `
2021 Honda Civic EX
$18,995
42,150 mi
Wayne County, MI (23 mi away)
Dealer: Lakeside Honda
Internet price $18995
`;

test('importListingText extracts year make model price location distance and mileage', () => {
  const result = importListingText(SAMPLE_AUTOTRADER_TEXT, 'file://listing.jpg', 'photo OCR');

  assert.equal(result.year, '2021');
  assert.equal(result.make, 'Honda');
  assert.equal(result.model, 'Civic');
  assert.equal(result.trim, 'EX');
  assert.equal(result.askingPrice, '18995');
  assert.equal(result.mileage, '42150');
  assert.match(result.cityOrCounty, /Wayne County/i);
  assert.equal(result.stateCode, 'MI');
  assert.equal(result.milesAway, '23');
  assert.ok(result.fieldReviews.some((item) => item.field === 'Miles away'));
  assert.equal(result.photoUri, 'file://listing.jpg');
});

test('createWatchedVehicleFromImport builds a saveable watchlist item', () => {
  const draft = importListingText(SAMPLE_AUTOTRADER_TEXT, 'file://listing.jpg');
  const vehicle = createWatchedVehicleFromImport(draft, {}, () => 'watch-1');

  assert.equal(vehicle.id, 'watch-1');
  assert.equal(displayWatchedVehicleTitle(vehicle), '2021 Honda Civic EX');
  assert.equal(vehicle.askingPrice, '18995');
  assert.equal(displayWatchedVehicleLocation(vehicle), 'Wayne County, MI · 23 mi away');
  assert.equal(vehicle.photoUri, 'file://listing.jpg');
});

test('createBlankListingImport opens an empty manual draft', () => {
  const draft = createBlankListingImport('file://manual.jpg', 'manual entry with photo');
  assert.equal(draft.askingPrice, '');
  assert.equal(draft.make, '');
  assert.equal(draft.cityOrCounty, '');
  assert.equal(draft.stateCode, '');
  assert.equal(draft.milesAway, '');
  assert.equal(draft.photoUri, 'file://manual.jpg');
  assert.ok(draft.reviewNotes[0]?.toLowerCase().includes('manually'));
});

test('buildWatchlistAnalysis compares price location and distance', () => {
  const first = createWatchedVehicleFromImport(importListingText(SAMPLE_AUTOTRADER_TEXT), {}, () => 'a');
  const second = createWatchedVehicleFromImport(
    importListingText(`
2019 Toyota Camry SE
$16,400
Ann Arbor, MI (8 mi away)
28,000 miles
`),
    {},
    () => 'b'
  );

  const analysis = buildWatchlistAnalysis([first, second], '18000');

  assert.equal(analysis.count, 2);
  assert.equal(analysis.cheapest?.id, 'b');
  assert.equal(analysis.mostExpensive?.id, 'a');
  assert.equal(analysis.nearest?.id, 'b');
  assert.equal(analysis.priceSpread, 2595);
  assert.ok(analysis.byLocation.length >= 2);
  assert.ok(analysis.byLocation.some((group) => group.nearestMiles === 8));
  assert.equal(analysis.vsBudget.length, 2);
  assert.ok(analysis.vsBudget.some((item) => item.vehicle.id === 'a' && item.gap > 0));
  assert.ok(analysis.vsBudget.some((item) => item.vehicle.id === 'b' && item.gap < 0));
});
