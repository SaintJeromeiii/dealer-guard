import type { AnalyticsEvent, BillingState, DealLineItem, DealState, DealerGuardAppData, NegotiationFlag, PressureIncident, PromiseRecord, SavedDeal, SubscriptionState, VisitTimelineEntry, WatchedVehicle } from './types.ts';
import { MAX_WATCHED_VEHICLES } from './watchlist.ts';

export const STORAGE_VERSION = 11;
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
    marketComparablePricesText: '',
    outsideLenderApr: '',
    outsideLenderTerm: '',
    targetTotalPaid: '',
    tradeReferenceValue: '',
    tradePayoff: '',
    contractImportedPhotoUri: '',
    contractScannedText: '',
    contractImportReviewNotes: [],
    contractVehiclePrice: '',
    contractFees: '',
    contractAddOns: '',
    contractDownPayment: '',
    contractTradeIn: '',
    contractApr: '',
    contractMonths: '',
    salesTax: '',
    dealerFees: '',
    feeNames: '',
    feeItems: [],
    addOns: '',
    addOnItems: [],
    downPayment: '',
    tradeIn: '',
    apr: '',
    months: '',
  };
}

export function createInitialAppData(): DealerGuardAppData {
  return {
    answers: {},
    checkedItems: {},
    notes: '',
    negotiationFlags: [],
    pressureIncidents: [],
    lotCheckClear: false,
    promises: [],
    visitTimeline: [],
    savedDeals: [],
    watchedVehicles: [],
    deal: createInitialDeal(),
    subscription: createInitialSubscription(),
    billing: createInitialBillingState(),
    preferences: {
      experienceMode: 'standard',
      onboardingComplete: false,
      walkthroughComplete: false,
      buyerSituation: 'undecided',
      buyerStage: 'undecided',
      financingNeed: 'undecided',
      creditBand: 'unknown',
      hasTrade: false,
    },
    analyticsEvents: [],
  };
}

function createInitialSubscription(): SubscriptionState {
  return {
    tier: 'free',
    upgradedAt: null,
    usage: {
      ocrImports: 0,
      reportsShared: 0,
      dealsSaved: 0,
      tacticsLogged: 0,
      referralShares: 0,
      whatIfRuns: 0,
      checkpointPasses: 0,
    },
  };
}

function createInitialBillingState(): BillingState {
  return {
    provider: 'mock',
    isConfigured: false,
    offeringsLoaded: false,
    packageLabel: 'Sign Check Pro',
    entitlementStatus: 'inactive',
    offeringId: null,
    packageId: null,
    customerInfoNote: null,
    lastSyncAt: null,
  };
}

function sanitizeAnalyticsEvents(value: unknown): AnalyticsEvent[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      return {
        id: safeString((item as AnalyticsEvent).id),
        type: safeString((item as AnalyticsEvent).type),
        label: safeString((item as AnalyticsEvent).label),
        createdAt: safeString((item as AnalyticsEvent).createdAt),
        detail: safeString((item as AnalyticsEvent).detail),
      };
    })
    .filter((item): item is AnalyticsEvent => !!item && !!item.id && !!item.type && !!item.label && !!item.createdAt)
    .slice(0, 120);
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

function sanitizeVisitTimeline(value: unknown): VisitTimelineEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      return {
        id: safeString((item as VisitTimelineEntry).id),
        dealershipName: safeString((item as VisitTimelineEntry).dealershipName),
        type: safeString((item as VisitTimelineEntry).type) as VisitTimelineEntry['type'],
        title: safeString((item as VisitTimelineEntry).title),
        detail: safeString((item as VisitTimelineEntry).detail),
        createdAt: safeString((item as VisitTimelineEntry).createdAt),
      };
    })
    .filter((item): item is VisitTimelineEntry => !!item && !!item.id && !!item.type && !!item.title && !!item.createdAt)
    .slice(0, 120);
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
    marketComparablePricesText: safeString((raw as DealState).marketComparablePricesText),
    outsideLenderApr: safeString((raw as DealState).outsideLenderApr),
    outsideLenderTerm: safeString((raw as DealState).outsideLenderTerm),
    targetTotalPaid: safeString((raw as DealState).targetTotalPaid),
    tradeReferenceValue: safeString((raw as DealState).tradeReferenceValue),
    tradePayoff: safeString((raw as DealState).tradePayoff),
    contractImportedPhotoUri: safeString((raw as DealState).contractImportedPhotoUri),
    contractScannedText: safeString((raw as DealState).contractScannedText),
    contractImportReviewNotes: Array.isArray((raw as DealState).contractImportReviewNotes)
      ? (raw as DealState).contractImportReviewNotes.filter((item): item is string => typeof item === 'string').slice(0, 20)
      : [],
    contractVehiclePrice: safeString((raw as DealState).contractVehiclePrice),
    contractFees: safeString((raw as DealState).contractFees),
    contractAddOns: safeString((raw as DealState).contractAddOns),
    contractDownPayment: safeString((raw as DealState).contractDownPayment),
    contractTradeIn: safeString((raw as DealState).contractTradeIn),
    contractApr: safeString((raw as DealState).contractApr),
    contractMonths: safeString((raw as DealState).contractMonths),
    salesTax: safeString((raw as DealState).salesTax),
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

