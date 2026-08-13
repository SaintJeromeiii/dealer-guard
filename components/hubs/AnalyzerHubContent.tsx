import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AnalyzerProSection from '@/components/AnalyzerProSection';
import CapVsQuoteCard from '@/components/CapVsQuoteCard';
import FeatureMenuCard from '@/components/FeatureMenuCard';
import QuickPaymentEstimator from '@/components/QuickPaymentEstimator';
import { SHIELD_THEME } from '@/constants/shield-theme';
import type { CapVsQuoteRow } from '@/utils/desk-scripts';

type AnalyzerHubContentProps = {
  isPro: boolean;
  budgetComplete: boolean;
  savedOfferCount: number;
  onUseEstimatorInDealReview: (loanPrice: string, apr: string, months: number) => void;
  onOpenDealReview: () => void;
  onOpenCompare: () => void;
  onOpenWhatIfLab: () => void;
  onOpenFinanceDefense: () => void;
  onPaywall: () => void;
  onBudgetGate: () => void;
  capRows?: CapVsQuoteRow[];
};

function formatOfferCount(count: number) {
  if (count <= 0) return undefined;
  return `${count} offer${count === 1 ? '' : 's'}`;
}

export default function AnalyzerHubContent({
  isPro,
  budgetComplete,
  savedOfferCount,
  onUseEstimatorInDealReview,
  onOpenDealReview,
  onOpenCompare,
  onOpenWhatIfLab,
  onOpenFinanceDefense,
  onPaywall,
  onBudgetGate,
  capRows = [],
}: AnalyzerHubContentProps) {
  return (
    <View style={styles.stackGap}>
      {capRows.length > 0 ? <CapVsQuoteCard rows={capRows} /> : null}
      <QuickPaymentEstimator
        onUseInDealReview={budgetComplete ? onUseEstimatorInDealReview : undefined}
      />

      <View style={styles.analyzerSection}>
        <Text style={styles.analyzerSectionTitle}>Standard (Free)</Text>
        <View style={styles.stackGap}>
          <FeatureMenuCard
            title="Deal review"
            description={
              budgetComplete
                ? 'Analyze vehicle price, fees, APR, add-ons, and total out-the-door exposure.'
                : 'Complete Step 1: Budget on Shield before reviewing dealership quotes.'
            }
            requiresBudget
            budgetComplete={budgetComplete}
            isPremium={isPro}
            onPress={onOpenDealReview}
            onPaywall={onPaywall}
            onBudgetGate={onBudgetGate}
          />
          <FeatureMenuCard
            title="Compare dealership offers"
            countLabel={formatOfferCount(savedOfferCount)}
            description="Save multiple offers and compare risk, monthly payment, and total cost side by side."
            isPremium={isPro}
            onPress={onOpenCompare}
            onPaywall={onPaywall}
          />
        </View>
      </View>

      <AnalyzerProSection isPremium={isPro} onPaywall={onPaywall}>
        <FeatureMenuCard
          title="What-if lab"
          description="Model cleaner APR, term, fee, and down-payment structures before you counter."
          requiresPro
          isPremium={isPro}
          onPress={onOpenWhatIfLab}
          onPaywall={onPaywall}
        />
        <FeatureMenuCard
          title="Finance office defense"
          description="Prepare for warranty, GAP, and add-on pressure after the sales desk."
          requiresPro
          isPremium={isPro}
          onPress={onOpenFinanceDefense}
          onPaywall={onPaywall}
        />
      </AnalyzerProSection>

      <View style={styles.stackGap}>
        <FeatureMenuCard
          title="Shareable buyer report"
          description="Package the verdict, negotiation plan, and key risk checks into one summary you can text or export."
          requiresPro
          requiresBudget
          budgetComplete={budgetComplete}
          isPremium={isPro}
          onPress={onOpenDealReview}
          onPaywall={onPaywall}
          onBudgetGate={onBudgetGate}
        />
        <FeatureMenuCard
          title="Dealer scorecards"
          description="See how each dealership stacks up across offer quality, pressure tactics, and kept or broken promises."
          requiresPro
          isPremium={isPro}
          onPress={onOpenCompare}
          onPaywall={onPaywall}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stackGap: {
    gap: 12,
  },
  analyzerSection: {
    gap: 12,
  },
  analyzerSectionTitle: {
    color: SHIELD_THEME.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
});
