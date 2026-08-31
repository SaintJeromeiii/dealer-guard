/** Approximate statewide average sales-tax rates for quick estimates only. */
export const STATE_SALES_TAX_RATES: Record<string, number> = {
  AL: 0.0922,
  AK: 0.0176,
  AZ: 0.084,
  AR: 0.0948,
  CA: 0.0879,
  CO: 0.0777,
  CT: 0.0635,
  DE: 0,
  FL: 0.0702,
  GA: 0.0732,
  HI: 0.0444,
  ID: 0.0603,
  IL: 0.0883,
  IN: 0.07,
  IA: 0.0694,
  KS: 0.0868,
  KY: 0.06,
  LA: 0.0956,
  ME: 0.055,
  MD: 0.06,
  MA: 0.0625,
  MI: 0.06,
  MN: 0.0749,
  MS: 0.0707,
  MO: 0.0825,
  MT: 0,
  NE: 0.0694,
  NV: 0.0823,
  NH: 0,
  NJ: 0.066,
  NM: 0.0783,
  NY: 0.0852,
  NC: 0.0698,
  ND: 0.0696,
  OH: 0.0723,
  OK: 0.0899,
  OR: 0,
  PA: 0.0634,
  RI: 0.07,
  SC: 0.0744,
  SD: 0.0611,
  TN: 0.0955,
  TX: 0.082,
  UT: 0.0725,
  VT: 0.0624,
  VA: 0.0575,
  WA: 0.0929,
  WV: 0.0655,
  WI: 0.0543,
  WY: 0.0536,
  DC: 0.06,
};

export const STATE_SALES_TAX_DISCLAIMER =
  'Estimate only. Local city/county rates and taxable fees vary. Confirm the sales-tax line on the buyer’s order.';

export function getStateSalesTaxRate(stateCode: string): number | null {
  const code = stateCode.trim().toUpperCase();
  if (!code || !(code in STATE_SALES_TAX_RATES)) return null;
  return STATE_SALES_TAX_RATES[code] ?? null;
}

export function estimateStateSalesTax(stateCode: string, vehiclePrice: string | number): {
  rate: number;
  amount: string;
  label: string;
} | null {
  const rate = getStateSalesTaxRate(stateCode);
  if (rate == null) return null;

  const price = Number(vehiclePrice || 0);
  if (!Number.isFinite(price) || price <= 0) return null;

  const amount = String(Math.round(price * rate));
  return {
    rate,
    amount,
    label: `${(rate * 100).toFixed(2).replace(/\.00$/, '')}% of vehicle price`,
  };
}