export function sanitizeWatchedVehicles(value: unknown): WatchedVehicle[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const vehicle = item as WatchedVehicle & { location?: string };
      const legacyLocation = safeString(vehicle.location);
      let cityOrCounty = safeString(vehicle.cityOrCounty);
      let stateCode = safeString(vehicle.stateCode).toUpperCase();
      const milesAway = safeString(vehicle.milesAway);

      if (!cityOrCounty && legacyLocation) {
        const match = legacyLocation.match(/^(.+?),\s*([A-Za-z]{2})\b/);
        if (match) {
          cityOrCounty = match[1].trim();
          stateCode = stateCode || match[2].toUpperCase();
        } else {
          cityOrCounty = legacyLocation;
        }
      }
      if (stateCode && !/^[A-Z]{2}$/.test(stateCode)) stateCode = '';

      return {
        id: safeString(vehicle.id),
        savedAt: safeString(vehicle.savedAt),
        photoUri: safeString(vehicle.photoUri),
        rawOcrText: safeString(vehicle.rawOcrText),
        year: safeString(vehicle.year),
        make: safeString(vehicle.make),
        model: safeString(vehicle.model),
        trim: safeString(vehicle.trim),
        title: safeString(vehicle.title),
        askingPrice: safeString(vehicle.askingPrice),
        cityOrCounty,
        stateCode,
        milesAway,
        mileage: safeString(vehicle.mileage),
        dealerOrSeller: safeString(vehicle.dealerOrSeller),
        listingUrl: safeString(vehicle.listingUrl),
        notes: safeString(vehicle.notes),
      };
    })
    .filter((item): item is WatchedVehicle => !!item && !!item.id && !!item.savedAt)
    .slice(0, MAX_WATCHED_VEHICLES);
}

export function sanitizeNegotiationFlags(value: unknown): NegotiationFlag[] {
  if (!Array.isArray(value)) return [];
  return value.filter((flag): flag is NegotiationFlag => typeof flag === 'string' && VALID_FLAGS.includes(flag as NegotiationFlag));
}

