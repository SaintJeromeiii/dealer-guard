import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SHIELD_THEME } from '@/constants/shield-theme';

export default function ProFeatureBadge({
  unlocked,
  compact = false,
}: {
  unlocked: boolean;
  compact?: boolean;
}) {
  return (
    <View style={[styles.badge, compact && styles.badgeCompact, unlocked ? styles.unlocked : styles.locked]}>
      <Text style={[styles.label, compact && styles.labelCompact, unlocked ? styles.unlockedLabel : styles.lockedLabel]}>
        {unlocked ? (compact ? '✨ PRO' : '✨ PRO UNLOCKED') : '🔒 PRO'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  locked: {
    backgroundColor: SHIELD_THEME.badgeLockedBg,
    borderColor: SHIELD_THEME.badgeLockedBg,
  },
  unlocked: {
    backgroundColor: 'transparent',
    borderColor: SHIELD_THEME.gold,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  labelCompact: {
    fontSize: 9,
    letterSpacing: 0.3,
  },
  lockedLabel: {
    color: SHIELD_THEME.badgeLockedText,
  },
  unlockedLabel: {
    color: SHIELD_THEME.gold,
  },
});
