import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Card from '@/components/Card';
import ProFeatureBadge from '@/components/ProFeatureBadge';
import { SHIELD_THEME } from '@/constants/shield-theme';
import {
  AI_LOT_COACH_FEATURE_ROW,
  FREE_VS_PRO_ROWS,
  LIFETIME_PRO_ACTIVE_NOTE,
  LIFETIME_PRO_FEATURES,
  LIFETIME_PRO_PURCHASE_NOTE,
} from '@/utils/product-content';

type FreeVsProComparisonProps = {
  title?: string;
  showLifetimeIncluded?: boolean;
  showPurchaseNote?: boolean;
  isPro?: boolean;
  onLockedFeaturePress?: (feature: string) => void;
};

export default function FreeVsProComparison({
  title = 'Free vs Pro',
  showLifetimeIncluded = false,
  showPurchaseNote = false,
  isPro = false,
  onLockedFeaturePress,
}: FreeVsProComparisonProps) {
  return (
    <Card>
      <Text style={styles.title}>{title}</Text>
      {showPurchaseNote ? (
        <Text style={styles.purchaseNote}>{isPro ? LIFETIME_PRO_ACTIVE_NOTE : LIFETIME_PRO_PURCHASE_NOTE}</Text>
      ) : null}

      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.featureCol]}>Feature</Text>
        <Text style={styles.headerCell}>Free</Text>
        <Text style={styles.headerCell}>Pro</Text>
      </View>
      {FREE_VS_PRO_ROWS.map((row) => {
        const isAiLotCoach = row.feature === AI_LOT_COACH_FEATURE_ROW.feature;
        const isLocked = !isPro && isAiLotCoach;
        const rowContent = (
          <View style={[styles.row, isAiLotCoach && styles.highlightRow]}>
            <View style={[styles.featureCol, styles.featureNameCell]}>
              <Text
                style={[styles.featureNameText, isAiLotCoach && styles.highlightFeature]}
                numberOfLines={2}
              >
                {row.feature}
              </Text>
              {isAiLotCoach ? (
                <View style={styles.compactBadgeWrap}>
                  <ProFeatureBadge unlocked={isPro} compact />
                </View>
              ) : null}
            </View>
            <Text style={[styles.cell, row.free === 'No' && styles.freeNo]}>{row.free}</Text>
            <Text style={[styles.cell, row.pro === 'Yes' && styles.proYes]}>{row.pro}</Text>
          </View>
        );

        if (isLocked && onLockedFeaturePress) {
          return (
            <TouchableOpacity
              key={row.feature}
              activeOpacity={0.85}
              onPress={() => onLockedFeaturePress(row.feature)}
            >
              {rowContent}
            </TouchableOpacity>
          );
        }

        return <View key={row.feature}>{rowContent}</View>;
      })}

      {showLifetimeIncluded ? (
        <View style={styles.includedSection}>
          <Text style={styles.includedTitle}>{isPro ? 'Your lifetime Pro includes' : 'Included with lifetime Pro'}</Text>
          <View style={styles.includedList}>
            {LIFETIME_PRO_FEATURES.map((feature) => (
              <View key={feature.title} style={styles.includedItem}>
                <View style={styles.includedHeader}>
                  <Text style={styles.includedFeatureTitle}>{feature.title}</Text>
                  {isPro ? <ProFeatureBadge unlocked /> : null}
                </View>
                <Text style={styles.includedBenefit}>{feature.benefit}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
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
  purchaseNote: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
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
    alignItems: 'center',
  },
  highlightRow: {
    backgroundColor: SHIELD_THEME.goldSoft,
    borderRadius: SHIELD_THEME.radius,
    paddingHorizontal: 8,
    marginVertical: 2,
    borderBottomWidth: 0,
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
  },
  featureNameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 4,
    minWidth: 0,
  },
  featureNameText: {
    flexShrink: 1,
    color: SHIELD_THEME.text,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  highlightFeature: {
    color: SHIELD_THEME.gold,
    fontWeight: '800',
    fontSize: 12,
  },
  compactBadgeWrap: {
    flexShrink: 0,
  },
  freeNo: {
    color: SHIELD_THEME.dangerText,
    fontWeight: '700',
  },
  proYes: {
    color: SHIELD_THEME.successText,
    fontWeight: '700',
  },
  includedSection: {
    marginTop: 16,
    gap: 10,
  },
  includedTitle: {
    color: SHIELD_THEME.text,
    fontSize: 16,
    fontWeight: '800',
  },
  includedList: {
    gap: 10,
  },
  includedItem: {
    borderWidth: 1,
    borderColor: SHIELD_THEME.border,
    borderRadius: SHIELD_THEME.radius,
    padding: 12,
    gap: 6,
  },
  includedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  includedFeatureTitle: {
    flex: 1,
    color: SHIELD_THEME.text,
    fontSize: 15,
    fontWeight: '800',
  },
  includedBenefit: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