export function sanitizeAppData(value: unknown): DealerGuardAppData {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const subscriptionRaw = (raw as DealerGuardAppData).subscription;
  const usageRaw = subscriptionRaw && typeof subscriptionRaw === 'object' && !Array.isArray(subscriptionRaw) ? subscriptionRaw.usage : null;
  const billingRaw = (raw as DealerGuardAppData).billing;

  return {
    answers: safeRecord((raw as DealerGuardAppData).answers),
    checkedItems: safeBooleanRecord((raw as DealerGuardAppData).checkedItems),
    notes: safeString((raw as DealerGuardAppData).notes),
    negotiationFlags: sanitizeNegotiationFlags((raw as DealerGuardAppData).negotiationFlags),
    pressureIncidents: sanitizePressureIncidents((raw as DealerGuardAppData).pressureIncidents),
    lotCheckClear: !!(raw as DealerGuardAppData).lotCheckClear,
    promises: sanitizePromises((raw as DealerGuardAppData).promises),
    visitTimeline: sanitizeVisitTimeline((raw as DealerGuardAppData).visitTimeline),
    savedDeals: sanitizeSavedDeals((raw as DealerGuardAppData).savedDeals),
    watchedVehicles: sanitizeWatchedVehicles((raw as DealerGuardAppData).watchedVehicles),
    deal: sanitizeDeal((raw as DealerGuardAppData).deal),
    subscription: {
      tier: subscriptionRaw?.tier === 'pro' ? 'pro' : 'free',
      upgradedAt: safeString(subscriptionRaw?.upgradedAt) || null,
      usage: {
        ocrImports: Math.max(0, Number(usageRaw && typeof usageRaw === 'object' ? (usageRaw as SubscriptionState['usage']).ocrImports || 0 : 0)),
        reportsShared: Math.max(0, Number(usageRaw && typeof usageRaw === 'object' ? (usageRaw as SubscriptionState['usage']).reportsShared || 0 : 0)),
        dealsSaved: Math.max(0, Number(usageRaw && typeof usageRaw === 'object' ? (usageRaw as SubscriptionState['usage']).dealsSaved || 0 : 0)),
        tacticsLogged: Math.max(0, Number(usageRaw && typeof usageRaw === 'object' ? (usageRaw as SubscriptionState['usage']).tacticsLogged || 0 : 0)),
        referralShares: Math.max(0, Number(usageRaw && typeof usageRaw === 'object' ? (usageRaw as SubscriptionState['usage']).referralShares || 0 : 0)),
        whatIfRuns: Math.max(0, Number(usageRaw && typeof usageRaw === 'object' ? (usageRaw as SubscriptionState['usage']).whatIfRuns || 0 : 0)),
        checkpointPasses: Math.max(0, Number(usageRaw && typeof usageRaw === 'object' ? (usageRaw as SubscriptionState['usage']).checkpointPasses || 0 : 0)),
      },
    },
    billing: {
      provider: billingRaw?.provider === 'revenuecat' ? 'revenuecat' : 'mock',
      isConfigured: !!billingRaw?.isConfigured,
      offeringsLoaded: !!billingRaw?.offeringsLoaded,
      packageLabel: safeString(billingRaw?.packageLabel, 'Sign Check Pro'),
      entitlementStatus: billingRaw?.entitlementStatus === 'active' ? 'active' : billingRaw?.entitlementStatus === 'trial' ? 'trial' : 'inactive',
      offeringId: safeString(billingRaw?.offeringId) || null,
      packageId: safeString(billingRaw?.packageId) || null,
      customerInfoNote: safeString(billingRaw?.customerInfoNote) || null,
      lastSyncAt: safeString(billingRaw?.lastSyncAt) || null,
    },
    preferences: {
      experienceMode: (raw as DealerGuardAppData).preferences?.experienceMode === 'firstTimeBuyer' ? 'firstTimeBuyer' : 'standard',
      onboardingComplete: !!(raw as DealerGuardAppData).preferences?.onboardingComplete,
      walkthroughComplete:
        !!(raw as DealerGuardAppData).preferences?.walkthroughComplete ||
        !!(raw as DealerGuardAppData).preferences?.onboardingComplete,
      buyerSituation:
        (raw as DealerGuardAppData).preferences?.buyerSituation === 'home' ||
        (raw as DealerGuardAppData).preferences?.buyerSituation === 'lot' ||
        (raw as DealerGuardAppData).preferences?.buyerSituation === 'signing'
          ? (raw as DealerGuardAppData).preferences.buyerSituation
          : 'undecided',
      buyerStage:
        (raw as DealerGuardAppData).preferences?.buyerStage === 'firstCar' ||
        (raw as DealerGuardAppData).preferences?.buyerStage === 'replacingCar' ||
        (raw as DealerGuardAppData).preferences?.buyerStage === 'tradeShopper'
          ? (raw as DealerGuardAppData).preferences.buyerStage
          : 'undecided',
      financingNeed:
        (raw as DealerGuardAppData).preferences?.financingNeed === 'finance' ||
        (raw as DealerGuardAppData).preferences?.financingNeed === 'cash'
          ? (raw as DealerGuardAppData).preferences.financingNeed
          : 'undecided',
      creditBand:
        (raw as DealerGuardAppData).preferences?.creditBand === 'building' ||
        (raw as DealerGuardAppData).preferences?.creditBand === 'fair' ||
        (raw as DealerGuardAppData).preferences?.creditBand === 'good' ||
        (raw as DealerGuardAppData).preferences?.creditBand === 'excellent'
          ? (raw as DealerGuardAppData).preferences.creditBand
          : 'unknown',
      hasTrade: !!(raw as DealerGuardAppData).preferences?.hasTrade,
    },
    analyticsEvents: sanitizeAnalyticsEvents((raw as DealerGuardAppData).analyticsEvents),
  };
}
