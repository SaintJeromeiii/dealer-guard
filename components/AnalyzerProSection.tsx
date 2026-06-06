import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ProFeatureBadge from '@/components/ProFeatureBadge';
import { SHIELD_SURFACE, SHIELD_THEME } from '@/constants/shield-theme';

type AnalyzerProSectionProps = {
  isPremium: boolean;
  onPaywall: () => void;
  children: React.ReactNode;
};

export default function AnalyzerProSection({ isPremium, onPaywall, children }: AnalyzerProSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Pro (Premium)</Text>
        {isPremium ? <ProFeatureBadge unlocked /> : <ProFeatureBadge unlocked={false} />}
      </View>

      <View style={styles.cardStack}>
        <View style={[styles.cardContent, !isPremium && styles.cardContentLocked]}>{children}</View>

        {!isPremium ? (
          <TouchableOpacity style={styles.lockOverlay} onPress={onPaywall} activeOpacity={0.92}>
            <View style={styles.lockPanel}>
              <Text style={styles.lockEmoji}>🔒</Text>
              <Text style={styles.lockTitle}>Premium Analyzer Tools</Text>
              <Text style={styles.lockCopy}>
                Upgrade to unlock What-if Lab and Finance Office Defense for advanced deal modeling and F&I prep.
              </Text>
              <View style={styles.unlockPill}>
                <Text style={styles.unlockPillText}>⚡ UPGRADE TO PRO</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: SHIELD_THEME.gold,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardStack: {
    position: 'relative',
    borderRadius: SHIELD_THEME.radius,
    overflow: 'hidden',
  },
  cardContent: {
    gap: 12,
  },
  cardContentLocked: {
    opacity: 0.55,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 15, 25, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: SHIELD_THEME.radius,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  lockPanel: {
    ...SHIELD_SURFACE.inset,
    width: '100%',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderColor: SHIELD_THEME.gold,
    backgroundColor: 'rgba(15, 21, 34, 0.92)',
  },
  lockEmoji: {
    fontSize: 28,
  },
  lockTitle: {
    color: SHIELD_THEME.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  lockCopy: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  unlockPill: {
    marginTop: 4,
    backgroundColor: SHIELD_THEME.gold,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  unlockPillText: {
    color: SHIELD_THEME.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
