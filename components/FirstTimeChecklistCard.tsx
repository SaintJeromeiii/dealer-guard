import React from 'react';
import { StyleSheet, Text } from 'react-native';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import { SHIELD_THEME } from '@/constants/shield-theme';

type FirstTimeChecklistCardProps = {
  progressPercent: number;
  onOpenChecklist: () => void;
};

export default function FirstTimeChecklistCard({ progressPercent, onOpenChecklist }: FirstTimeChecklistCardProps) {
  return (
    <Card>
      <StatusBadge label="First-time buyer" tone="warn" />
      <Text style={styles.title}>Your dealership visit checklist</Text>
      <Text style={styles.detail}>
        Know what to bring, what to ask, and what to verify before you sign. {progressPercent}% complete.
      </Text>
      <AppButton label="Open checklist" variant="secondary" onPress={onOpenChecklist} />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    color: SHIELD_THEME.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 6,
  },
  detail: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
});
