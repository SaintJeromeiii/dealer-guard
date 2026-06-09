import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import { SHIELD_THEME } from '@/constants/shield-theme';
import type { NextStepGuidance } from '@/utils/next-step';

type ShieldNextStepCardProps = {
  guidance: NextStepGuidance;
  onPress: () => void;
};

export default function ShieldNextStepCard({ guidance, onPress }: ShieldNextStepCardProps) {
  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{guidance.title}</Text>
        <StatusBadge label="Next" tone="warn" />
      </View>
      <Text style={styles.detail}>{guidance.detail}</Text>
      <AppButton label={guidance.actionLabel} onPress={onPress} />
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    color: SHIELD_THEME.text,
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  detail: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
});
