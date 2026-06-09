import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Card from '@/components/Card';
import ProFeatureBadge from '@/components/ProFeatureBadge';
import { SHIELD_THEME } from '@/constants/shield-theme';
import {
  FREE_VS_PRO_ROWS,
  LIFETIME_PRO_ACTIVE_NOTE,
  LIFETIME_PRO_FEATURES,
  LIFETIME_PRO_PURCHASE_NOTE,
} from '@/utils/product-content';

type FreeVsProComparisonProps = {
  title?: string;
  showLifetimeIncluded?: boolean;
  showPurchaseNote?: boolean;
  isPro?: boolean;
};

export default function FreeVsProComparison({
  title = 'Free vs Pro',
  showLifetimeIncluded = false,
  showPurchaseNote = false,
  isPro = false,
}: FreeVsProComparisonProps) {
  return (
    <Card>
      <Text style={styles.title}>{title}</Text>
      {showPurchaseNote ? (
        <Text style={styles.purchaseNote}>{isPro ? LIFETIME_PRO_ACTIVE_NOTE : LIFETIME_PRO_PURCHASE_NOTE}</Text>
      ) : null}

      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.featureCol]}>Feature</Text>
        <Text style={styles.headerCell}>Free</Text>
        <Text style={styles.headerCell}>Pro</Text>
      </View>
      {FREE_VS_PRO_ROWS.map((row) => (
        <View key={row.feature} style={styles.row}>
          <Text style={[styles.cell, styles.featureCol]}>{row.feature}</Text>
          <Text style={styles.cell}>{row.free}</Text>
          <Text style={[styles.cell, row.pro === 'Yes' && styles.proYes]}>{row.pro}</Text>
        </View>
      ))}

      {showLifetimeIncluded ? (
        <View style={styles.includedSection}>
          <Text style={styles.includedTitle}>{isPro ? 'Your lifetime Pro includes' : 'Included with lifetime Pro'}</Text>
          <View style={styles.includedList}>
            {LIFETIME_PRO_FEATURES.map((feature) => (
              <View key={feature.title} style={styles.includedItem}>
                <View style={styles.includedHeader}>
                  <Text style={styles.includedFeatureTitle}>{feature.title}</Text>
                  {isPro ? <ProFeatureBadge unlocked /> : null}
                </View>
                <Text style={styles.includedBenefit}>{feature.benefit}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    color: SHIELD_THEME.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  purchaseNote: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: SHIELD_THEME.border,
    paddingBottom: 8,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: SHIELD_THEME.border,
  },
  headerCell: {
    flex: 1,
    color: SHIELD_THEME.gold,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cell: {
    flex: 1,
    color: SHIELD_THEME.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  featureCol: {
    flex: 1.6,
    color: SHIELD_THEME.text,
    fontWeight: '600',
  },
  proYes: {
    color: SHIELD_THEME.successText,
    fontWeight: '700',
  },
  includedSection: {
    marginTop: 16,
    gap: 10,
  },
  includedTitle: {
    color: SHIELD_THEME.text,
    fontSize: 16,
    fontWeight: '800',
  },
  includedList: {
    gap: 10,
  },
  includedItem: {
    borderWidth: 1,
    borderColor: SHIELD_THEME.border,
    borderRadius: SHIELD_THEME.radius,
    padding: 12,
    gap: 6,
  },
  includedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  includedFeatureTitle: {
    flex: 1,
    color: SHIELD_THEME.text,
    fontSize: 15,
    fontWeight: '800',
  },
  includedBenefit: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
