import React from 'react';
import { StyleSheet, Text } from 'react-native';

const colors = {
  goodBg: '#dcfae6',
  goodText: '#166534',
  warnBg: '#fff1cc',
  warnText: '#9a6700',
  badBg: '#ffe2df',
  badText: '#b42318',
};

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
    backgroundColor: colors.goodBg,
    color: colors.goodText,
  },
  warn: {
    backgroundColor: colors.warnBg,
    color: colors.warnText,
  },
  bad: {
    backgroundColor: colors.badBg,
    color: colors.badText,
  },
});
