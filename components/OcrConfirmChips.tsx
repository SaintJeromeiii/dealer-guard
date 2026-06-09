import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { SHIELD_SURFACE, SHIELD_THEME } from '@/constants/shield-theme';

type OcrConfirmChipsProps = {
  fields: { field: string; value: string; confidence: 'high' | 'medium' }[];
  confirmedFields: Record<string, boolean>;
  onToggleConfirm: (field: string) => void;
};

export default function OcrConfirmChips({ fields, confirmedFields, onToggleConfirm }: OcrConfirmChipsProps) {
  const needsReview = fields.filter((item) => item.confidence === 'medium');
  if (!needsReview.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Tap to confirm reviewed fields</Text>
      <View style={styles.row}>
        {needsReview.map((item) => {
          const confirmed = confirmedFields[item.field];
          return (
            <TouchableOpacity
              key={item.field}
              style={[styles.chip, confirmed && styles.chipConfirmed]}
              onPress={() => onToggleConfirm(item.field)}
              activeOpacity={0.85}
            >
              <Text style={confirmed ? styles.chipTextConfirmed : styles.chipText}>
                {confirmed ? '✓ ' : ''}
                {item.field}: {item.value}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    marginBottom: 8,
  },
  label: {
    color: SHIELD_THEME.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    ...SHIELD_SURFACE.inset,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderColor: SHIELD_THEME.warnText,
  },
  chipConfirmed: {
    borderColor: SHIELD_THEME.successText,
    backgroundColor: SHIELD_THEME.successSoft,
  },
  chipText: {
    color: SHIELD_THEME.warnText,
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextConfirmed: {
    color: SHIELD_THEME.successText,
    fontSize: 12,
    fontWeight: '700',
  },
});
