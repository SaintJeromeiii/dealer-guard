import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import { SHIELD_THEME } from '@/constants/shield-theme';
import type { BillingDiagnostics } from '@/utils/billing';

type BillingDiagnosticsCardProps = {
  diagnostics: BillingDiagnostics;
  busy?: boolean;
  onRefresh: () => void;
};

export default function BillingDiagnosticsCard({ diagnostics, busy = false, onRefresh }: BillingDiagnosticsCardProps) {
  const readyToPurchase = diagnostics.revenueCatConfigured && diagnostics.productResolved;

  return (
    <Card>
      <View style={styles.rowBetween}>
        <Text style={styles.title}>Billing diagnostics</Text>
        <StatusBadge
          label={readyToPurchase ? 'Store ready' : diagnostics.revenueCatConfigured ? 'Needs setup' : 'Dev build'}
          tone={readyToPurchase ? 'good' : 'warn'}
        />
      </View>
      <Text style={styles.detail}>
        Provider: {diagnostics.provider === 'revenuecat' ? 'RevenueCat' : 'Mock (local)'}
      </Text>
      <Text style={styles.detail}>Package: {diagnostics.packageName}</Text>
      {diagnostics.appUserId ? <Text style={styles.detail}>App user ID: {diagnostics.appUserId}</Text> : null}
      <Text style={styles.detail}>Product ID: {diagnostics.lifetimeProductId}</Text>
      <Text style={styles.detail}>Entitlement: {diagnostics.entitlementId}</Text>
      {diagnostics.productLabel ? <Text style={styles.detail}>Store product: {diagnostics.productLabel}</Text> : null}
      {diagnostics.syncNote ? <Text style={styles.note}>{diagnostics.syncNote}</Text> : null}
      <View style={styles.hintList}>
        {diagnostics.setupHints.map((hint) => (
          <Text key={hint} style={styles.hint}>
            • {hint}
          </Text>
        ))}
      </View>
      <AppButton label={busy ? 'Refreshing...' : 'Refresh billing status'} variant="secondary" onPress={onRefresh} disabled={busy} />
    </Card>
  );
}

const styles = StyleSheet.create({
  rowBetween: {
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
  },
  note: {
    color: SHIELD_THEME.text,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  hintList: {
    marginTop: 10,
    gap: 6,
  },
  hint: {
    color: SHIELD_THEME.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
