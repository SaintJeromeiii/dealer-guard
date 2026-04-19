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
import type { DealerGuardAppData } from './types';

type PersistedEnvelope = {
  version: number;
  data: DealerGuardAppData;
};

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
  const payload: PersistedEnvelope = {
    version: STORAGE_VERSION,
    data: sanitizeAppData(data),
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export async function resetStoredAppData() {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEY),
    AsyncStorage.removeItem(LEGACY_STORAGE_KEYS.answers),
    AsyncStorage.removeItem(LEGACY_STORAGE_KEYS.checkedItems),
    AsyncStorage.removeItem(LEGACY_STORAGE_KEYS.notes),
    AsyncStorage.removeItem(LEGACY_STORAGE_KEYS.deal),
    AsyncStorage.removeItem(LEGACY_STORAGE_KEYS.savedDeals),
    AsyncStorage.removeItem(LEGACY_STORAGE_KEYS.negotiationFlags),
  ]);
}
