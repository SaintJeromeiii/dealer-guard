export function currency(value: number | string) {
  const num = Number(value || 0);
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

export function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

export function computeAmountFinanced(
  salePrice: number,
  feesAndTaxes: number,
  addOns: number,
  downPayment: number,
  tradeCredit: number
) {
  const amountFinanced = salePrice + feesAndTaxes + addOns - downPayment - tradeCredit;
  return roundMoney(Math.max(0, amountFinanced));
}

export function computeTotalPaidOverLife(monthlyPayment: number, months: number, downPayment: number) {
  return roundMoney(monthlyPayment * months + downPayment);
}

export function estimateMonthlyPayment(amount: number, apr: number, months: number) {
  if (!amount || !months) return 0;
  const monthlyRate = apr / 100 / 12;
  if (!monthlyRate) return roundMoney(amount / months);
  const factor = Math.pow(1 + monthlyRate, months);
  const payment = (amount * monthlyRate * factor) / (factor - 1);
  return roundMoney(payment);
}
