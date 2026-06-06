import type { Answers, AppPreferences, DealState, ExperienceMode, ReadinessLabel } from './types.ts';
import type { RoadmapStepId } from './roadmap.ts';

export type ReadinessNextActionKind = 'roadmapBudget' | 'roadmapQuickCheck' | 'checklist' | 'roadmapCurrent';

export type ReadinessNextAction = {
  label: string;
  description: string;
  kind: ReadinessNextActionKind;
};

const CREDIT_APR_BENCHMARKS: Record<string, string> = {
  Excellent: '5.5',
  Good: '7.5',
  Fair: '10.5',
  Poor: '14.5',
};

export function mapCreditAnswerToBand(credit: string | undefined): AppPreferences['creditBand'] {
  switch (credit) {
    case 'Excellent':
      return 'excellent';
    case 'Good':
      return 'good';
    case 'Fair':
      return 'fair';
    case 'Poor':
      return 'building';
    default:
      return 'unknown';
  }
}

export function derivePreferencesFromAnswers(answers: Answers, current: AppPreferences): AppPreferences {
  const hasTrade =
    answers.tradeIn === 'No trade-in' ? false : answers.tradeIn ? true : current.hasTrade;

  const financingNeed: AppPreferences['financingNeed'] =
    answers.preapproved === 'Yes' || answers.preapproved === 'No' || answers.preapproved === 'Working on it'
      ? 'finance'
      : current.financingNeed;

  let buyerStage = current.buyerStage;
  if (answers.tradeIn === 'Yes, and I know its value' || answers.tradeIn === "Yes, but I don't know its value") {
    buyerStage = 'tradeShopper';
  } else if (buyerStage === 'undecided' && current.experienceMode === 'firstTimeBuyer') {
    buyerStage = 'firstCar';
  }

  return {
    ...current,
    onboardingComplete: true,
    creditBand: mapCreditAnswerToBand(answers.credit),
    hasTrade,
    financingNeed,
    buyerStage,
  };
}

export function applyReadinessAnswersToDeal(deal: DealState, answers: Answers): Partial<DealState> {
  const patch: Partial<DealState> = {};
  let offerNotes = deal.offerNotes.trim();

  if (!deal.outsideLenderApr.trim() && answers.credit && CREDIT_APR_BENCHMARKS[answers.credit]) {
    patch.outsideLenderApr = CREDIT_APR_BENCHMARKS[answers.credit];
  }

  if (!deal.outsideLenderTerm.trim() && !deal.months.trim()) {
    patch.outsideLenderTerm = '60';
    patch.months = '60';
  }

  if (answers.budget && answers.budget !== "I don't know yet" && !offerNotes.includes('Setup monthly budget')) {
    offerNotes = offerNotes ? `${offerNotes}\nSetup monthly budget: ${answers.budget}.` : `Setup monthly budget: ${answers.budget}.`;
  }

  if (answers.downPayment === 'Yes' && !offerNotes.toLowerCase().includes('down payment')) {
    offerNotes = offerNotes
      ? `${offerNotes}\nSetup note: you have savings for a down payment—enter the amount in budget and quote tools.`
      : 'Setup note: you have savings for a down payment—enter the amount in budget and quote tools.';
  }

  if (offerNotes !== deal.offerNotes.trim()) {
    patch.offerNotes = offerNotes;
  }

  return patch;
}

export function getReadinessNextAction(
  readinessLabel: ReadinessLabel,
  missing: string[],
  currentStepId: RoadmapStepId,
  experienceMode: ExperienceMode
): ReadinessNextAction {
  const firstTime = experienceMode === 'firstTimeBuyer';

  if (readinessLabel === 'Not Ready') {
    const needsNumbers = missing.some(
      (item) =>
        item.includes('monthly payment') ||
        item.includes('down') ||
        item.includes('walk-away') ||
        item.includes('pre-approved')
    );

    if (needsNumbers) {
      return {
        label: firstTime ? 'Set your budget (Step 1)' : 'Open budget step',
        description: firstTime
          ? 'Lock in payment and walk-away guardrails before anyone at the desk sets them for you.'
          : 'Model your payment ceiling and total paid limit first.',
        kind: 'roadmapBudget',
      };
    }

    return {
      label: firstTime ? 'Work through the checklist' : 'Open dealership checklist',
      description: 'Finish the basics you still need before visiting the lot.',
      kind: 'checklist',
    };
  }

  if (readinessLabel === 'Almost Ready') {
    return {
      label: firstTime ? 'Run Quick Check (Step 2)' : 'Run a quick quote check',
      description: 'Test a real quote against your guardrails while you still have leverage.',
      kind: 'roadmapQuickCheck',
    };
  }

  const stepLabels: Record<RoadmapStepId, string> = {
    budget: 'Set your budget',
    quickCheck: 'Run Quick Check',
    lotInspection: 'Open Physical Lot Check',
    contractScan: 'Scan contract paperwork',
  };

  return {
    label: firstTime ? `Continue roadmap: ${stepLabels[currentStepId]}` : `Continue: ${stepLabels[currentStepId]}`,
    description: 'You are in strong shape—move to the next milestone on your buying path.',
    kind: 'roadmapCurrent',
  };
}
