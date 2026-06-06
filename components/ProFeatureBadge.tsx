import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SHIELD_THEME } from '@/constants/shield-theme';

export default function ProFeatureBadge({ unlocked }: { unlocked: boolean }) {
  return (
    <View style={[styles.badge, unlocked ? styles.unlocked : styles.locked]}>
      <Text style={[styles.label, unlocked ? styles.unlockedLabel : styles.lockedLabel]}>
        {unlocked ? '✨ PRO UNLOCKED' : '🔒 PRO'}
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
  lockedLabel: {
    color: SHIELD_THEME.badgeLockedText,
  },
  unlockedLabel: {
    color: SHIELD_THEME.gold,
  },
});
