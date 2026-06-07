import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AppButton from '@/components/AppButton';
import { SHIELD_SURFACE, SHIELD_THEME } from '@/constants/shield-theme';
import type { ExperienceMode } from '@/utils/types';
import type { RoadmapStepId, RoadmapStepViewModel } from '@/utils/roadmap';

type CarBuyingRoadmapProps = {
  steps: RoadmapStepViewModel[];
  experienceMode?: ExperienceMode;
  setupComplete?: boolean;
  onStepPress: (stepId: RoadmapStepId) => void;
  onPaywall: () => void;
};

export default function CarBuyingRoadmap({
  steps,
  experienceMode = 'standard',
  setupComplete = true,
  onStepPress,
  onPaywall,
}: CarBuyingRoadmapProps) {
  function handlePress(step: RoadmapStepViewModel) {
    if (!setupComplete) {
      Alert.alert(
        'Finish guided setup first',
        'Choose first-time or experienced buyer above and answer the short readiness questions. Then your roadmap unlocks in order.'
      );
      return;
    }

    if (step.status === 'future') {
      const priorStep = steps.find((item) => item.stepNumber === step.stepNumber - 1);
      Alert.alert(
        'Complete the prior milestone first',
        priorStep
          ? `Finish "${priorStep.title}" before unlocking ${step.title}. DealShield keeps the buying process in order so nothing gets missed.`
          : 'Finish the earlier milestones before moving forward.'
      );
      return;
    }

    if (step.isProLocked) {
      onPaywall();
      return;
    }

    onStepPress(step.id);
  }

  return (
    <View style={[styles.roadmap, !setupComplete && styles.roadmapLocked]}>
      <View style={styles.roadmapHeader}>
        <Text style={styles.roadmapTitle}>Car Buying Roadmap</Text>
        <Text style={styles.roadmapSubtitle}>
          {experienceMode === 'firstTimeBuyer'
            ? 'Follow these steps in order—we keep the language plain and focus on the numbers that protect you.'
            : 'Move through each milestone in order—from budget to contract scan.'}
        </Text>
      </View>

      <View style={styles.timeline}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const showCurrentBadge = step.status === 'active' && !step.isProLocked;

          return (
            <View key={step.id} style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <View
                  style={[
                    styles.timelineNode,
                    step.status === 'completed' && styles.timelineNodeCompleted,
                    showCurrentBadge && styles.timelineNodeActive,
                    step.isProLocked && styles.timelineNodeProLocked,
                  ]}
                >
                  <Text style={[styles.timelineNodeText, step.status === 'completed' && styles.timelineNodeTextCompleted]}>
                    {step.status === 'completed' ? '✓' : step.stepNumber}
                  </Text>
                </View>
                {!isLast ? <View style={[styles.timelineConnector, step.status === 'completed' && styles.timelineConnectorCompleted]} /> : null}
              </View>

              <TouchableOpacity
                activeOpacity={step.status === 'future' ? 1 : 0.9}
                onPress={() => handlePress(step)}
                style={[
                  styles.stepCard,
                  showCurrentBadge && styles.stepCardActive,
                  step.status === 'future' && styles.stepCardFuture,
                  step.isProLocked && styles.stepCardProLocked,
                ]}
              >
                {step.isProLocked ? (
                  <View style={styles.proLockBadge}>
                    <Text style={styles.proLockBadgeText}>🔒 PRO</Text>
                  </View>
                ) : null}

                {showCurrentBadge ? (
                  <View style={styles.currentStepBadge}>
                    <Text style={styles.currentStepBadgeText}>CURRENT STEP</Text>
                  </View>
                ) : null}

                <View style={styles.stepTitleRow}>
                  <Text
                    style={[
                      styles.stepTitle,
                      step.status === 'future' && styles.stepTitleFuture,
                      step.isProLocked && styles.stepTitleProLocked,
                    ]}
                  >
                    {step.status === 'future' ? '🔒 ' : ''}
                    Step {step.stepNumber}: {step.title}
                  </Text>
                </View>

                <Text style={styles.stepDescription}>{step.description}</Text>

                {step.isProLocked && step.proSubtitle ? (
                  <Text style={styles.stepProSubtitle}>{step.proSubtitle}</Text>
                ) : null}

                {step.status === 'completed' && step.summary ? (
                  <View style={styles.stepSummaryBox}>
                    <Text style={styles.stepSummaryLabel}>Completed</Text>
                    <Text style={styles.stepSummaryText}>{step.summary}</Text>
                  </View>
                ) : null}

                {step.status !== 'future' ? (
                  <View style={styles.stepActionWrap}>
                    <AppButton
                      label={
                        step.isProLocked
                          ? 'Unlock with DealShield Pro'
                          : step.status === 'completed'
                            ? `Review ${step.title.toLowerCase()}`
                            : step.actionLabel
                      }
                      variant={showCurrentBadge ? 'primary' : 'secondary'}
                      onPress={() => handlePress(step)}
                    />
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const PRO_LOCKED_SURFACE = '#0F1522';

const styles = StyleSheet.create({
  roadmap: {
    gap: 16,
  },
  roadmapLocked: {
    opacity: 0.55,
  },
  roadmapHeader: {
    gap: 6,
    paddingHorizontal: 2,
  },
  roadmapTitle: {
    color: SHIELD_THEME.text,
    fontSize: 22,
    fontWeight: '800',
  },
  roadmapSubtitle: {
    color: SHIELD_THEME.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  timeline: {
    gap: 14,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 14,
  },
  timelineRail: {
    width: 28,
    alignItems: 'center',
  },
  timelineNode: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: SHIELD_THEME.border,
    backgroundColor: SHIELD_THEME.surfaceInset,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNodeCompleted: {
    borderColor: SHIELD_THEME.successText,
    backgroundColor: SHIELD_THEME.successSoft,
  },
  timelineNodeActive: {
    borderColor: SHIELD_THEME.gold,
    backgroundColor: SHIELD_THEME.goldSoft,
  },
  timelineNodeProLocked: {
    borderColor: SHIELD_THEME.gold,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  timelineNodeText: {
    color: SHIELD_THEME.text,
    fontSize: 12,
    fontWeight: '800',
  },
  timelineNodeTextCompleted: {
    color: SHIELD_THEME.successText,
  },
  timelineConnector: {
    flex: 1,
    width: 2,
    minHeight: 48,
    marginTop: 4,
    backgroundColor: SHIELD_THEME.border,
    borderRadius: 999,
  },
  timelineConnectorCompleted: {
    backgroundColor: SHIELD_THEME.successText,
  },
  stepCard: {
    flex: 1,
    position: 'relative',
    ...SHIELD_SURFACE.card,
    padding: 16,
    gap: 10,
  },
  stepCardActive: {
    borderColor: SHIELD_THEME.gold,
    borderWidth: 2,
    shadowColor: SHIELD_THEME.gold,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  stepCardFuture: {
    opacity: 0.6,
  },
  stepCardProLocked: {
    backgroundColor: PRO_LOCKED_SURFACE,
    borderColor: SHIELD_THEME.gold,
    borderWidth: 1,
  },
  proLockBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: SHIELD_THEME.gold,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  proLockBadgeText: {
    color: SHIELD_THEME.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  currentStepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: SHIELD_THEME.goldSoft,
    borderWidth: 1,
    borderColor: SHIELD_THEME.gold,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  currentStepBadgeText: {
    color: SHIELD_THEME.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepTitle: {
    color: SHIELD_THEME.text,
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    paddingRight: 72,
  },
  stepTitleFuture: {
    color: SHIELD_THEME.textMuted,
  },
  stepTitleProLocked: {
    paddingRight: 88,
  },
  stepDescription: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  stepProSubtitle: {
    color: SHIELD_THEME.gold,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  stepSummaryBox: {
    ...SHIELD_SURFACE.inset,
    padding: 12,
    gap: 4,
    borderColor: SHIELD_THEME.successText,
  },
  stepSummaryLabel: {
    color: SHIELD_THEME.successText,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  stepSummaryText: {
    color: SHIELD_THEME.text,
    fontSize: 14,
    lineHeight: 20,
  },
  stepActionWrap: {
    marginTop: 2,
  },
});
