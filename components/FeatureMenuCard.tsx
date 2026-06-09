import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ProFeatureBadge from '@/components/ProFeatureBadge';
import { SHIELD_SURFACE, SHIELD_THEME } from '@/constants/shield-theme';

type FeatureMenuCardProps = {
  title: string;
  description: string;
  countLabel?: string;
  requiresPro?: boolean;
  requiresBudget?: boolean;
  budgetComplete?: boolean;
  isPremium: boolean;
  onPress: () => void;
  onPaywall: () => void;
  onBudgetGate?: () => void;
};

export default function FeatureMenuCard({
  title,
  description,
  countLabel,
  requiresPro = false,
  requiresBudget = false,
  budgetComplete = true,
  isPremium,
  onPress,
  onPaywall,
  onBudgetGate,
}: FeatureMenuCardProps) {
  const budgetLocked = requiresBudget && !budgetComplete;

  function handlePress() {
    if (budgetLocked) {
      onBudgetGate?.();
      return;
    }
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
      {budgetLocked ? (
        <View style={[styles.badgeCorner, requiresPro && styles.badgeCornerOffset]}>
          <Text style={styles.budgetBadge}>Step 1</Text>
        </View>
      ) : null}
      <View style={styles.titleRow}>
        <Text style={[styles.menuTitle, requiresPro && styles.menuTitleWithBadge]}>{title}</Text>
        {countLabel ? <Text style={styles.countLabel}>{countLabel}</Text> : null}
      </View>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: SHIELD_THEME.text,
  },
  countLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: SHIELD_THEME.gold,
  },
  budgetBadge: {
    color: SHIELD_THEME.warnText,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    backgroundColor: SHIELD_THEME.warnSoft,
    borderWidth: 1,
    borderColor: SHIELD_THEME.warnText,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeCornerOffset: {
    top: 44,
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
