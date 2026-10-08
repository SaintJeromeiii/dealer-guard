import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import { SHIELD_THEME } from '@/constants/shield-theme';
import {
  getClosedBetaChecklistProgress,
  type ClosedBetaChecklist,
} from '@/utils/closed-beta-checklist';

type ClosedBetaWelcomeCardProps = {
  checklist: ClosedBetaChecklist;
  onLoadSampleDeal: () => void;
  onOpenLotCoach: () => void;
  onLogPressure: () => void;
  onSendFeedback: () => void;
  onDismiss: () => void;
};

type StepConfig = {
  id: keyof Pick<ClosedBetaChecklist, 'sampleDealLoaded' | 'lotCoachAsked' | 'pressureLogged'>;
  title: string;
  detail: string;
  actionLabel: string;
  onPress: () => void;
};

export default function ClosedBetaWelcomeCard({
  checklist,
  onLoadSampleDeal,
  onOpenLotCoach,
  onLogPressure,
  onSendFeedback,
  onDismiss,
}: ClosedBetaWelcomeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { completed, total } = getClosedBetaChecklistProgress(checklist);

  const steps: StepConfig[] = [
    {
      id: 'sampleDealLoaded',
      title: 'Load the sample deal',
      detail: 'Pre-fills Metro Auto Group numbers so you can test without being at a dealership.',
      actionLabel: 'Try sample deal',
      onPress: onLoadSampleDeal,
    },
    {
      id: 'lotCoachAsked',
      title: 'Ask Lot Coach one question',
      detail: 'Try a desk-ready script using your sample deal context.',
      actionLabel: 'Open AI Lot Coach',
      onPress: onOpenLotCoach,
    },
    {
      id: 'pressureLogged',
      title: 'Log one pressure tactic',
      detail: 'Mark a tactic in live mode so Incident Logs has something to show.',
      actionLabel: 'Open live mode',
      onPress: onLogPressure,
    },
  ];

  return (
    <Card>
      <TouchableOpacity
        onPress={() => setExpanded((open) => !open)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={expanded ? 'Collapse closed-test welcome' : 'Open closed-test welcome'}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>CLOSED TEST WELCOME</Text>
            <Text style={styles.title}>5-minute tester path</Text>
            {expanded ? null : <Text style={styles.collapsedHint}>Tap to open the tester steps</Text>}
          </View>
          <View style={styles.headerMeta}>
            <StatusBadge label={`${completed}/${total} done`} tone={completed === total ? 'good' : 'warn'} />
            <Text style={styles.chevron}>{expanded ? 'Hide' : 'Open'}</Text>
          </View>
        </View>
      </TouchableOpacity>
      {expanded ? (
        <>
      <Text style={styles.detail}>
        New to Sign Check? Complete these three steps once. Premium Preview unlocks Pro tools for this walkthrough when billing is still syncing.
      </Text>

      <View style={styles.stepList}>
        {steps.map((step, index) => {
          const done = checklist[step.id];
          return (
            <View key={step.id} style={styles.stepRow}>
              <View style={[styles.stepBullet, done && styles.stepBulletDone]}>
                <Text style={[styles.stepBulletText, done && styles.stepBulletTextDone]}>{done ? '✓' : index + 1}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDetail}>{step.detail}</Text>
                {!done ? <AppButton label={step.actionLabel} variant="secondary" onPress={step.onPress} /> : null}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.footerActions}>
        <AppButton label="Send feedback" variant="secondary" onPress={onSendFeedback} />
        <TouchableOpacity onPress={onDismiss} activeOpacity={0.85}>
          <Text style={styles.dismissText}>Hide for now</Text>
        </TouchableOpacity>
      </View>
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  headerMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  collapsedHint: {
    color: SHIELD_THEME.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  chevron: {
    color: SHIELD_THEME.gold,
    fontSize: 12,
    fontWeight: '800',
  },
  eyebrow: {
    color: SHIELD_THEME.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: SHIELD_THEME.text,
    fontSize: 18,
    fontWeight: '800',
  },
  detail: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  stepList: {
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stepBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SHIELD_THEME.surfaceInset,
    borderWidth: 1,
    borderColor: SHIELD_THEME.border,
  },
  stepBulletDone: {
    backgroundColor: SHIELD_THEME.successSoft,
    borderColor: SHIELD_THEME.successText,
  },
  stepBulletText: {
    color: SHIELD_THEME.textMuted,
    fontWeight: '800',
    fontSize: 12,
  },
  stepBulletTextDone: {
    color: SHIELD_THEME.successText,
  },
  stepContent: {
    flex: 1,
    gap: 6,
  },
  stepTitle: {
    color: SHIELD_THEME.text,
    fontSize: 15,
    fontWeight: '800',
  },
  stepDetail: {
    color: SHIELD_THEME.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  footerActions: {
    marginTop: 14,
    gap: 10,
    alignItems: 'stretch',
  },
  dismissText: {
    color: SHIELD_THEME.textMuted,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
});
