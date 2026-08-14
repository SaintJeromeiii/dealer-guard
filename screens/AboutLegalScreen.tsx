import Constants from 'expo-constants';
import React, { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import BillingDiagnosticsCard from '@/components/BillingDiagnosticsCard';
import Card from '@/components/Card';
import { SHIELD_SURFACE, SHIELD_THEME } from '@/constants/shield-theme';
import { getClosedBetaFeedbackUrl } from '@/constants/feedback-links';
import { openExternalLink } from '@/constants/legal-links';
import { useDealShieldBridge } from '@/contexts/deal-shield-bridge';
import { MATH_DISCLAIMER } from '@/utils/product-content';

const APP_VERSION = '1.0.2';
const APP_BUILD = '21';
const OWNER_UNLOCK_TAPS = 7;
const OWNER_UNLOCK_WINDOW_MS = 2500;
const IS_DEV_BUILD = typeof __DEV__ !== 'undefined' && __DEV__;

const LEGAL_DISCLAIMER =
  'DealShield and the AI Lot Coach provide negotiation guidance and real-time simulations only, and do not constitute certified legal, financial, or tax counsel. Verify every number against the dealer’s written buyer’s order before signing.';

export default function AboutLegalScreen() {
  const insets = useSafeAreaInsets();
  const bridge = useDealShieldBridge();
  const runtimeVersion = Constants.expoConfig?.version ?? APP_VERSION;
  const nativeBuild = Constants.nativeBuildVersion ?? APP_BUILD;
  const [ownerToolsUnlocked, setOwnerToolsUnlocked] = useState(IS_DEV_BUILD);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAppInfoPress = useCallback(() => {
    if (ownerToolsUnlocked) return;

    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, OWNER_UNLOCK_WINDOW_MS);

    if (tapCountRef.current >= OWNER_UNLOCK_TAPS) {
      tapCountRef.current = 0;
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      setOwnerToolsUnlocked(true);
      void bridge.refreshBillingDiagnostics();
    }
  }, [bridge.refreshBillingDiagnostics, ownerToolsUnlocked]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={handleAppInfoPress} accessibilityRole="button" accessibilityLabel="App info">
        <Card>
          <Text style={styles.title}>App info</Text>
          <Text style={styles.detail}>DealShield Version {APP_VERSION} (Build {APP_BUILD})</Text>
          <Text style={styles.meta}>
            Runtime {runtimeVersion} · Native build {nativeBuild}
          </Text>
        </Card>
      </Pressable>

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerTitle}>Disclaimer</Text>
        <Text style={styles.disclaimerText}>{LEGAL_DISCLAIMER}</Text>
        <Text style={styles.disclaimerFootnote}>{MATH_DISCLAIMER}</Text>
      </View>

      <Card>
        <Text style={styles.title}>Closed-test feedback</Text>
        <Text style={styles.detail}>
          Help improve DealShield before production. Share what you tested, what confused you, and any bugs you hit during the 14-day Play closed test.
        </Text>
        <AppButton
          label="Send closed-test feedback"
          onPress={() => void openExternalLink(getClosedBetaFeedbackUrl(), 'Closed-test feedback')}
        />
      </Card>

      {ownerToolsUnlocked ? (
        bridge.billingDiagnostics ? (
          <BillingDiagnosticsCard
            diagnostics={bridge.billingDiagnostics}
            busy={bridge.billingDiagnosticsBusy}
            onRefresh={() => void bridge.refreshBillingDiagnostics()}
          />
        ) : (
          <Card>
            <Text style={styles.title}>Billing diagnostics</Text>
            <Text style={styles.detail}>
              Open the main app once to initialize billing, then return here to review RevenueCat status, entitlement state, App user ID, and sync notes.
            </Text>
          </Card>
        )
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: SHIELD_THEME.bg,
  },
  container: {
    padding: 16,
    gap: 16,
  },
  title: {
    color: SHIELD_THEME.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  detail: {
    color: SHIELD_THEME.text,
    fontSize: 15,
    lineHeight: 22,
  },
  meta: {
    color: SHIELD_THEME.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  disclaimerBox: {
    ...SHIELD_SURFACE.inset,
    padding: 16,
    gap: 10,
    borderColor: SHIELD_THEME.warnText,
    backgroundColor: SHIELD_THEME.warnSoft,
  },
  disclaimerTitle: {
    color: SHIELD_THEME.warnText,
    fontSize: 16,
    fontWeight: '800',
  },
  disclaimerText: {
    color: SHIELD_THEME.text,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
  disclaimerFootnote: {
    color: SHIELD_THEME.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
});
