import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDealShieldAuditDashboard } from '../utils/audit-dashboard.ts';

test('buildDealShieldAuditDashboard flags common dealership markups with costs', () => {
  const result = buildDealShieldAuditDashboard(`
    Buyer Order
    VIN Etching: $399
    Nitrogen tire fill $199
    Dealer Prep Fee 895
    Protection Plan $2,495
    Extended Service Contract 3,200
  `);

  assert.equal(result.flaggedCount, 5);
  assert.equal(result.items.length, 5);
  assert.deepEqual(
    result.items.map((item) => item.label),
    ['VIN Etching', 'Nitrogen Tire Fill', 'Prep Fee', 'Protection Plan', 'Service Contract']
  );
  assert.equal(result.items[0]?.costLabel, '$399');
  assert.equal(result.items[1]?.amount, '199');
  assert.ok(result.items.every((item) => item.explanation.length > 0));
  assert.ok(result.items.every((item) => item.removalTip.length > 0));
});

test('buildDealShieldAuditDashboard returns empty results for clean contract text', () => {
  const result = buildDealShieldAuditDashboard('Vehicle price: $24,995\nAPR: 6.9%\nTerm: 60 months');

  assert.equal(result.flaggedCount, 0);
  assert.deepEqual(result.items, []);
});

test('buildDealShieldAuditDashboard handles missing amounts gracefully', () => {
  const result = buildDealShieldAuditDashboard('Protection Plan included per manager');

  assert.equal(result.flaggedCount, 1);
  assert.equal(result.items[0]?.label, 'Protection Plan');
  assert.equal(result.items[0]?.costLabel, 'Amount not detected');
});
