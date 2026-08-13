import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Card from '@/components/Card';
import { SHIELD_THEME } from '@/constants/shield-theme';
import type { CapVsQuoteRow } from '@/utils/desk-scripts';

type CapVsQuoteCardProps = {
  rows: CapVsQuoteRow[];
};

export default function CapVsQuoteCard({ rows }: CapVsQuoteCardProps) {
  return (
    <Card>
      <Text style={styles.title}>Cap vs quote</Text>
      <Text style={styles.detail}>Glance this at the desk. Red means they are over your walk-away number.</Text>
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.labelCol]} />
        <Text style={styles.headerCell}>Them</Text>
        <Text style={styles.headerCell}>Your cap</Text>
      </View>
      {rows.map((row) => (
        <View key={row.id} style={styles.row}>
          <Text style={[styles.cell, styles.labelCol]}>{row.label}</Text>
          <Text style={[styles.cell, row.overCap && styles.over]}>{row.them}</Text>
          <Text style={styles.cell}>{row.cap}</Text>
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
    marginBottom: 6,
  },
  detail: {
    color: SHIELD_THEME.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: SHIELD_THEME.border,
    paddingBottom: 8,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: SHIELD_THEME.border,
    alignItems: 'center',
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
    color: SHIELD_THEME.text,
    fontSize: 15,
    fontWeight: '700',
  },
  labelCol: {
    flex: 1.1,
    color: SHIELD_THEME.textMuted,
    fontWeight: '700',
  },
  over: {
    color: SHIELD_THEME.dangerText,
  },
});
