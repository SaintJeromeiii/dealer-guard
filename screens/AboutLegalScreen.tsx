import Constants from 'expo-constants';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import { getClosedBetaFeedbackUrl } from '@/constants/feedback-links';
import { SHIELD_SURFACE, SHIELD_THEME } from '@/constants/shield-theme';
import { openExternalLink, getPrivacyPolicyUrl, getSupportMailtoUrl, getSupportUrl, SUPPORT_EMAIL } from '@/constants/legal-links';
import { MATH_DISCLAIMER } from '@/utils/product-content';

const APP_VERSION = '1.0.4';

const LEGAL_DISCLAIMER =
  'Sign Check and the AI Lot Coach provide negotiation guidance and real-time simulations only, and do not constitute certified legal, financial, or tax counsel. Verify every number against the dealer’s written buyer’s order before signing.';

export default function AboutLegalScreen() {
  const insets = useSafeAreaInsets();
  const runtimeVersion = Constants.expoConfig?.version ?? APP_VERSION;
  const nativeBuild = Constants.nativeBuildVersion;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <Card>
        <Text style={styles.title}>App info</Text>
        <Text style={styles.detail}>Sign Check {runtimeVersion}</Text>
        {nativeBuild ? <Text style={styles.meta}>Build {nativeBuild}</Text> : null}
      </Card>

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerTitle}>Disclaimer</Text>
        <Text style={styles.disclaimerText}>{LEGAL_DISCLAIMER}</Text>
        <Text style={styles.disclaimerFootnote}>{MATH_DISCLAIMER}</Text>
      </View>

      <Card>
        <Text style={styles.title}>Contact & support</Text>
        <Text style={styles.detail}>
          Questions, bugs, or privacy requests: email {SUPPORT_EMAIL}. There is no Sign Check account. Purchases go through Google Play or the App Store.
        </Text>
        <View style={styles.buttonStack}>
          <AppButton label="Email support" onPress={() => void openExternalLink(getSupportMailtoUrl(), 'Email support')} />
          <AppButton
            label="Support website"
            variant="secondary"
            onPress={() => void openExternalLink(getSupportUrl(), 'Support website')}
          />
          <AppButton
            label="Privacy policy"
            variant="secondary"
            onPress={() => void openExternalLink(getPrivacyPolicyUrl(), 'Privacy policy')}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.title}>Feedback</Text>
        <Text style={styles.detail}>Tell me what worked, what confused you, or what broke.</Text>
        <AppButton
          label="Feedback"
          variant="secondary"
          onPress={() => void openExternalLink(getClosedBetaFeedbackUrl(), 'Feedback')}
        />
      </Card>
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
    marginBottom: 12,
  },
  buttonStack: {
    gap: 10,
  },
  meta: {
    color: SHIELD_THEME.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: -6,
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
