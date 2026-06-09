import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, TextInput, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import { SHIELD_SURFACE, SHIELD_THEME } from '@/constants/shield-theme';
import { currency, estimateMonthlyPayment } from '@/utils/finance';

const TERM_OPTIONS = [48, 60, 72] as const;

type QuickPaymentEstimatorProps = {
  onUseInDealReview?: (loanPrice: string, apr: string, months: number) => void;
};

export default function QuickPaymentEstimator({ onUseInDealReview }: QuickPaymentEstimatorProps) {
  const [loanPrice, setLoanPrice] = useState('');
  const [apr, setApr] = useState('');
  const [months, setMonths] = useState<(typeof TERM_OPTIONS)[number]>(60);

  const estimatedPayment = useMemo(() => {
    const principal = Number(loanPrice || 0);
    const rate = Number(apr || 0);
    if (!principal || !months) return 0;
    return estimateMonthlyPayment(principal, rate, months);
  }, [apr, loanPrice, months]);

  return (
    <Card>
      <Text style={styles.title}>Quick payment estimator</Text>
      <Text style={styles.subtitle}>Estimate a base monthly payment before you open a full deal review.</Text>

      <View style={styles.inputWrap}>
        <Text style={styles.inputLabel}>Loan amount (financed)</Text>
        <TextInput
          style={styles.input}
          value={loanPrice}
          onChangeText={setLoanPrice}
          placeholder="25000"
          placeholderTextColor={SHIELD_THEME.textMuted}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputWrap}>
        <Text style={styles.inputLabel}>APR (%)</Text>
        <TextInput
          style={styles.input}
          value={apr}
          onChangeText={setApr}
          placeholder="6.9"
          placeholderTextColor={SHIELD_THEME.textMuted}
          keyboardType="numeric"
        />
      </View>

      <Text style={styles.inputLabel}>Loan term</Text>
      <View style={styles.termRow}>
        {TERM_OPTIONS.map((option) => {
          const active = months === option;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.termChip, active && styles.termChipActive]}
              onPress={() => setMonths(option)}
              activeOpacity={0.85}
            >
              <Text style={active ? styles.termChipTextActive : styles.termChipText}>{option} mo</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.resultLabel}>Estimated base monthly payment</Text>
        <Text style={styles.resultValue}>{estimatedPayment > 0 ? currency(estimatedPayment) : '—'}</Text>
      </View>
      {onUseInDealReview && estimatedPayment > 0 ? (
        <AppButton
          label="Use in deal review"
          variant="secondary"
          onPress={() => onUseInDealReview(loanPrice, apr, months)}
        />
      ) : null}
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
  subtitle: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  inputWrap: {
    marginBottom: 10,
  },
  inputLabel: {
    color: SHIELD_THEME.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    ...SHIELD_SURFACE.inset,
    color: SHIELD_THEME.text,
    borderRadius: SHIELD_THEME.radius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  termRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  termChip: {
    flex: 1,
    ...SHIELD_SURFACE.inset,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  termChipActive: {
    borderColor: SHIELD_THEME.primary,
    backgroundColor: SHIELD_THEME.primarySoft,
  },
  termChipText: {
    color: SHIELD_THEME.textMuted,
    fontWeight: '700',
  },
  termChipTextActive: {
    color: SHIELD_THEME.text,
    fontWeight: '800',
  },
  resultCard: {
    ...SHIELD_SURFACE.inset,
    padding: 14,
    gap: 4,
  },
  resultLabel: {
    color: SHIELD_THEME.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  resultValue: {
    color: SHIELD_THEME.gold,
    fontSize: 28,
    fontWeight: '800',
  },
});
