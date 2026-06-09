import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Card from '@/components/Card';
import { SHIELD_THEME } from '@/constants/shield-theme';
import { FREE_VS_PRO_ROWS } from '@/utils/product-content';

type FreeVsProComparisonProps = {
  title?: string;
};

export default function FreeVsProComparison({ title = 'Free vs Pro' }: FreeVsProComparisonProps) {
  return (
    <Card>
      <Text style={styles.title}>{title}</Text>
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
});
