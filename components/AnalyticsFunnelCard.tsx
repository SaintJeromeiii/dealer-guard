import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Card from '@/components/Card';
import ProgressBar from '@/components/ProgressBar';
import { SHIELD_THEME } from '@/constants/shield-theme';
import type { FunnelStep } from '@/utils/analytics-funnel';

type AnalyticsFunnelCardProps = {
  steps: FunnelStep[];
  completionRate: number;
};

export default function AnalyticsFunnelCard({ steps, completionRate }: AnalyticsFunnelCardProps) {
  return (
    <Card>
      <Text style={styles.title}>Your buyer journey</Text>
      <Text style={styles.detail}>{completionRate}% of key milestones complete on this device.</Text>
      <ProgressBar value={completionRate} />
      <View style={styles.stack}>
        {steps.map((step) => (
          <View key={step.id} style={styles.row}>
            <Text style={step.complete ? styles.checkDone : styles.checkPending}>{step.complete ? '✓' : '○'}</Text>
            <View style={styles.copy}>
              <Text style={styles.stepLabel}>{step.label}</Text>
              <Text style={styles.stepDetail}>{step.detail}</Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    color: SHIELD_THEME.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  detail: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  stack: {
    gap: 10,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  checkDone: {
    color: SHIELD_THEME.successText,
    fontSize: 16,
    fontWeight: '800',
    width: 18,
  },
  checkPending: {
    color: SHIELD_THEME.textMuted,
    fontSize: 16,
    width: 18,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  stepLabel: {
    color: SHIELD_THEME.text,
    fontSize: 14,
    fontWeight: '700',
  },
  stepDetail: {
    color: SHIELD_THEME.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
