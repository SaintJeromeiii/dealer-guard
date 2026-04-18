import React from 'react';
import { StyleSheet, Text } from 'react-native';

export default function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'good' | 'warn' | 'bad';
}) {
  return <Text style={[styles.badge, tone === 'good' ? styles.good : tone === 'warn' ? styles.warn : styles.bad]}>{label}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
  },
  good: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  warn: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  bad: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
});