import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { SHIELD_SURFACE, SHIELD_THEME } from '@/constants/shield-theme';
import {
  DESK_TACTIC_CHIPS,
  deskActionLabel,
  deskActionTone,
  getDeskScript,
  isQuoteOverCap,
  type CapVsQuoteRow,
} from '@/utils/desk-scripts';
import type { DealActionRecommendation, NegotiationFlag } from '@/utils/types';

type DeskHudProps = {
  action: DealActionRecommendation['action'];
  capRows: CapVsQuoteRow[];
  onLogTactic: (flag: NegotiationFlag) => void;
};

export default function DeskHud({ action, capRows, onLogTactic }: DeskHudProps) {
  const [activeFlag, setActiveFlag] = useState<NegotiationFlag | null>(null);
  const script = getDeskScript(activeFlag, action);
  const overCap = isQuoteOverCap(capRows);
  const tone = overCap && action !== 'Leave' ? 'bad' : deskActionTone(action);
  const monthly = capRows.find((row) => row.id === 'monthly');
  const otd = capRows.find((row) => row.id === 'otd');

  useEffect(() => {
    if (action === 'Leave' || overCap) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [action, overCap]);

  function handleChip(flag: NegotiationFlag) {
    setActiveFlag((current) => (current === flag ? null : flag));
    onLogTactic(flag);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  async function copyScript() {
    await Clipboard.setStringAsync(script);
    Alert.alert('Copied', 'Say-this line is on your clipboard.');
  }

  return (
    <View style={styles.shell}>
      <View style={[styles.verdictBar, tone === 'good' ? styles.verdictGood : tone === 'warn' ? styles.verdictWarn : styles.verdictBad]}>
        <Text style={styles.verdictText}>{deskActionLabel(action)}</Text>
        {overCap ? <Text style={styles.verdictHint}>OVER CAP</Text> : null}
      </View>

      <View style={styles.numbersRow}>
        <View style={styles.numberBlock}>
          <Text style={styles.numberLabel}>Monthly</Text>
          <Text style={[styles.numberValue, monthly?.overCap && styles.numberOver]}>{monthly?.them ?? '—'}</Text>
          <Text style={styles.numberCap}>cap {monthly?.cap ?? '—'}</Text>
        </View>
        <View style={styles.numberDivider} />
        <View style={styles.numberBlock}>
          <Text style={styles.numberLabel}>Total paid</Text>
          <Text style={[styles.numberValue, otd?.overCap && styles.numberOver]}>{otd?.them ?? '—'}</Text>
          <Text style={styles.numberCap}>cap {otd?.cap ?? '—'}</Text>
        </View>
      </View>

      <View style={styles.sayBox}>
        <Text style={styles.sayLabel}>SAY THIS</Text>
        <Text style={styles.sayText}>{script}</Text>
        <TouchableOpacity onPress={() => void copyScript()} activeOpacity={0.85} style={styles.copyHit}>
          <Text style={styles.copyText}>Copy line</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chipRow}>
        {DESK_TACTIC_CHIPS.map((chip) => {
          const active = activeFlag === chip.id;
          return (
            <TouchableOpacity
              key={chip.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => handleChip(chip.id)}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    gap: 14,
  },
  verdictBar: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verdictGood: {
    backgroundColor: SHIELD_THEME.successSoft,
  },
  verdictWarn: {
    backgroundColor: SHIELD_THEME.warnSoft,
  },
  verdictBad: {
    backgroundColor: SHIELD_THEME.dangerSoft,
  },
  verdictText: {
    color: SHIELD_THEME.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  verdictHint: {
    color: SHIELD_THEME.dangerText,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  numbersRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  numberBlock: {
    flex: 1,
    gap: 2,
  },
  numberDivider: {
    width: 1,
    backgroundColor: SHIELD_THEME.border,
    marginHorizontal: 14,
  },
  numberLabel: {
    color: SHIELD_THEME.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  numberValue: {
    color: SHIELD_THEME.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  numberOver: {
    color: SHIELD_THEME.dangerText,
  },
  numberCap: {
    color: SHIELD_THEME.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  sayBox: {
    ...SHIELD_SURFACE.inset,
    padding: 14,
    gap: 8,
  },
  sayLabel: {
    color: SHIELD_THEME.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  sayText: {
    color: SHIELD_THEME.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  copyHit: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  copyText: {
    color: SHIELD_THEME.gold,
    fontSize: 13,
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: SHIELD_THEME.surfaceInset,
    borderWidth: 1,
    borderColor: SHIELD_THEME.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipActive: {
    borderColor: SHIELD_THEME.gold,
    backgroundColor: SHIELD_THEME.goldSoft,
  },
  chipText: {
    color: SHIELD_THEME.text,
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: SHIELD_THEME.gold,
  },
});
