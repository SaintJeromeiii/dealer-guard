import { currency } from './finance.ts';
import type { DealerGuardAppData } from './types.ts';

export type RoadmapStepId = 'budget' | 'quickCheck' | 'lotInspection' | 'contractScan';

export type RoadmapStepStatus = 'completed' | 'active' | 'future';

export type RoadmapStepDefinition = {
  id: RoadmapStepId;
  stepNumber: number;
  title: string;
  description: string;
  actionLabel: string;
  requiresPro?: boolean;
  proSubtitle?: string;
};

export type RoadmapStepViewModel = RoadmapStepDefinition & {
  status: RoadmapStepStatus;
  summary: string | null;
  isProLocked: boolean;
};

export const ROADMAP_STEPS: RoadmapStepDefinition[] = [
  {
    id: 'budget',
    stepNumber: 1,
    title: 'Budget',
    description: 'Model your monthly payment, down payment, and total paid ceiling before you talk to a salesperson.',
    actionLabel: 'Set your budget',
  },
  {
    id: 'quickCheck',
    stepNumber: 2,
    title: 'Quick Check',
    description: 'Enter or import a quote and let DealShield flag risky fees, APR, and add-ons early.',
    actionLabel: 'Run quick quote check',
  },
  {
    id: 'lotInspection',
    stepNumber: 3,
    title: 'Physical Lot Check',
    description: 'Stay on script at the dealership with live coaching, pressure tracking, and response scripts.',
    actionLabel: 'Open physical lot check',
    requiresPro: true,
    proSubtitle: 'Includes Live Coaching, Pressure Tracking & Scripts (Pro Feature)',
  },
  {
    id: 'contractScan',
    stepNumber: 4,
    title: 'Contract Scan',
    description: 'Scan the buyer order or finance contract and audit hidden markups before anyone signs.',
    actionLabel: 'Scan contract paperwork',
  },
];

function isBudgetStepComplete(appData: DealerGuardAppData) {
  const { deal } = appData;
  if (deal.targetTotalPaid.trim()) return true;
  if (deal.downPayment.trim() && deal.outsideLenderApr.trim() && deal.months.trim()) return true;
  return false;
}

function isQuickCheckStepComplete(appData: DealerGuardAppData) {
  const { deal } = appData;
  if (!deal.vehiclePrice.trim()) return false;
  return Boolean(deal.apr.trim() || deal.months.trim() || deal.dealerFees.trim() || deal.feeItems.length > 0);
}

function isLotInspectionStepComplete(appData: DealerGuardAppData) {
  return (
    appData.negotiationFlags.length > 0 ||
    appData.pressureIncidents.length > 0 ||
    appData.visitTimeline.some((entry) => entry.type === 'pressureLogged')
  );
}

function isContractScanStepComplete(appData: DealerGuardAppData) {
  const { deal } = appData;
  return (
    deal.contractScannedText.trim().length > 0 ||
    deal.contractImportReviewNotes.some((note) => /ocr/i.test(note)) ||
    Boolean(deal.contractVehiclePrice.trim() && deal.contractApr.trim())
  );
}

const COMPLETION_CHECKS: Record<RoadmapStepId, (appData: DealerGuardAppData) => boolean> = {
  budget: isBudgetStepComplete,
  quickCheck: isQuickCheckStepComplete,
  lotInspection: isLotInspectionStepComplete,
  contractScan: isContractScanStepComplete,
};

function buildStepSummary(stepId: RoadmapStepId, appData: DealerGuardAppData): string {
  const { deal } = appData;

  switch (stepId) {
    case 'budget':
      if (deal.targetTotalPaid.trim()) {
        return `Target total paid: ${currency(deal.targetTotalPaid)}`;
      }
      if (deal.downPayment.trim() && deal.outsideLenderApr.trim()) {
        return `Budget guardrails: ${currency(deal.downPayment)} down at ${deal.outsideLenderApr}% for ${deal.months || '?'} months`;
      }
      return 'Budget guardrails saved';
    case 'quickCheck': {
      const dealer = deal.dealershipName.trim() || 'Latest quote';
      const price = deal.vehiclePrice.trim() ? currency(deal.vehiclePrice) : 'Quote captured';
      const apr = deal.apr.trim() ? ` at ${deal.apr}% APR` : '';
      return `${dealer}: ${price}${apr}`;
    }
    case 'lotInspection':
      if (appData.pressureIncidents.length > 0) {
        return `${appData.pressureIncidents.length} pressure incident${appData.pressureIncidents.length === 1 ? '' : 's'} logged`;
      }
      if (appData.negotiationFlags.length > 0) {
        return `${appData.negotiationFlags.length} tactic${appData.negotiationFlags.length === 1 ? '' : 's'} flagged on the lot`;
      }
      return 'Lot inspection session started';
    case 'contractScan':
      if (deal.contractScannedText.trim()) {
        return 'Contract text scanned and audited';
      }
      if (deal.contractVehiclePrice.trim()) {
        return `Contract loaded: ${currency(deal.contractVehiclePrice)} vehicle price`;
      }
      return 'Contract paperwork reviewed';
    default:
      return 'Step completed';
  }
}

export function buildCarBuyingRoadmap(appData: DealerGuardAppData, isPremium: boolean): {
  currentStepId: RoadmapStepId;
  steps: RoadmapStepViewModel[];
} {
  const completion = ROADMAP_STEPS.map((step) => COMPLETION_CHECKS[step.id](appData));
  const firstIncompleteIndex = completion.findIndex((done) => !done);
  const activeIndex = firstIncompleteIndex === -1 ? ROADMAP_STEPS.length - 1 : firstIncompleteIndex;

  const steps = ROADMAP_STEPS.map((step, index) => {
    const isComplete = completion[index];
    let status: RoadmapStepStatus = 'future';

    if (isComplete) {
      status = 'completed';
    } else if (index === activeIndex) {
      status = 'active';
    }

    const isProLocked = Boolean(step.requiresPro && !isPremium && status !== 'future');

    return {
      ...step,
      status,
      summary: isComplete ? buildStepSummary(step.id, appData) : null,
      isProLocked,
    };
  });

  return {
    currentStepId: ROADMAP_STEPS[activeIndex]?.id ?? 'contractScan',
    steps,
  };
}
