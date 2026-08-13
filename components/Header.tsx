import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { SHIELD_THEME } from '@/constants/shield-theme';

type PlanStatus = 'free' | 'preview' | 'pro';

type HeaderProps = {
  title: string;
  subtitle?: string;
  planStatus?: PlanStatus;
  billingBusy?: boolean;
  onMenuPress?: () => void;
  onUpgradePress?: () => void;
  onPreviewPress?: () => void;
  onResetPress?: () => void;
};

export default function Header({
  title,
  subtitle,
  planStatus = 'free',
  billingBusy = false,
  onMenuPress,
  onUpgradePress,
  onPreviewPress,
  onResetPress,
}: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <TouchableOpacity
          onPress={onMenuPress}
          style={styles.menuButton}
          activeOpacity={0.85}
          accessibilityLabel="Open menu"
          accessibilityRole="button"
        >
          <Ionicons name="menu" size={24} color={SHIELD_THEME.text} />
        </TouchableOpacity>
        <View style={styles.titleCopy}>
          <Text style={styles.eyebrow}>DEALSHIELD</Text>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.actions}>
        {planStatus === 'pro' ? (
          <View style={styles.proActivePill}>
            <Text style={styles.proActivePillText}>Pro active</Text>
          </View>
        ) : planStatus === 'preview' ? (
          <TouchableOpacity onPress={onPreviewPress} style={styles.previewPill} activeOpacity={0.9}>
            <Text style={styles.previewPillText}>PREMIUM PREVIEW</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onUpgradePress}
            style={styles.upgradePill}
            activeOpacity={0.9}
            disabled={billingBusy}
          >
            <Text style={styles.upgradePillText}>{billingBusy ? 'PROCESSING...' : '⚡ UPGRADE TO PRO'}</Text>
          </TouchableOpacity>
        )}
        {onResetPress ? (
          <TouchableOpacity onPress={onResetPress} style={styles.resetPill} activeOpacity={0.85}>
            <Text style={styles.resetPillText}>Reset</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 0,
  },
  menuButton: {
    padding: 4,
    marginTop: 2,
  },
  titleCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    color: SHIELD_THEME.textMuted,
    fontWeight: '700',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: SHIELD_THEME.text,
    marginBottom: 4,
  },
  subtitle: {
    color: SHIELD_THEME.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    alignItems: 'flex-end',
    gap: 8,
    minWidth: 92,
  },
  upgradePill: {
    backgroundColor: SHIELD_THEME.gold,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: SHIELD_THEME.gold,
  },
  upgradePillText: {
    color: SHIELD_THEME.text,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  proActivePill: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: SHIELD_THEME.gold,
  },
  proActivePillText: {
    color: SHIELD_THEME.gold,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  previewPill: {
    backgroundColor: SHIELD_THEME.warnSoft,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: SHIELD_THEME.warnText,
  },
  previewPillText: {
    color: SHIELD_THEME.warnText,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  resetPill: {
    backgroundColor: SHIELD_THEME.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: SHIELD_THEME.border,
  },
  resetPillText: {
    color: SHIELD_THEME.textMuted,
    fontWeight: '600',
    fontSize: 12,
  },
});
