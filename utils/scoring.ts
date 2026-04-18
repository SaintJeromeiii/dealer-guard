import type { Answers } from './types';

export function scoreAnswers(answers: Answers) {
  let score = 0;
  const missing: string[] = [];

  if (answers.budget && answers.budget !== "I don't know yet") score += 1;
  else missing.push('Set a safe monthly payment range.');

  if (answers.downPayment === 'Yes') score += 1;
  else missing.push('Decide how much you can put down.');

  if (answers.credit && answers.credit !== "I don't know") score += 1;
  else missing.push('Check your credit score range before visiting.');

  if (answers.preapproved === 'Yes') score += 2;
  else missing.push('Get pre-approved to compare financing offers.');

  if (answers.targetPrice === 'Yes' || answers.targetPrice === 'Somewhat') score += 1;
  else missing.push('Research the fair market value of the vehicle.');

  if (answers.tradeIn === 'No trade-in' || answers.tradeIn === 'Yes, and I know its value') score += 1;
  else missing.push('Estimate your trade-in value before the visit.');

  if (answers.walkAway === 'Yes') score += 2;
  else missing.push('Set a maximum out-the-door price.');

  return { score, missing, max: 9 };
}

export function getReadinessLabel(score: number) {
  if (score >= 8) return 'Strong';
  if (score >= 5) return 'Almost Ready';
  return 'Not Ready';
}