import type { DealLineItem, DealState, DealerGuardAppData, NegotiationFlag, PressureIncident, PromiseRecord, SavedDeal } from './types.ts';

export const STORAGE_VERSION = 5;
export const STORAGE_KEY = 'dealerGuard_state';

export const LEGACY_STORAGE_KEYS = {
  answers: 'dealerGuard_answers',
  checkedItems: 'dealerGuard_checkedItems',
  notes: 'dealerGuard_notes',
  deal: 'dealerGuard_deal',
  savedDeals: 'dealerGuard_savedDeals',
  negotiationFlags: 'dealerGuard_negotiationFlags',
} as const;

const VALID_FLAGS: NegotiationFlag[] = ['paymentShift', 'todayOnly', 'managerTrip', 'bundleAddOn', 'wontPrint', 'tradeMix'];

function safeRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}

function safeBooleanRecord(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean'));
}

function safeString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function sanitizeLineItems(value: unknown): DealLineItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      return {
        id: safeString((item as DealLineItem).id),
        label: safeString((item as DealLineItem).label),
        amount: safeString((item as DealLineItem).amount),
      };
    })
    .filter((item): item is DealLineItem => !!item && !!item.id)
    .slice(0, 12);
}

export function createInitialDeal(): DealState {
  return {
    buyerStateCode: '',
    dealershipName: '',
    offerNotes: '',
    importedQuoteText: '',
    importedPhotoUri: '',
    importReviewNotes: [],
    vehiclePrice: '',
    marketVehiclePrice: '',
    targetTotalPaid: '',
    tradeReferenceValue: '',
    tradePayoff: '',
    contractVehiclePrice: '',
    contractFees: '',
    contractAddOns: '',
    contractDownPayment: '',
    contractTradeIn: '',
    contractApr: '',
    contractMonths: '',
    dealerFees: '',
    feeNames: '',
    feeItems: [],
    addOns: '',
    addOnItems: [],
    downPayment: '',
    tradeIn: '',
    apr: '',
    months: '60',
  };
}

export function createInitialAppData(): DealerGuardAppData {
  return {
    answers: {},
    checkedItems: {},
    notes: '',
    negotiationFlags: [],
    pressureIncidents: [],
    promises: [],
    savedDeals: [],
    deal: createInitialDeal(),
  };
}

function sanitizePressureIncidents(value: unknown): PressureIncident[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const flag = safeString((item as PressureIncident).flag) as NegotiationFlag;
      if (!VALID_FLAGS.includes(flag)) return null;
      return {
        id: safeString((item as PressureIncident).id),
        flag,
        dealershipName: safeString((item as PressureIncident).dealershipName),
        notedAt: safeString((item as PressureIncident).notedAt),
      };
    })
    .filter((item): item is PressureIncident => !!item && !!item.id && !!item.notedAt)
    .slice(0, 50);
}

function sanitizePromises(value: unknown): PromiseRecord[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const status = safeString((item as PromiseRecord).status) as PromiseRecord['status'];
      if (!['open', 'kept', 'broken'].includes(status)) return null;
      return {
        id: safeString((item as PromiseRecord).id),
        dealershipName: safeString((item as PromiseRecord).dealershipName),
        text: safeString((item as PromiseRecord).text),
        status,
        notedAt: safeString((item as PromiseRecord).notedAt),
        resolvedAt: safeString((item as PromiseRecord).resolvedAt) || null,
      };
    })
    .filter((item): item is PromiseRecord => !!item && !!item.id && !!item.text && !!item.notedAt)
    .slice(0, 100);
}

export function sanitizeDeal(value: unknown): DealState {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    buyerStateCode: safeString((raw as DealState).buyerStateCode),
    dealershipName: safeString((raw as DealState).dealershipName),
    offerNotes: safeString((raw as DealState).offerNotes),
    importedQuoteText: safeString((raw as DealState).importedQuoteText),
    importedPhotoUri: safeString((raw as DealState).importedPhotoUri),
    importReviewNotes: Array.isArray((raw as DealState).importReviewNotes)
      ? (raw as DealState).importReviewNotes.filter((item): item is string => typeof item === 'string').slice(0, 20)
      : [],
    vehiclePrice: safeString((raw as DealState).vehiclePrice),
    marketVehiclePrice: safeString((raw as DealState).marketVehiclePrice),
    targetTotalPaid: safeString((raw as DealState).targetTotalPaid),
    tradeReferenceValue: safeString((raw as DealState).tradeReferenceValue),
    tradePayoff: safeString((raw as DealState).tradePayoff),
    contractVehiclePrice: safeString((raw as DealState).contractVehiclePrice),
    contractFees: safeString((raw as DealState).contractFees),
    contractAddOns: safeString((raw as DealState).contractAddOns),
    contractDownPayment: safeString((raw as DealState).contractDownPayment),
    contractTradeIn: safeString((raw as DealState).contractTradeIn),
    contractApr: safeString((raw as DealState).contractApr),
    contractMonths: safeString((raw as DealState).contractMonths),
    dealerFees: safeString((raw as DealState).dealerFees),
    feeNames: safeString((raw as DealState).feeNames),
    feeItems: sanitizeLineItems((raw as DealState).feeItems),
    addOns: safeString((raw as DealState).addOns),
    addOnItems: sanitizeLineItems((raw as DealState).addOnItems),
    downPayment: safeString((raw as DealState).downPayment),
    tradeIn: safeString((raw as DealState).tradeIn),
    apr: safeString((raw as DealState).apr),
    months: safeString((raw as DealState).months, '60'),
  };
}

export function sanitizeSavedDeals(value: unknown): SavedDeal[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const deal = sanitizeDeal(item);
      return {
        ...deal,
        id: safeString((item as SavedDeal).id),
        savedAt: safeString((item as SavedDeal).savedAt),
        seriesId: safeString((item as SavedDeal).seriesId, safeString((item as SavedDeal).id)),
        revisionNumber: Math.max(1, Number((item as SavedDeal).revisionNumber || 1)),
        basedOnDealId: safeString((item as SavedDeal).basedOnDealId) || null,
      };
    })
    .filter((item): item is SavedDeal => !!item && !!item.id && !!item.savedAt)
    .slice(0, 10);
}

export function sanitizeNegotiationFlags(value: unknown): NegotiationFlag[] {
  if (!Array.isArray(value)) return [];
  return value.filter((flag): flag is NegotiationFlag => typeof flag === 'string' && VALID_FLAGS.includes(flag as NegotiationFlag));
}

export function sanitizeAppData(value: unknown): DealerGuardAppData {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    answers: safeRecord((raw as DealerGuardAppData).answers),
    checkedItems: safeBooleanRecord((raw as DealerGuardAppData).checkedItems),
    notes: safeString((raw as DealerGuardAppData).notes),
    negotiationFlags: sanitizeNegotiationFlags((raw as DealerGuardAppData).negotiationFlags),
    pressureIncidents: sanitizePressureIncidents((raw as DealerGuardAppData).pressureIncidents),
    promises: sanitizePromises((raw as DealerGuardAppData).promises),
    savedDeals: sanitizeSavedDeals((raw as DealerGuardAppData).savedDeals),
    deal: sanitizeDeal((raw as DealerGuardAppData).deal),
  };
}
