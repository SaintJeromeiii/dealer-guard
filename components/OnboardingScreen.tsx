import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import { SHIELD_THEME } from '@/constants/shield-theme';
import { BUYER_SITUATIONS, type ActiveBuyerSituation, type FirstRunProfile } from '@/utils/first-run';
import { getBottomTabPadding, getHeaderTopPadding } from '@/utils/safe-area';

type OnboardingStep = 'welcome' | 'experience' | 'situation';

export default function OnboardingScreen({
  onComplete,
  onSelectDealership,
}: {
  onComplete: (profile: FirstRunProfile) => void;
  onSelectDealership: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(true);

  function finish(situation: ActiveBuyerSituation) {
    onComplete({ situation, isFirstTimeBuyer });
  }

  return (
    <View
      style={[
        styles.safeArea,
        {
          paddingTop: getHeaderTopPadding(insets),
          paddingBottom: getBottomTabPadding(insets),
        },
      ]}
    >
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>DEALSHIELD</Text>
          {step === 'welcome' ? (
            <>
              <Text style={styles.title}>This app is for the person buying the car.</Text>
              <Text style={styles.subtitle}>
                We’ll help you set a walk-away number, check a quote, and know what to say on the lot — before anyone
                rushes you to sign.
              </Text>
              <StatusBadge label="Buyer-only" tone="good" />
            </>
          ) : null}
          {step === 'experience' ? (
            <>
              <Text style={styles.title}>Is this your first car purchase?</Text>
              <Text style={styles.subtitle}>We’ll keep the language simple if this is new. You can change this later.</Text>
            </>
          ) : null}
          {step === 'situation' ? (
            <>
              <Text style={styles.title}>Where are you right now?</Text>
              <Text style={styles.subtitle}>This hides extra tools so you only see what helps in this moment.</Text>
            </>
          ) : null}
        </View>

        {step === 'welcome' ? (
          <Card>
            <Text style={styles.cardTitle}>Start as the buyer</Text>
            <Text style={styles.cardText}>No account. Nothing leaves this phone.</Text>
            <View style={styles.stackGap}>
              <AppButton label="I’m buying a car" onPress={() => setStep('experience')} />
            </View>
            <TouchableOpacity onPress={onSelectDealership} activeOpacity={0.85} style={styles.quietLink}>
              <Text style={styles.quietLinkText}>I work at a dealership</Text>
            </TouchableOpacity>
          </Card>
        ) : null}

        {step === 'experience' ? (
          <Card>
            <View style={styles.stackGap}>
              <AppButton
                label="First time buying a car"
                onPress={() => {
                  setIsFirstTimeBuyer(true);
                  setStep('situation');
                }}
              />
              <AppButton
                label="I’ve bought a car before"
                variant="secondary"
                onPress={() => {
                  setIsFirstTimeBuyer(false);
                  setStep('situation');
                }}
              />
              <AppButton label="Back" variant="secondary" onPress={() => setStep('welcome')} />
            </View>
          </Card>
        ) : null}

        {step === 'situation' ? (
          <View style={styles.stackGap}>
            {BUYER_SITUATIONS.map((situation) => (
              <Card key={situation.id}>
                <Text style={styles.cardTitle}>{situation.title}</Text>
                <Text style={styles.cardText}>{situation.detail}</Text>
                <AppButton label="Continue" onPress={() => finish(situation.id)} />
              </Card>
            ))}
            <AppButton label="Back" variant="secondary" onPress={() => setStep('experience')} />
          </View>
        ) : null}

        <Text style={styles.footer}>No account required. No data leaves your phone.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SHIELD_THEME.bg,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 20,
  },
  hero: {
    gap: 10,
  },
  eyebrow: {
    color: SHIELD_THEME.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: SHIELD_THEME.text,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
  subtitle: {
    color: SHIELD_THEME.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  cardTitle: {
    color: SHIELD_THEME.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardText: {
    color: SHIELD_THEME.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  stackGap: {
    gap: 12,
  },
  quietLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  quietLinkText: {
    color: SHIELD_THEME.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    color: SHIELD_THEME.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});
