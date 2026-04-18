export function currency(value: number | string) {
  const num = Number(value || 0);
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

export function estimateMonthlyPayment(amount: number, apr: number, months: number) {
  if (!amount || !months) return 0;
  const monthlyRate = apr / 100 / 12;
  if (!monthlyRate) return amount / months;
  return (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
}