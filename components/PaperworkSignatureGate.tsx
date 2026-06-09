import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import { SHIELD_SURFACE, SHIELD_THEME } from '@/constants/shield-theme';
import type { SigningReadiness } from '@/utils/types';

type PaperworkSignatureGateProps = {
  readiness: SigningReadiness;
  onShareAudit?: () => void;
  onCheckpoint?: () => void;
};

export default function PaperworkSignatureGate({ readiness, onShareAudit, onCheckpoint }: PaperworkSignatureGateProps) {
  const gateLabel = readiness.readyToSign ? 'Safe to sign' : 'Not yet — hold';
  const gateTone = readiness.readyToSign ? 'good' : 'bad';

  return (
    <Card>
      <View style={styles.heroGate}>
        <Text style={styles.gateEmoji}>{readiness.readyToSign ? '✓' : '⏸'}</Text>
        <View style={styles.gateCopy}>
          <Text style={styles.gateTitle}>{gateLabel}</Text>
          <Text style={styles.gateDetail}>{readiness.headline}</Text>
        </View>
        <StatusBadge label={gateLabel} tone={gateTone} />
      </View>
      <Text style={styles.detail}>{readiness.detail}</Text>

      {readiness.blockers.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resolve before signing</Text>
          {readiness.blockers.map((item) => (
            <Text key={item} style={styles.blocker}>
              • {item}
            </Text>
          ))}
        </View>
      ) : null}

      {readiness.greenLights.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Green lights</Text>
          {readiness.greenLights.map((item) => (
            <Text key={item} style={styles.greenLight}>
              • {item}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Final checklist</Text>
        {readiness.checklist.map((item) => (
          <Text key={item} style={styles.checkItem}>
            • {item}
          </Text>
        ))}
      </View>

      <View style={styles.actions}>
        {onShareAudit ? <AppButton label="Share audit for second opinion" variant="secondary" onPress={onShareAudit} /> : null}
        {readiness.readyToSign && onCheckpoint ? (
          <AppButton label="Mark signing checkpoint complete" onPress={onCheckpoint} />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  heroGate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...SHIELD_SURFACE.inset,
    padding: 14,
    marginBottom: 12,
  },
  gateEmoji: {
    fontSize: 28,
    color: SHIELD_THEME.gold,
  },
  gateCopy: {
    flex: 1,
    gap: 4,
  },
  gateTitle: {
    color: SHIELD_THEME.text,
    fontSize: 20,
    fontWeight: '800',
  },
  gateDetail: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  detail: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  section: {
    marginBottom: 12,
    gap: 4,
  },
  sectionTitle: {
    color: SHIELD_THEME.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  blocker: {
    color: SHIELD_THEME.dangerText,
    fontSize: 14,
    lineHeight: 20,
  },
  greenLight: {
    color: SHIELD_THEME.successText,
    fontSize: 14,
    lineHeight: 20,
  },
  checkItem: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    gap: 10,
  },
});
