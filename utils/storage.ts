import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createInitialAppData,
  LEGACY_STORAGE_KEYS,
  sanitizeAppData,
  sanitizeDeal,
  sanitizeNegotiationFlags,
  sanitizeSavedDeals,
  STORAGE_KEY,
  STORAGE_VERSION,
} from './app-state';
import { CLOSED_BETA_CHECKLIST_KEY } from './closed-beta-checklist';
import { FIRST_RUN_PROFILE_KEY, ONBOARDING_ROLE_KEY } from './onboarding';
import { PREMIUM_PREVIEW_STORAGE_KEY } from './premium-preview';
import { LOT_COACH_USAGE_KEY } from './lot-coach';
import type { DealerGuardAppData } from './types';

type PersistedEnvelope = {
  version: number;
  data: DealerGuardAppData;
};

let persistGeneration = 0;

function parseEnvelope(raw: string | null): DealerGuardAppData | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PersistedEnvelope | DealerGuardAppData;
    if ('version' in (parsed as PersistedEnvelope) && 'data' in (parsed as PersistedEnvelope)) {
      return sanitizeAppData((parsed as PersistedEnvelope).data);
    }
    return sanitizeAppData(parsed);
  } catch {
    return null;
  }
}

async function loadLegacyData() {
  const [savedAnswers, savedCheckedItems, savedNotes, savedDeal, savedDealsRaw, savedNegotiationFlags] = await Promise.all([
    AsyncStorage.getItem(LEGACY_STORAGE_KEYS.answers),
    AsyncStorage.getItem(LEGACY_STORAGE_KEYS.checkedItems),
    AsyncStorage.getItem(LEGACY_STORAGE_KEYS.notes),
    AsyncStorage.getItem(LEGACY_STORAGE_KEYS.deal),
    AsyncStorage.getItem(LEGACY_STORAGE_KEYS.savedDeals),
    AsyncStorage.getItem(LEGACY_STORAGE_KEYS.negotiationFlags),
  ]);

  const base = createInitialAppData();

  try {
    return sanitizeAppData({
      ...base,
      answers: savedAnswers ? JSON.parse(savedAnswers) : base.answers,
      checkedItems: savedCheckedItems ? JSON.parse(savedCheckedItems) : base.checkedItems,
      notes: savedNotes ? JSON.parse(savedNotes) : base.notes,
      deal: savedDeal ? sanitizeDeal(JSON.parse(savedDeal)) : base.deal,
      savedDeals: savedDealsRaw ? sanitizeSavedDeals(JSON.parse(savedDealsRaw)) : base.savedDeals,
      negotiationFlags: savedNegotiationFlags ? sanitizeNegotiationFlags(JSON.parse(savedNegotiationFlags)) : base.negotiationFlags,
    });
  } catch {
    return base;
  }
}

export async function loadAppData() {
  const snapshot = parseEnvelope(await AsyncStorage.getItem(STORAGE_KEY));
  if (snapshot) return snapshot;
  return loadLegacyData();
}

export async function saveAppData(data: DealerGuardAppData) {
  const generation = persistGeneration;
  const payload: PersistedEnvelope = {
    version: STORAGE_VERSION,
    data: sanitizeAppData(data),
  };

  if (generation !== persistGeneration) return;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  if (generation !== persistGeneration) {
    await resetStoredAppData();
  }
}

export async function resetStoredAppData() {
  persistGeneration += 1;
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEY),
    AsyncStorage.removeItem(LEGACY_STORAGE_KEYS.answers),
    AsyncStorage.removeItem(LEGACY_STORAGE_KEYS.checkedItems),
    AsyncStorage.removeItem(LEGACY_STORAGE_KEYS.notes),
    AsyncStorage.removeItem(LEGACY_STORAGE_KEYS.deal),
    AsyncStorage.removeItem(LEGACY_STORAGE_KEYS.savedDeals),
    AsyncStorage.removeItem(LEGACY_STORAGE_KEYS.negotiationFlags),
    AsyncStorage.removeItem(ONBOARDING_ROLE_KEY),
    AsyncStorage.removeItem(FIRST_RUN_PROFILE_KEY),
    AsyncStorage.removeItem(PREMIUM_PREVIEW_STORAGE_KEY),
    AsyncStorage.removeItem(CLOSED_BETA_CHECKLIST_KEY),
    AsyncStorage.removeItem(LOT_COACH_USAGE_KEY),
  ]);
}
