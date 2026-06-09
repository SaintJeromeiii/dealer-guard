import type { ExperienceMode } from './types.ts';
import type { RoadmapStepId } from './roadmap.ts';

export type NextStepGuidance = {
  title: string;
  detail: string;
  actionLabel: string;
  stepId: RoadmapStepId | 'checklist' | 'compare';
};

export function buildNextStepGuidance(
  onboardingComplete: boolean,
  experienceMode: ExperienceMode,
  currentStepId: RoadmapStepId
): NextStepGuidance {
  if (!onboardingComplete) {
    return {
      title: 'Finish guided setup',
      detail: 'Tell DealShield whether this is your first purchase so we can unlock the right checklist and roadmap.',
      actionLabel: 'Start setup',
      stepId: 'budget',
    };
  }

  if (experienceMode === 'firstTimeBuyer' && currentStepId === 'budget') {
    return {
      title: 'Your next step: dealership checklist',
      detail: 'Review what to bring and verify before you visit the lot. Then set your budget guardrails.',
      actionLabel: 'Open checklist',
      stepId: 'checklist',
    };
  }

  switch (currentStepId) {
    case 'budget':
      return {
        title: 'Your next step: set budget guardrails',
        detail: 'Lock in down payment, APR, term, and total paid ceiling before a salesperson sets them for you.',
        actionLabel: 'Set your budget',
        stepId: 'budget',
      };
    case 'quickCheck':
      return {
        title: 'Your next step: quick quote check',
        detail: 'Paste or import a dealership quote so DealShield can flag risky fees, APR, and add-ons early.',
        actionLabel: 'Run quick quote check',
        stepId: 'quickCheck',
      };
    case 'lotInspection':
      return {
        title: 'Your next step: physical lot check',
        detail: 'Use live coaching, pressure tracking, and response scripts while you are at the dealership.',
        actionLabel: 'Open lot check',
        stepId: 'lotInspection',
      };
    case 'contractScan':
      return {
        title: 'Your next step: contract scan',
        detail: 'Scan the buyer’s order or finance contract and audit hidden markups before anyone signs.',
        actionLabel: 'Scan contract',
        stepId: 'contractScan',
      };
    default:
      return {
        title: 'Your next step: compare offers',
        detail: 'Save multiple dealership quotes and compare total cost side by side.',
        actionLabel: 'Compare offers',
        stepId: 'compare',
      };
  }
}
