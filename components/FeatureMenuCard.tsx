import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ProFeatureBadge from '@/components/ProFeatureBadge';
import { SHIELD_THEME } from '@/constants/shield-theme';

type FeatureMenuCardProps = {
  title: string;
  description: string;
  requiresPro?: boolean;
  isPremium: boolean;
  onPress: () => void;
  onPaywall: () => void;
};

export default function FeatureMenuCard({
  title,
  description,
  requiresPro = false,
  isPremium,
  onPress,
  onPaywall,
}: FeatureMenuCardProps) {
  function handlePress() {
    if (requiresPro && !isPremium) {
      onPaywall();
      return;
    }
    onPress();
  }

  return (
    <TouchableOpacity
      style={[styles.menuCard, requiresPro && isPremium && styles.menuCardUnlocked]}
      onPress={handlePress}
      activeOpacity={0.88}
    >
      {requiresPro ? (
        <View style={styles.badgeCorner}>
          <ProFeatureBadge unlocked={isPremium} />
        </View>
      ) : null}
      <Text style={[styles.menuTitle, requiresPro && styles.menuTitleWithBadge]}>{title}</Text>
      <Text style={styles.menuDesc}>{description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  menuCard: {
    position: 'relative',
    backgroundColor: SHIELD_THEME.surface,
    borderRadius: SHIELD_THEME.radius,
    padding: 18,
    borderWidth: 1,
    borderColor: SHIELD_THEME.border,
    gap: 6,
  },
  menuCardUnlocked: {
    borderColor: SHIELD_THEME.gold,
  },
  badgeCorner: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: SHIELD_THEME.text,
  },
  menuTitleWithBadge: {
    paddingRight: 108,
  },
  menuDesc: {
    color: SHIELD_THEME.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
