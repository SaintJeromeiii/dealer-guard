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
      detail: 'Tell Sign Check whether this is your first purchase so we can unlock the right checklist and roadmap.',
      actionLabel: 'Start setup',
      stepId: 'budget',
    };
  }

  switch (currentStepId) {
    case 'budget':
      return {
        title: experienceMode === 'firstTimeBuyer' ? 'Your next step: set a walk-away number' : 'Your next step: set budget guardrails',
        detail:
          experienceMode === 'firstTimeBuyer'
            ? 'What’s the most you’ll pay for this car, all-in? Lock that in before a salesperson picks a number for you.'
            : 'Lock in down payment, APR, term, and total paid ceiling before a salesperson sets them for you.',
        actionLabel: experienceMode === 'firstTimeBuyer' ? 'Set your walk-away number' : 'Set your budget',
        stepId: 'budget',
      };
    case 'quickCheck':
      return {
        title: 'Your next step: quick quote check',
        detail: 'Paste or import a dealership quote so Sign Check can flag risky fees, APR, and add-ons early.',
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
