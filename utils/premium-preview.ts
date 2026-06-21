import AsyncStorage from '@react-native-async-storage/async-storage';

import type { BillingState, PremiumTier } from './types.ts';

const PREMIUM_PREVIEW_STORAGE_KEY = 'premium_preview_mode_v1';

let premiumPreviewMode = false;

export function setPremiumPreviewMode(enabled: boolean) {
  premiumPreviewMode = enabled;
}

export function isPremiumPreviewModeEnabled() {
  return premiumPreviewMode;
}

export function hasPremiumFeatureAccess(tier: PremiumTier, mockBypassEnabled: boolean) {
  if (mockBypassEnabled) return true;
  if (tier === 'pro') return true;
  return premiumPreviewMode;
}

export async function loadPremiumPreviewMode() {
  const raw = await AsyncStorage.getItem(PREMIUM_PREVIEW_STORAGE_KEY);
  const enabled = raw === 'true';
  premiumPreviewMode = enabled;
  return enabled;
}

export async function savePremiumPreviewMode(enabled: boolean) {
  premiumPreviewMode = enabled;
  if (enabled) {
    await AsyncStorage.setItem(PREMIUM_PREVIEW_STORAGE_KEY, 'true');
    return;
  }

  await AsyncStorage.removeItem(PREMIUM_PREVIEW_STORAGE_KEY);
}

export function isBillingStoreUnavailable(billing: BillingState) {
  if (billing.entitlementStatus === 'active') return false;
  if (billing.provider === 'mock' && !billing.isConfigured) return true;

  const note = billing.customerInfoNote?.toLowerCase() ?? '';
  if (note.includes('sync failed')) return true;
  if (note.includes('lifetime product was not found')) return true;
  if (note.includes('missing in this build')) return true;

  return billing.provider === 'revenuecat' && billing.isConfigured && !billing.offeringsLoaded;
}

export const PREMIUM_PREVIEW_DISCLAIMER =
  'Premium Preview Mode unlocks Pro screens locally for review and testing. Purchases are unavailable until Google Play billing sync completes.';
