import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { SHIELD_THEME } from '@/constants/shield-theme';

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
    backgroundColor: SHIELD_THEME.successSoft,
    color: SHIELD_THEME.successText,
  },
  warn: {
    backgroundColor: SHIELD_THEME.warnSoft,
    color: SHIELD_THEME.warnText,
  },
  bad: {
    backgroundColor: SHIELD_THEME.dangerSoft,
    color: SHIELD_THEME.dangerText,
  },
});
