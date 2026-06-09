import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import { SHIELD_SURFACE, SHIELD_THEME } from '@/constants/shield-theme';
import { currency } from '@/utils/finance';
import type { TradeInAssessment } from '@/utils/types';

type TradeEquityAuditCardProps = {
  assessment: TradeInAssessment;
  onCopyScript: () => void;
};

export default function TradeEquityAuditCard({ assessment, onCopyScript }: TradeEquityAuditCardProps) {
  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Trade equity audit</Text>
        <StatusBadge
          label={assessment.tone === 'good' ? 'Fair' : assessment.tone === 'warn' ? 'Review' : 'Low offer'}
          tone={assessment.tone}
        />
      </View>
      <Text style={styles.headline}>{assessment.headline}</Text>
      <Text style={styles.detail}>{assessment.detail}</Text>
      {assessment.benchmarkValue > 0 && assessment.offeredValue > 0 ? (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Dealer offer</Text>
            <Text style={styles.statValue}>{currency(assessment.offeredValue)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Your benchmark</Text>
            <Text style={styles.statValue}>{currency(assessment.benchmarkValue)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Gap</Text>
            <Text style={[styles.statValue, assessment.valueGap < -500 && styles.statBad]}>
              {assessment.valueGap >= 0 ? '+' : ''}
              {currency(assessment.valueGap)}
            </Text>
          </View>
        </View>
      ) : null}
      <View style={styles.scriptBox}>
        <Text style={styles.scriptLabel}>Say this:</Text>
        <Text style={styles.scriptText}>{assessment.negotiationScript}</Text>
      </View>
      <AppButton label="Copy trade script" variant="secondary" onPress={onCopyScript} />
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
  headline: {
    color: SHIELD_THEME.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  detail: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    ...SHIELD_SURFACE.inset,
    padding: 10,
    gap: 4,
  },
  statLabel: {
    color: SHIELD_THEME.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  statValue: {
    color: SHIELD_THEME.text,
    fontSize: 14,
    fontWeight: '800',
  },
  statBad: {
    color: SHIELD_THEME.dangerText,
  },
  scriptBox: {
    ...SHIELD_SURFACE.inset,
    padding: 12,
    gap: 4,
    marginBottom: 10,
  },
  scriptLabel: {
    color: SHIELD_THEME.gold,
    fontSize: 12,
    fontWeight: '800',
  },
  scriptText: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
