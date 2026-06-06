import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ProFeatureBadge from '@/components/ProFeatureBadge';
import { SHIELD_SURFACE, SHIELD_THEME } from '@/constants/shield-theme';

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
    ...SHIELD_SURFACE.card,
    padding: 18,
    gap: 6,
  },
  menuCardUnlocked: {
    borderColor: SHIELD_THEME.gold,
  },
  badgeCorner: SHIELD_SURFACE.badgeCorner,
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
