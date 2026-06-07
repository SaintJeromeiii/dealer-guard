import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import { SHIELD_SURFACE, SHIELD_THEME } from '@/constants/shield-theme';
import type { ExperienceMode } from '@/utils/types';

type GuidedBuyerSetupCardProps = {
  onboardingComplete: boolean;
  experienceMode: ExperienceMode;
  headline: string;
  detail: string;
  onFirstTimeBuyer: () => void;
  onExperiencedBuyer: () => void;
  onUpdateSetup: () => void;
  onDisableFirstTimeMode?: () => void;
};

export default function GuidedBuyerSetupCard({
  onboardingComplete,
  experienceMode,
  headline,
  detail,
  onFirstTimeBuyer,
  onExperiencedBuyer,
  onUpdateSetup,
  onDisableFirstTimeMode,
}: GuidedBuyerSetupCardProps) {
  const isFirstTime = experienceMode === 'firstTimeBuyer';

  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Guided buyer setup</Text>
        <StatusBadge label={onboardingComplete ? 'Ready' : 'Start here'} tone={onboardingComplete ? 'good' : 'warn'} />
      </View>

      {onboardingComplete ? (
        <>
          <Text style={styles.detail}>{headline}</Text>
          <Text style={styles.detail}>{detail}</Text>
          {isFirstTime ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>First-time guidance is on</Text>
              <Text style={styles.infoText}>
                Plain-language coaching is active across the roadmap, checklist, and deal review.
              </Text>
            </View>
          ) : null}
          <View style={styles.stackGap}>
            <AppButton label="Update setup" variant="secondary" onPress={onUpdateSetup} />
            {isFirstTime && onDisableFirstTimeMode ? (
              <AppButton label="Turn off first-time mode" variant="secondary" onPress={onDisableFirstTimeMode} />
            ) : null}
          </View>
        </>
      ) : (
        <>
          <Text style={styles.hero}>
            Tell DealShield whether this is your first car purchase so we can put the right checklist and roadmap in front of you.
          </Text>
          <View style={styles.stackGap}>
            <AppButton label="First-time buyer" onPress={onFirstTimeBuyer} />
            <AppButton label="I've bought before" variant="secondary" onPress={onExperiencedBuyer} />
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    color: SHIELD_THEME.text,
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  hero: {
    color: SHIELD_THEME.text,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  detail: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  stackGap: {
    gap: 10,
    marginTop: 4,
  },
  infoBox: {
    ...SHIELD_SURFACE.inset,
    padding: 12,
    gap: 4,
    marginTop: 10,
    marginBottom: 10,
  },
  infoTitle: {
    color: SHIELD_THEME.text,
    fontSize: 14,
    fontWeight: '800',
  },
  infoText: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
