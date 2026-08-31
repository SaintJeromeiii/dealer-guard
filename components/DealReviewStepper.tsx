import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { SHIELD_THEME } from '@/constants/shield-theme';
import { DEAL_REVIEW_WIZARD_STEPS, type DealReviewWizardStep } from '@/utils/first-run';

type DealReviewStepperProps = {
  step: DealReviewWizardStep;
  onSelect: (step: DealReviewWizardStep) => void;
};

export default function DealReviewStepper({ step, onSelect }: DealReviewStepperProps) {
  const current = DEAL_REVIEW_WIZARD_STEPS.find((entry) => entry.id === step) ?? DEAL_REVIEW_WIZARD_STEPS[0];

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {DEAL_REVIEW_WIZARD_STEPS.map((entry) => {
          const active = entry.id === step;
          return (
            <TouchableOpacity
              key={entry.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onSelect(entry.id)}
              activeOpacity={0.85}
            >
              <Text style={active ? styles.chipTextActive : styles.chipText}>{entry.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.title}>{current.title}</Text>
      <Text style={styles.hint}>{current.hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SHIELD_THEME.border,
    backgroundColor: SHIELD_THEME.surface,
  },
  chipActive: {
    backgroundColor: SHIELD_THEME.gold,
    borderColor: SHIELD_THEME.gold,
  },
  chipText: {
    color: SHIELD_THEME.textMuted,
    fontWeight: '800',
  },
  chipTextActive: {
    color: SHIELD_THEME.text,
    fontWeight: '800',
  },
  title: {
    color: SHIELD_THEME.text,
    fontSize: 18,
    fontWeight: '800',
  },
  hint: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
