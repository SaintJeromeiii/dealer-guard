import React from 'react';
import { StyleSheet, View } from 'react-native';

import CarBuyingRoadmap from '@/components/CarBuyingRoadmap';
import FirstTimeChecklistCard from '@/components/FirstTimeChecklistCard';
import GuidedBuyerSetupCard from '@/components/GuidedBuyerSetupCard';
import ShieldNextStepCard from '@/components/ShieldNextStepCard';
import type { ExperienceMode } from '@/utils/types';
import type { NextStepGuidance } from '@/utils/next-step';
import type { RoadmapStepId, RoadmapStepViewModel } from '@/utils/roadmap';

type ScanHubContentProps = {
  onboardingComplete: boolean;
  experienceMode: ExperienceMode;
  headline: string;
  detail: string;
  checklistProgress: number;
  nextStep: NextStepGuidance;
  roadmapSteps: RoadmapStepViewModel[];
  onFirstTimeBuyer: () => void;
  onExperiencedBuyer: () => void;
  onUpdateSetup: () => void;
  onDisableFirstTimeMode?: () => void;
  onNextStep: () => void;
  onOpenChecklist: () => void;
  onRoadmapStepPress: (stepId: RoadmapStepId) => void;
  onPaywall: () => void;
};

export default function ScanHubContent({
  onboardingComplete,
  experienceMode,
  headline,
  detail,
  checklistProgress,
  nextStep,
  roadmapSteps,
  onFirstTimeBuyer,
  onExperiencedBuyer,
  onUpdateSetup,
  onDisableFirstTimeMode,
  onNextStep,
  onOpenChecklist,
  onRoadmapStepPress,
  onPaywall,
}: ScanHubContentProps) {
  return (
    <View style={styles.stackGap}>
      <GuidedBuyerSetupCard
        onboardingComplete={onboardingComplete}
        experienceMode={experienceMode}
        headline={headline}
        detail={detail}
        onFirstTimeBuyer={onFirstTimeBuyer}
        onExperiencedBuyer={onExperiencedBuyer}
        onUpdateSetup={onUpdateSetup}
        onDisableFirstTimeMode={onDisableFirstTimeMode}
      />
      {onboardingComplete ? <ShieldNextStepCard guidance={nextStep} onPress={onNextStep} /> : null}
      {experienceMode === 'firstTimeBuyer' && onboardingComplete ? (
        <FirstTimeChecklistCard progressPercent={checklistProgress} onOpenChecklist={onOpenChecklist} />
      ) : null}
      <CarBuyingRoadmap
        steps={roadmapSteps}
        experienceMode={experienceMode}
        setupComplete={onboardingComplete}
        onStepPress={onRoadmapStepPress}
        onPaywall={onPaywall}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stackGap: {
    gap: 12,
  },
});
