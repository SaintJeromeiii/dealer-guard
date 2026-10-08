import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getBottomTabBarHeight, getBottomTabPadding, getHeaderTopPadding } from '@/utils/safe-area';
import { useDealShieldBridge, type BottomTab } from '@/contexts/deal-shield-bridge';

import AppButton from '@/components/AppButton';
import CapVsQuoteCard from '@/components/CapVsQuoteCard';
import ClosedBetaWelcomeCard from '@/components/ClosedBetaWelcomeCard';
import FirstRunWalkthrough from '@/components/FirstRunWalkthrough';
import DealReviewStepper from '@/components/DealReviewStepper';
import DeskHud from '@/components/DeskHud';
import Header from '@/components/Header';
import AnalyticsFunnelCard from '@/components/AnalyticsFunnelCard';
import EmptyStateGuide from '@/components/EmptyStateGuide';
import FreeVsProComparison from '@/components/FreeVsProComparison';
import AnalyzerHubContent from '@/components/hubs/AnalyzerHubContent';
import ScanHubContent from '@/components/hubs/ScanHubContent';
import LotCoachCard from '@/components/LotCoachCard';
import { LOT_COACH_COMPARE_PROMPTS } from '@/utils/lot-coach';
import MathDisclaimer from '@/components/MathDisclaimer';
import OcrConfirmChips from '@/components/OcrConfirmChips';
import PaperworkSignatureGate from '@/components/PaperworkSignatureGate';
import TradeEquityAuditCard from '@/components/TradeEquityAuditCard';
import WatchlistScreenContent from '@/components/WatchlistScreenContent';
import Card from '@/components/Card';
import FeatureMenuCard from '@/components/FeatureMenuCard';
import ProgressBar from '@/components/ProgressBar';
import ProFeatureBadge from '@/components/ProFeatureBadge';
import StatusBadge from '@/components/StatusBadge';
import { getLegalDisclaimerUrl, getPrivacyPolicyUrl, openExternalLink } from '@/constants/legal-links';
import { getClosedBetaFeedbackUrl } from '@/constants/feedback-links';
import { SHIELD_SURFACE, SHIELD_THEME } from '@/constants/shield-theme';
import { checklistSections } from '@/data/checklist';
import {
  financeOfficeChecklist,
  financeOfficeItems,
  negotiationFlagItems,
  salesTacticItems,
  stateOptions,
} from '@/data/deal-content';
import { questions } from '@/data/questions';
import { quickScripts } from '@/data/scripts';
import { trapCards } from '@/data/traps';
import { createInitialAppData, createInitialDeal, sanitizeAppData } from '@/utils/app-state';
import { buildLotCoachContext, buildCompareLotCoachContext } from '@/utils/lot-coach-context';
import { estimateStateSalesTax, STATE_SALES_TAX_DISCLAIMER } from '@/utils/state-sales-tax';
import {
  buildComparisonInsights,
  buildComparisonSummary,
  buildCounterOfferMoves,
  buildBuyerReport,
  buildCurrentDealSummary,
  buildDealAnalysis,
  buildDealConfidence,
  buildDealInputGuidance,
  buildDealerScorecards,
  buildDealerReputationReports,
  buildDealActionRecommendation,
  buildHonestyScore,
  buildLiveCoachingPlan,
  buildLiveResponsePack,
  buildMarketBenchmarkAssessment,
  buildMarketCompSnapshot,
  buildMonetizationSummary,
  buildNegotiationPlan,
  buildNegotiationPlanSummary,
  buildNegotiationSimulator,
  buildOcrRecoverySuggestion,
  buildOnboardingSummary,
  buildOfferTimeline,
  buildPaperworkAudit,
  buildPaperworkAuditSummary,
  buildPersonalizedInsight,
  buildPressureSummary,
  buildPromiseSummary,
  buildQuickStartGuide,
  buildReferralLoop,
  buildSavingsProof,
  buildSavingsOpportunity,
  buildGuidedSessionFlow,
  buildSigningReadiness,
  buildSecondOpinionShare,
  buildSessionPlaybook,
  buildTradeInAssessment,
  buildVisitCaseSummary,
  buildWhyOfferWinsExplanation,
  buildSuggestedWhatIfDeal,
  buildWhatIfComparison,
  compareSavedDeals,
  currency,
  getAddOnTotal,
  getFeeTotal,
  getNextRevisionNumber,
  getReadinessLabel,
  getStateName,
  importQuoteText,
  scoreAnswers,
} from '@/utils/deals';
import { buildDealShieldAuditDashboard } from '@/utils/audit-dashboard';
import {
  getBillingDiagnostics,
  initializeBilling,
  isBillingStoreUnavailable,
  isPaywallBypassed,
  isPremiumPreviewAllowed,
  isPremiumPreviewModeEnabled,
  loadPremiumPreviewMode,
  PREMIUM_PREVIEW_DISCLAIMER,
  purchaseProEntitlement,
  resolvePremiumTier,
  resolveSyncedPremiumTier,
  restoreProEntitlement,
  savePremiumPreviewMode,
  setPremiumPreviewMode,
  subscribeToBillingUpdates,
  type BillingDiagnostics,
} from '@/utils/billing';
import {
  applyReadinessAnswersToDeal,
  derivePreferencesFromAnswers,
  getReadinessNextAction,
} from '@/utils/buyer-setup';
import { buildAnalyticsFunnel, getFunnelCompletionRate } from '@/utils/analytics-funnel';
import { buildNextStepGuidance } from '@/utils/next-step';
import { buildCapVsQuote } from '@/utils/desk-scripts';
import {
  getHomeForSituation,
  getNextDealReviewStep,
  getPreviousDealReviewStep,
  HUB_SCREENS,
  appDataAfterWalkthrough,
  shouldShowAdvancedTools,
  shouldShowFirstRunWalkthrough,
  type DealReviewWizardStep,
} from '@/utils/first-run';
import { getFirstRunProfile, clearFirstRunProfile, clearUserRole } from '@/utils/onboarding';
import { coerceMainTab, popNavFrame, pushNavFrame, asVoidCallback, isScreen, resolveHardwareBack, type ScreenNavFrame } from '@/utils/screen-nav';
import { isDuplicatePromise, isDuplicateVisitNote } from '@/utils/visit-log';
import { getLifetimeUpgradeCtaLabel, LIFETIME_PRO_PURCHASE_NOTE, SAMPLE_QUOTE } from '@/utils/product-content';
import {
  MAX_WATCHED_VEHICLES,
  createBlankListingImport,
  createWatchedVehicleFromImport,
  importListingText,
  type ListingImportResult,
} from '@/utils/watchlist';
import {
  dismissClosedBetaWelcome,
  markClosedBetaStep,
  readClosedBetaChecklist,
  shouldShowClosedBetaWelcome,
  type ClosedBetaChecklist,
  type ClosedBetaChecklistStep,
} from '@/utils/closed-beta-checklist';
import {
  buildSampleDealState,
  SAMPLE_DEAL_PRESSURE_FLAGS,
} from '@/utils/sample-deal';
import { addLotNegotiationFlag, buildCarBuyingRoadmap, isRoadmapBudgetComplete, markLotCheckClear, removeLotNegotiationFlag, type RoadmapStepId } from '@/utils/roadmap';
import { loadAppData, resetStoredAppData, saveAppData } from '@/utils/storage';
import type {
  AnalyticsEvent,
  BillingState,
  DealLineItem,
  DealState,
  ExperienceMode,
  MainTab,
  NegotiationFlag,
  PremiumTier,
  PromiseRecord,
  QuoteImportResult,
  SavedDeal,
  Screen,
  SelectedComparePair,
  Tone,
  VisitTimelineEntry,
  VisitTimelineEventType,
  WatchedVehicle,
} from '@/utils/types';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createLineItem(): DealLineItem {
  return {
    id: makeId(),
    label: '',
    amount: '',
  };
}

const TAB_HUBS: Record<MainTab, Screen> = {
  scan: 'scanHub',
  analyzer: 'analyzerHub',
  tactics: 'tacticsHub',
  settings: 'settingsHub',
};

const BOTTOM_TABS: { key: BottomTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'calculator', label: 'Deal Calculator', icon: 'calculator-outline' },
  { key: 'lotCoach', label: 'AI Lot Coach', icon: 'chatbubble-ellipses-outline' },
];

const CALCULATOR_SCREENS = new Set<Screen>([
  'analyzerHub',
  'dealReview',
  'compareDeals',
  'watchlist',
  'whatIfLab',
  'financeDefense',
]);

const SCREEN_TITLES: Partial<Record<Screen, string>> = {
  scanHub: 'The Golden Check',
  analyzerHub: 'Deal Calculator',
  tacticsHub: 'Tactician Guide',
  settingsHub: 'Settings',
  liveMode: 'AI Lot Coach',
  dealReview: 'Deal review',
  compareDeals: 'Compare Offers',
  watchlist: "Vehicles I'm Watching",
  whatIfLab: 'What-if Lab',
  financeDefense: 'Finance Office Defense',
  traps: 'Trap Library',
  checklist: 'Buyer Checklist',
  tacticDecoder: 'Tactic Decoder',
  notes: 'Incident Logs',
  upgradeHub: 'Features Matrix',
  questions: 'Buyer Readiness',
  result: 'Readiness Results',
  firstRunWalkthrough: 'Why this number',
};

const SCREEN_SUBTITLES: Partial<Record<Screen, string>> = {
  scanHub: 'Start with guided buyer setup, then follow the car buying roadmap from budget to contract scan.',
  analyzerHub: 'Walk-away numbers versus their quote, then jump into review, compare, and watchlist.',
  liveMode: 'Live scripts and pressure logging while you are on the lot.',
  dealReview: 'Break down the worksheet, fees, add-ons, and contract language.',
  compareDeals: 'Put two saved offers side by side before you pick one.',
  watchlist: 'Track vehicles you are considering and keep listing details in one place.',
  whatIfLab: 'Change price, APR, term, or cash down and see the payment shift.',
  financeDefense: 'Scripts and checks for the F&I office before you sign.',
  traps: 'Common dealership traps and how to shut them down.',
  checklist: 'Buyer checklist for the lot, desk, and signing table.',
  tacticDecoder: 'Decode the line they just used and get a reply.',
  notes: 'Quotes, promises, and pressure from this visit.',
  upgradeHub: 'Free versus Pro tools, restore, and lifetime access.',
  settingsHub: 'Legal, support, premium access, and buyer preferences.',
  firstRunWalkthrough: 'Pick a ceiling before they pick a payment.',
};

const WELCOME_CARD_SCREENS = new Set<Screen>(['analyzerHub', 'scanHub', 'tacticsHub', 'settingsHub']);

function resolveScreenTitle(screen: Screen, bottomTab: BottomTab, mainTab: MainTab) {
  return SCREEN_TITLES[screen] ?? (bottomTab === 'lotCoach' ? 'AI Lot Coach' : TAB_HEADER_COPY[coerceMainTab(mainTab, 'scan')].title);
}

function resolveScreenSubtitle(screen: Screen, mainTab: MainTab) {
  return SCREEN_SUBTITLES[screen] ?? TAB_HEADER_COPY[coerceMainTab(mainTab, 'scan')].subtitle;
}

function resolveBottomTabForScreen(screen: Screen, tab?: MainTab): BottomTab | null {
  if (screen === 'liveMode') return 'lotCoach';
  if (CALCULATOR_SCREENS.has(screen) || tab === 'analyzer') return 'calculator';
  return null;
}

const TAB_HEADER_COPY: Record<MainTab, { title: string; subtitle: string }> = {
  scan: {
    title: 'The Golden Check',
    subtitle: 'Start with guided buyer setup, then follow the car buying roadmap from budget to contract scan.',
  },
  analyzer: {
    title: 'Deal Analyzer',
    subtitle: 'Calculator and comparisons — break down structure, compare offers, and model cleaner deals.',
  },
  tactics: {
    title: 'Tactician Guide',
    subtitle: 'Counter dealership pressure tactics with scripts, traps, and live coaching.',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Legal, support, premium access, and buyer preferences.',
  },
};

function createSeriesId() {
  return `series-${makeId()}`;
}

function cloneDealState(deal: DealState): DealState {
  return {
    ...deal,
    feeItems: deal.feeItems.map((item) => ({ ...item })),
    addOnItems: deal.addOnItems.map((item) => ({ ...item })),
    importReviewNotes: [...deal.importReviewNotes],
    contractScannedText: deal.contractScannedText,
    contractImportReviewNotes: [...deal.contractImportReviewNotes],
  };
}

function createTimelineEntry(type: VisitTimelineEventType, dealershipName: string, title: string, detail: string): VisitTimelineEntry {
  return {
    id: makeId(),
    dealershipName: dealershipName.trim() || 'Unnamed dealership',
    type,
    title,
    detail,
    createdAt: new Date().toISOString(),
  };
}

function createAnalyticsEvent(type: string, label: string, detail: string): AnalyticsEvent {
  return {
    id: makeId(),
    type,
    label,
    detail,
    createdAt: new Date().toISOString(),
  };
}

function PremiumPreviewCard({
  title,
  detail,
  onPaywall,
  onPreview,
  showPreviewOption = false,
}: {
  title: string;
  detail: string;
  onPaywall: () => void;
  onPreview?: () => void;
  showPreviewOption?: boolean;
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={showPreviewOption ? onPreview : onPaywall} style={styles.proPreviewCard}>
      <View style={styles.proPreviewBadgeCorner}>
        <ProFeatureBadge unlocked={false} />
      </View>
      <Card>
        <Text style={[styles.menuTitle, styles.menuTitleWithProBadge]}>{title}</Text>
        <Text style={styles.detailText}>{detail}</Text>
        {showPreviewOption && onPreview ? (
          <AppButton label="Preview Pro tools" variant="secondary" onPress={onPreview} />
        ) : null}
        <AppButton label={showPreviewOption ? 'Try purchase again' : 'Unlock with Sign Check Pro'} onPress={onPaywall} />
      </Card>
    </TouchableOpacity>
  );
}

function DealInput({
  label,
  value,
  onChangeText,
  placeholder,
  numeric = true,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  numeric?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={numeric ? 'numeric' : 'default'}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

function ScoreBreakdown({
  items,
}: {
  items: { label: string; reason: string; tone: Tone; effect?: number; delta?: number }[];
}) {
  return (
    <View style={styles.stackGapSmall}>
      {items.map((item) => (
        <View key={`${item.label}-${item.reason}`} style={styles.breakdownRow}>
          <View style={[styles.breakdownDot, item.tone === 'good' ? styles.dotGood : item.tone === 'warn' ? styles.dotWarn : styles.dotBad]} />
          <View style={styles.flexOne}>
            <Text style={styles.breakdownTitle}>
              {item.label}
              {typeof item.effect === 'number' ? ` (+${item.effect})` : ''}
              {typeof item.delta === 'number' ? ` (${item.delta})` : ''}
            </Text>
            <Text style={styles.detailText}>{item.reason}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function LineItemEditor({
  title,
  items,
  onChange,
  onAdd,
  onRemove,
}: {
  title: string;
  items: DealLineItem[];
  onChange: (id: string, key: 'label' | 'amount', value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <View style={styles.stackGapSmall}>
      <View style={styles.rowBetween}>
        <Text style={styles.subheading}>{title}</Text>
        <TouchableOpacity onPress={onAdd} activeOpacity={0.85}>
          <Text style={styles.linkText}>Add line</Text>
        </TouchableOpacity>
      </View>
      {items.length === 0 ? (
        <Text style={styles.detailText}>No line items yet. Add each fee or add-on separately so the compare screen can show what changed.</Text>
      ) : (
        items.map((item, index) => (
          <View key={item.id} style={styles.lineItemCard}>
            <DealInput
              label={`${title} ${index + 1} label`}
              value={item.label}
              onChangeText={(text) => onChange(item.id, 'label', text)}
              placeholder="Doc fee"
              numeric={false}
            />
            <DealInput
              label={`${title} ${index + 1} amount`}
              value={item.amount}
              onChangeText={(text) => onChange(item.id, 'amount', text)}
              placeholder="499"
            />
            <TouchableOpacity onPress={() => onRemove(item.id)} activeOpacity={0.85}>
              <Text style={styles.removeText}>Remove line</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}

type DealReviewEntryMode = 'default' | 'manual' | 'ocr' | 'budget';

type DealShieldAppProps = {
  entryAnalyzerMode?: 'manual' | 'ocr';
};

export default function DealShieldApp({ entryAnalyzerMode }: DealShieldAppProps = {}) {
  const bridge = useDealShieldBridge();
  const registerNavigation = bridge.registerNavigation;
  const scrollRef = useRef<ScrollView>(null);
  const screenHistoryRef = useRef<ScreenNavFrame[]>([]);
  const hardwareBackRef = useRef<() => boolean>(() => false);
  const [mainTab, setMainTab] = useState<MainTab>('scan');
  const [bottomTab, setBottomTabState] = useState<BottomTab>('calculator');
  const [screen, setScreen] = useState<Screen>('scanHub');
  const [dealReviewEntryMode, setDealReviewEntryMode] = useState<DealReviewEntryMode>('default');
  const [dealReviewWizardStep, setDealReviewWizardStep] = useState<DealReviewWizardStep>('import');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedComparePair, setSelectedComparePair] = useState<SelectedComparePair>({ firstId: null, secondId: null });
  const [selectedTacticIndex, setSelectedTacticIndex] = useState(0);
  const [appData, setAppData] = useState(createInitialAppData());
  const [loaded, setLoaded] = useState(false);
  const [isRunningPhotoOcr, setIsRunningPhotoOcr] = useState(false);
  const [pendingImport, setPendingImport] = useState<QuoteImportResult | null>(null);
  const [editableImportFields, setEditableImportFields] = useState<Record<string, string>>({});
  const [editableFeeItems, setEditableFeeItems] = useState<DealLineItem[]>([]);
  const [editableAddOnItems, setEditableAddOnItems] = useState<DealLineItem[]>([]);
  const [isRunningContractOcr, setIsRunningContractOcr] = useState(false);
  const [pendingContractImport, setPendingContractImport] = useState<QuoteImportResult | null>(null);
  const [editableContractFields, setEditableContractFields] = useState<Record<string, string>>({});
  const [loadedDealId, setLoadedDealId] = useState<string | null>(null);
  const [whatIfDeal, setWhatIfDeal] = useState<DealState>(createInitialAppData().deal);
  const [whatIfSmartHeadline, setWhatIfSmartHeadline] = useState<string | null>(null);
  const [backupDraft, setBackupDraft] = useState('');
  const [promiseDraft, setPromiseDraft] = useState('');
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingDiagnostics, setBillingDiagnostics] = useState<BillingDiagnostics | null>(null);
  const [billingDiagnosticsBusy, setBillingDiagnosticsBusy] = useState(false);
  const [showProActivatedBanner, setShowProActivatedBanner] = useState(false);
  const [closedBetaChecklist, setClosedBetaChecklist] = useState<ClosedBetaChecklist>({
    sampleDealLoaded: false,
    lotCoachAsked: false,
    pressureLogged: false,
    dismissed: false,
  });
  const [showPremiumPreviewBanner, setShowPremiumPreviewBanner] = useState(false);
  const [deskSection, setDeskSection] = useState<'flags' | 'coaching' | 'score' | 'visit' | null>(null);
  const [simulatorIndex, setSimulatorIndex] = useState(0);
  const [ocrConfirmedFields, setOcrConfirmedFields] = useState<Record<string, boolean>>({});
  const [pendingListingImport, setPendingListingImport] = useState<ListingImportResult | null>(null);
  const [editableListingFields, setEditableListingFields] = useState<Record<string, string>>({});
  const [listingConfirmedFields, setListingConfirmedFields] = useState<Record<string, boolean>>({});
  const [pendingListingPhotoUri, setPendingListingPhotoUri] = useState('');
  const [isRunningListingOcr, setIsRunningListingOcr] = useState(false);
  const insets = useSafeAreaInsets();
  const analyzerEntryHandled = useRef(false);

  function applyBillingState(billing: BillingState, tierOverride?: PremiumTier) {
    setAppData((prev) => {
      const nextTier = resolveSyncedPremiumTier({ billing, tierOverride });

      return {
        ...prev,
        billing: isPaywallBypassed()
          ? {
              ...billing,
              entitlementStatus: 'active',
              packageLabel: 'Sign Check Pro Active (mock validation)',
              customerInfoNote:
                'MOCK_REVENUECAT_VALIDATION is enabled for local development only. Disable before store submission.',
            }
          : billing,
        subscription: {
          ...prev.subscription,
          tier: nextTier,
          upgradedAt: nextTier === 'pro' ? prev.subscription.upgradedAt ?? new Date().toISOString() : null,
        },
      };
    });
  }

  useEffect(() => {
    let active = true;

    loadAppData()
      .then(async (data) => {
        if (!active) return;
        const previewEnabled = await loadPremiumPreviewMode();
        const profile = await getFirstRunProfile();
        const nextData = profile
          ? {
              ...data,
              preferences: {
                ...data.preferences,
                experienceMode: profile.isFirstTimeBuyer ? 'firstTimeBuyer' : data.preferences.experienceMode,
                buyerSituation: profile.situation,
                buyerStage:
                  profile.isFirstTimeBuyer && data.preferences.buyerStage === 'undecided'
                    ? 'firstCar'
                    : data.preferences.buyerStage,
              },
            }
          : data;
        setAppData(nextData);
        setShowPremiumPreviewBanner(previewEnabled);
        if (shouldShowFirstRunWalkthrough(nextData.preferences)) {
          setScreen('firstRunWalkthrough');
          setMainTab('scan');
        }
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    void readClosedBetaChecklist().then(setClosedBetaChecklist);
  }, []);

  async function completeClosedBetaStep(step: ClosedBetaChecklistStep) {
    const next = await markClosedBetaStep(step);
    setClosedBetaChecklist(next);
    return next;
  }

  async function handleDismissClosedBetaWelcome() {
    const next = await dismissClosedBetaWelcome();
    setClosedBetaChecklist(next);
  }

  function loadSampleDealDemo() {
    setAppData((prev) => ({
      ...prev,
      deal: buildSampleDealState(),
      negotiationFlags: SAMPLE_DEAL_PRESSURE_FLAGS,
      preferences: {
        ...prev.preferences,
        onboardingComplete: true,
      },
    }));

    if (!isPro && !isPremiumPreview && isPremiumPreviewAllowed()) {
      void enablePremiumPreview();
    }

    setBottomTab('calculator');
    openDealReview('default', { skipBudgetGate: true });
    void completeClosedBetaStep('sampleDealLoaded');
    trackEvent('sample_deal_demo_loaded', 'Sample deal demo loaded', 'Loaded the closed-test sample deal with budget guardrails and pressure context.');
  }

  function openLotCoachFromChecklist() {
    if (!hasProAccess) {
      void startPaywallPurchase(() => setBottomTab('lotCoach'));
      return;
    }

    setBottomTab('lotCoach');
  }

  function openLiveModeFromChecklist() {
    if (!hasProAccess) {
      void startPaywallPurchase(() => openScreen('liveMode', 'tactics'));
      return;
    }

    openScreen('liveMode', 'tactics');
  }

  function openClosedBetaFeedback() {
    void openExternalLink(getClosedBetaFeedbackUrl(), 'Feedback');
  }

  useEffect(() => {
    if (!loaded) return;
    saveAppData(appData).catch(() => undefined);
  }, [appData, loaded]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => hardwareBackRef.current());
      return () => subscription.remove();
    }, [])
  );

  useEffect(() => {
    let active = true;

    initializeBilling(appData.subscription.tier)
      .then((billing) => {
        if (!active) return;
        applyBillingState(billing);
      })
      .catch(() => undefined);

    const unsubscribe = subscribeToBillingUpdates((billing) => {
      if (!active) return;
      applyBillingState(billing);
    }, appData.subscription.tier);

    return () => {
      active = false;
      unsubscribe();
    };
  }, [appData.subscription.tier]);

  useEffect(() => {
    if (!loaded || !entryAnalyzerMode || analyzerEntryHandled.current) return;

    analyzerEntryHandled.current = true;
    openDealReview(entryAnalyzerMode, { startOcr: entryAnalyzerMode === 'ocr' });
  }, [loaded, entryAnalyzerMode]);

  const currentQuestion = questions[questionIndex];
  const selectedTactic = salesTacticItems[selectedTacticIndex];
  const readiness = useMemo(() => scoreAnswers(appData.answers), [appData.answers]);
  const readinessLabel = getReadinessLabel(readiness.score);
  const checklistCount = checklistSections.flatMap((section) => section.items).length;
  const completedCount = Object.values(appData.checkedItems).filter(Boolean).length;
  const checklistProgress = checklistCount ? Math.round((completedCount / checklistCount) * 100) : 0;
  const dealAnalysis = useMemo(() => buildDealAnalysis(appData.deal, readinessLabel), [appData.deal, readinessLabel]);
  const dealConfidence = useMemo(() => buildDealConfidence(appData.deal), [appData.deal]);
  const negotiationPlan = useMemo(() => buildNegotiationPlan(appData.deal, dealAnalysis), [appData.deal, dealAnalysis]);
  const actionRecommendation = useMemo(
    () => buildDealActionRecommendation(appData.deal, dealAnalysis, negotiationPlan),
    [appData.deal, dealAnalysis, negotiationPlan]
  );
  const lotCoachContext = useMemo(
    () =>
      buildLotCoachContext({
        deal: appData.deal,
        analysis: dealAnalysis,
        negotiationFlags: appData.negotiationFlags,
        recommendation: actionRecommendation,
        readinessLabel,
      }),
    [actionRecommendation, appData.deal, appData.negotiationFlags, dealAnalysis, readinessLabel]
  );
  const capVsQuote = useMemo(
    () => buildCapVsQuote(appData.deal, dealAnalysis, actionRecommendation),
    [actionRecommendation, appData.deal, dealAnalysis]
  );
  const tradeInAssessment = useMemo(() => buildTradeInAssessment(appData.deal), [appData.deal]);
  const marketBenchmarkAssessment = useMemo(
    () => buildMarketBenchmarkAssessment(appData.deal, dealAnalysis),
    [appData.deal, dealAnalysis]
  );
  const marketCompSnapshot = useMemo(() => buildMarketCompSnapshot(appData.deal, dealAnalysis), [appData.deal, dealAnalysis]);
  const paperworkAudit = useMemo(() => buildPaperworkAudit(appData.deal), [appData.deal]);
  const isPro = resolvePremiumTier(appData.subscription.tier) === 'pro';
  const canOfferPremiumPreview = isPremiumPreviewAllowed();
  const isPremiumPreview = canOfferPremiumPreview && isPremiumPreviewModeEnabled() && appData.subscription.tier === 'free';
  const hasProAccess = isPro || isPremiumPreview;
  const billingStoreUnavailable = useMemo(() => isBillingStoreUnavailable(appData.billing), [appData.billing]);
  const upgradeCtaLabel = getLifetimeUpgradeCtaLabel(billingBusy, appData.billing.packageLabel);
  const experienceMode = appData.preferences.experienceMode;
  const dealShieldAuditDashboard = useMemo(
    () => buildDealShieldAuditDashboard(appData.deal.contractScannedText),
    [appData.deal.contractScannedText]
  );
  const carBuyingRoadmap = useMemo(() => buildCarBuyingRoadmap(appData, hasProAccess), [appData, hasProAccess]);
  const budgetStepComplete = useMemo(() => isRoadmapBudgetComplete(appData), [appData]);
  const nextStepGuidance = useMemo(
    () =>
      buildNextStepGuidance(
        appData.preferences.onboardingComplete,
        experienceMode,
        carBuyingRoadmap.currentStepId
      ),
    [appData.preferences.onboardingComplete, carBuyingRoadmap.currentStepId, experienceMode]
  );
  const analyticsFunnel = useMemo(() => buildAnalyticsFunnel(appData), [appData]);
  const funnelCompletionRate = useMemo(() => getFunnelCompletionRate(analyticsFunnel), [analyticsFunnel]);
  const readinessNextAction = useMemo(
    () => getReadinessNextAction(readinessLabel, readiness.missing, carBuyingRoadmap.currentStepId, experienceMode),
    [readinessLabel, readiness.missing, carBuyingRoadmap.currentStepId, experienceMode]
  );
  const showContractScanResults =
    !!pendingContractImport || appData.deal.contractImportReviewNotes.some((note) => /ocr/i.test(note));
  const pressureSummary = useMemo(
    () => buildPressureSummary(appData.pressureIncidents, appData.negotiationFlags, appData.deal.dealershipName),
    [appData.deal.dealershipName, appData.negotiationFlags, appData.pressureIncidents]
  );
  const promiseSummary = useMemo(
    () => buildPromiseSummary(appData.promises, appData.deal.dealershipName),
    [appData.deal.dealershipName, appData.promises]
  );
  const honestyScore = useMemo(
    () => buildHonestyScore(dealAnalysis, readinessLabel, appData.negotiationFlags),
    [appData.negotiationFlags, dealAnalysis, readinessLabel]
  );
  const liveCoachingPlan = useMemo(
    () => buildLiveCoachingPlan(selectedTactic, dealAnalysis, appData.negotiationFlags),
    [selectedTactic, dealAnalysis, appData.negotiationFlags]
  );
  const liveResponsePack = useMemo(
    () => buildLiveResponsePack(selectedTactic, dealAnalysis, appData.negotiationFlags),
    [selectedTactic, dealAnalysis, appData.negotiationFlags]
  );
  const whatIfComparison = useMemo(
    () => buildWhatIfComparison(appData.deal, whatIfDeal, readinessLabel),
    [appData.deal, whatIfDeal, readinessLabel]
  );
  const signingReadiness = useMemo(
    () => buildSigningReadiness(appData.deal, paperworkAudit, appData.promises, appData.pressureIncidents, appData.deal.dealershipName),
    [appData.deal, appData.pressureIncidents, appData.promises, paperworkAudit]
  );
  const onboardingSummary = useMemo(() => buildOnboardingSummary(appData.preferences), [appData.preferences]);
  const ocrRecovery = useMemo(() => buildOcrRecoverySuggestion(pendingImport), [pendingImport]);
  const contractOcrRecovery = useMemo(() => buildOcrRecoverySuggestion(pendingContractImport), [pendingContractImport]);
  const personalizedInsight = useMemo(
    () => buildPersonalizedInsight(appData.savedDeals, appData.pressureIncidents, appData.promises, appData.deal.dealershipName),
    [appData.deal.dealershipName, appData.pressureIncidents, appData.promises, appData.savedDeals]
  );
  const guidedSessionFlow = useMemo(
    () => buildGuidedSessionFlow(!!appData.deal.importedQuoteText.trim() || !!appData.deal.importedPhotoUri, pressureSummary, signingReadiness, promiseSummary),
    [appData.deal.importedPhotoUri, appData.deal.importedQuoteText, pressureSummary, promiseSummary, signingReadiness]
  );
  const sessionPlaybook = useMemo(
    () =>
      buildSessionPlaybook(
        dealAnalysis,
        liveCoachingPlan,
        actionRecommendation,
        negotiationPlan,
        marketBenchmarkAssessment,
        tradeInAssessment,
        paperworkAudit
      ),
    [actionRecommendation, dealAnalysis, liveCoachingPlan, marketBenchmarkAssessment, negotiationPlan, paperworkAudit, tradeInAssessment]
  );
  const comparison = useMemo(() => compareSavedDeals(appData.savedDeals, readinessLabel), [appData.savedDeals, readinessLabel]);
  const whyOfferWins = useMemo(() => {
    if (!comparison?.winner) return null;
    return buildWhyOfferWinsExplanation(
      comparison.winner.deal,
      comparison.winner.analysis,
      comparison.runnerUp?.deal ?? null,
      comparison.runnerUp?.analysis ?? null,
      comparison.reasons
    );
  }, [comparison]);
  const dealerScorecards = useMemo(
    () => buildDealerScorecards(appData.savedDeals, appData.pressureIncidents, appData.promises, readinessLabel),
    [appData.pressureIncidents, appData.promises, appData.savedDeals, readinessLabel]
  );
  const dealerReputationReports = useMemo(
    () => buildDealerReputationReports(dealerScorecards, appData.visitTimeline),
    [appData.visitTimeline, dealerScorecards]
  );
  const monetizationSummary = useMemo(
    () => buildMonetizationSummary(appData.subscription, appData.savedDeals, appData.pressureIncidents, appData.promises),
    [appData.pressureIncidents, appData.promises, appData.savedDeals, appData.subscription]
  );
  const savingsOpportunity = useMemo(
    () => buildSavingsOpportunity(dealAnalysis, negotiationPlan, actionRecommendation),
    [actionRecommendation, dealAnalysis, negotiationPlan]
  );
  const savingsProof = useMemo(
    () => buildSavingsProof(appData.subscription, savingsOpportunity, whatIfComparison),
    [appData.subscription, savingsOpportunity, whatIfComparison]
  );
  const quickStartGuide = useMemo(() => buildQuickStartGuide(), []);
  const activeSeriesId = useMemo(() => {
    if (loadedDealId) {
      return appData.savedDeals.find((deal) => deal.id === loadedDealId)?.seriesId ?? null;
    }

    const normalizedDealer = appData.deal.dealershipName.trim().toLowerCase();
    if (!normalizedDealer) return null;
    return appData.savedDeals.find((deal) => deal.dealershipName.trim().toLowerCase() === normalizedDealer)?.seriesId ?? null;
  }, [appData.deal.dealershipName, appData.savedDeals, loadedDealId]);
  const nextRevisionNumber = useMemo(
    () => getNextRevisionNumber(appData.savedDeals, activeSeriesId),
    [activeSeriesId, appData.savedDeals]
  );
  const saveOfferLabel = useMemo(() => {
    if (loadedDealId || activeSeriesId) {
      return `SAVE AS REVISION ${nextRevisionNumber}`;
    }
    return 'SAVE OFFER';
  }, [activeSeriesId, loadedDealId, nextRevisionNumber]);
  const showSecondOpinionCta =
    dealAnalysis.dealVerdict === 'Review Carefully' || dealAnalysis.dealVerdict === 'Bad Deal' || dealAnalysis.dealVerdict === 'Walk Away';
  const offerTimeline = useMemo(
    () => (activeSeriesId ? buildOfferTimeline(appData.savedDeals, activeSeriesId, readinessLabel) : []),
    [activeSeriesId, appData.savedDeals, readinessLabel]
  );

  const selectedDealsForCompare = useMemo(() => {
    const byId = new Map(appData.savedDeals.map((deal) => [deal.id, deal]));
    return {
      first: selectedComparePair.firstId ? byId.get(selectedComparePair.firstId) ?? null : null,
      second: selectedComparePair.secondId ? byId.get(selectedComparePair.secondId) ?? null : null,
    };
  }, [appData.savedDeals, selectedComparePair]);

  const manualCompareAnalyses = useMemo(
    () => ({
      first: selectedDealsForCompare.first ? buildDealAnalysis(selectedDealsForCompare.first, readinessLabel) : null,
      second: selectedDealsForCompare.second ? buildDealAnalysis(selectedDealsForCompare.second, readinessLabel) : null,
    }),
    [selectedDealsForCompare, readinessLabel]
  );
  const selectedWhyOfferWins = useMemo(() => {
    if (!selectedDealsForCompare.first || !selectedDealsForCompare.second || !manualCompareAnalyses.first || !manualCompareAnalyses.second) {
      return null;
    }
    const leftRank = manualCompareAnalyses.first.dangerScore * 100000 + manualCompareAnalyses.first.totalPaid;
    const rightRank = manualCompareAnalyses.second.dangerScore * 100000 + manualCompareAnalyses.second.totalPaid;
    const leftWins = leftRank <= rightRank;
    const winnerDeal = leftWins ? selectedDealsForCompare.first : selectedDealsForCompare.second;
    const winnerAnalysis = leftWins ? manualCompareAnalyses.first : manualCompareAnalyses.second;
    const runnerDeal = leftWins ? selectedDealsForCompare.second : selectedDealsForCompare.first;
    const runnerAnalysis = leftWins ? manualCompareAnalyses.second : manualCompareAnalyses.first;
    const pairComparison = compareSavedDeals([winnerDeal, runnerDeal], readinessLabel);
    return buildWhyOfferWinsExplanation(
      winnerDeal,
      winnerAnalysis,
      runnerDeal,
      runnerAnalysis,
      pairComparison?.reasons ?? []
    );
  }, [manualCompareAnalyses, readinessLabel, selectedDealsForCompare]);
  const compareLotCoachContext = useMemo(() => {
    if (!selectedDealsForCompare.first || !selectedDealsForCompare.second || !manualCompareAnalyses.first || !manualCompareAnalyses.second) {
      return null;
    }
    return buildCompareLotCoachContext({
      leftDeal: selectedDealsForCompare.first,
      rightDeal: selectedDealsForCompare.second,
      leftAnalysis: manualCompareAnalyses.first,
      rightAnalysis: manualCompareAnalyses.second,
      whyWinsHeadline: selectedWhyOfferWins?.headline,
      whyWinsBullets: selectedWhyOfferWins?.bullets,
      readinessLabel,
      buyerStateCode: appData.deal.buyerStateCode,
      targetTotalPaid: appData.deal.targetTotalPaid,
    });
  }, [
    appData.deal.buyerStateCode,
    appData.deal.targetTotalPaid,
    manualCompareAnalyses,
    readinessLabel,
    selectedDealsForCompare,
    selectedWhyOfferWins,
  ]);
  const manualComparisonInsights = useMemo(() => {
    if (!selectedDealsForCompare.first || !selectedDealsForCompare.second || !manualCompareAnalyses.first || !manualCompareAnalyses.second) return [];
    return buildComparisonInsights(
      selectedDealsForCompare.first,
      selectedDealsForCompare.second,
      manualCompareAnalyses.first,
      manualCompareAnalyses.second
    );
  }, [selectedDealsForCompare, manualCompareAnalyses]);
  const manualCounterMoves = useMemo(() => {
    if (!selectedDealsForCompare.first || !selectedDealsForCompare.second || !manualCompareAnalyses.first || !manualCompareAnalyses.second) return [];
    const leftRank = manualCompareAnalyses.first.dangerScore * 100000 + manualCompareAnalyses.first.totalPaid;
    const rightRank = manualCompareAnalyses.second.dangerScore * 100000 + manualCompareAnalyses.second.totalPaid;
    return leftRank <= rightRank
      ? buildCounterOfferMoves(selectedDealsForCompare.second, selectedDealsForCompare.first, manualCompareAnalyses.second, manualCompareAnalyses.first)
      : buildCounterOfferMoves(selectedDealsForCompare.first, selectedDealsForCompare.second, manualCompareAnalyses.first, manualCompareAnalyses.second);
  }, [selectedDealsForCompare, manualCompareAnalyses]);
  const negotiationSimulatorTurns = useMemo(
    () => buildNegotiationSimulator(selectedTactic, dealAnalysis, appData.negotiationFlags),
    [selectedTactic, dealAnalysis, appData.negotiationFlags]
  );
  const activeSimulationTurn = negotiationSimulatorTurns[simulatorIndex % Math.max(negotiationSimulatorTurns.length, 1)];

  function updateDeal<K extends keyof typeof appData.deal>(key: K, value: (typeof appData.deal)[K]) {
    setAppData((prev) => ({
      ...prev,
      deal: { ...prev.deal, [key]: value },
    }));
  }

  function queueQuoteImport(rawText: string, sourceLabel = 'pasted quote text') {
    const result = importQuoteText(rawText);
    setAppData((prev) => ({
      ...prev,
      deal: {
        ...prev.deal,
        importedQuoteText: rawText,
        importReviewNotes: result.reviewNotes,
      },
    }));
    setPendingImport(result);
    setOcrConfirmedFields({});
    setEditableImportFields(
      Object.fromEntries(result.fieldReviews.map((item) => [item.field, item.value]))
    );
    setEditableFeeItems(result.feeItemReviews.map((item) => ({ id: item.id, label: item.label, amount: item.amount })));
    setEditableAddOnItems(result.addOnItemReviews.map((item) => ({ id: item.id, label: item.label, amount: item.amount })));
    appendTimelineEntry('quoteImported', 'Imported quote for review', `Matched ${result.matchedFields.length} field(s) from ${sourceLabel}.`);
    trackEvent('quote_imported', 'Quote imported', `Matched ${result.matchedFields.length} field(s) from ${sourceLabel}.`);

    if (!result.matchedFields.length) {
      Alert.alert('Import review', result.reviewNotes.join('\n'));
      return;
    }

    Alert.alert('Import ready for review', `Detected ${result.matchedFields.join(', ')} from ${sourceLabel}. Review and apply the extracted fields below.`);
  }

  function importQuoteIntoDeal() {
    queueQuoteImport(appData.deal.importedQuoteText);
  }

  function queueContractImport(rawText: string, sourceLabel = 'contract OCR') {
    const result = importQuoteText(rawText);
    updateDeal('contractScannedText', rawText.trim());
    const contractFields = {
      contractVehiclePrice: result.parsedDeal.vehiclePrice ?? '',
      contractApr: result.parsedDeal.apr ?? '',
      contractMonths: result.parsedDeal.months ?? '',
      contractDownPayment: result.parsedDeal.downPayment ?? '',
      contractTradeIn: result.parsedDeal.tradeIn ?? '',
      contractFees:
        result.parsedDeal.feeItems && result.parsedDeal.feeItems.length > 0
          ? String(result.parsedDeal.feeItems.reduce((sum, item) => sum + Number(item.amount || 0), 0))
          : '',
      contractAddOns:
        result.parsedDeal.addOnItems && result.parsedDeal.addOnItems.length > 0
          ? String(result.parsedDeal.addOnItems.reduce((sum, item) => sum + Number(item.amount || 0), 0))
          : '',
    };

    setPendingContractImport(result);
    setEditableContractFields(contractFields);
    updateDeal('contractImportReviewNotes', result.reviewNotes.map((note) => `${sourceLabel}: ${note}`));
    appendTimelineEntry('paperworkChecked', 'Contract OCR prepared', `Detected ${result.matchedFields.length} contract field(s) from ${sourceLabel}.`);

    Alert.alert('Contract import ready', 'Review the imported contract fields below before applying them to the paperwork audit.');
  }

  function applyPendingImport() {
    if (!pendingImport) return;

    const editedParsedDeal = {
      ...pendingImport.parsedDeal,
      vehiclePrice: editableImportFields['Vehicle price'] ?? pendingImport.parsedDeal.vehiclePrice,
      apr: editableImportFields['APR'] ?? pendingImport.parsedDeal.apr,
      months: editableImportFields['Term'] ?? pendingImport.parsedDeal.months,
      downPayment: editableImportFields['Down payment'] ?? pendingImport.parsedDeal.downPayment,
      tradeIn: editableImportFields['Trade-in'] ?? pendingImport.parsedDeal.tradeIn,
      feeItems: editableFeeItems,
      addOnItems: editableAddOnItems,
      feeNames: editableFeeItems.map((item) => item.label.trim()).filter(Boolean).join(', '),
    };

    const updatedReviewNotes = pendingImport.reviewNotes.some((note) => note.includes('Manually confirmed'))
      ? pendingImport.reviewNotes
      : [...pendingImport.reviewNotes, 'Manually confirmed fields were applied from the OCR review step.'];

    setAppData((prev) => ({
      ...prev,
      deal: {
        ...prev.deal,
        ...editedParsedDeal,
        importReviewNotes: updatedReviewNotes,
      },
    }));
    incrementUsage('ocrImports');
    appendTimelineEntry('quoteImported', 'Applied reviewed quote fields', 'Imported quote values were reviewed and applied to the active deal.');
    trackEvent('ocr_applied', 'OCR fields applied', 'Reviewed OCR values were applied to the active deal.');
    setPendingImport(null);
    setEditableImportFields({});
    setEditableFeeItems([]);
    setEditableAddOnItems([]);
    setDealReviewWizardStep('numbers');
    Alert.alert('Import applied', 'The reviewed OCR fields were applied to the deal.');
  }

  function dismissPendingImport() {
    setPendingImport(null);
    setEditableImportFields({});
    setEditableFeeItems([]);
    setEditableAddOnItems([]);
  }

  function applyPendingContractImport() {
    if (!pendingContractImport) return;

    setAppData((prev) => ({
      ...prev,
      deal: {
        ...prev.deal,
        contractVehiclePrice: editableContractFields.contractVehiclePrice ?? prev.deal.contractVehiclePrice,
        contractFees: editableContractFields.contractFees ?? prev.deal.contractFees,
        contractAddOns: editableContractFields.contractAddOns ?? prev.deal.contractAddOns,
        contractDownPayment: editableContractFields.contractDownPayment ?? prev.deal.contractDownPayment,
        contractTradeIn: editableContractFields.contractTradeIn ?? prev.deal.contractTradeIn,
        contractApr: editableContractFields.contractApr ?? prev.deal.contractApr,
        contractMonths: editableContractFields.contractMonths ?? prev.deal.contractMonths,
      },
    }));
    setPendingContractImport(null);
    setEditableContractFields({});
    appendTimelineEntry('paperworkChecked', 'Contract OCR applied', 'Imported contract values were applied to the paperwork audit.');
    trackEvent('contract_ocr_applied', 'Contract OCR applied', 'Imported contract values were applied to the paperwork audit.');
    Alert.alert('Contract fields applied', 'The imported contract values are now loaded into the paperwork audit.');
  }

  function dismissPendingContractImport() {
    setPendingContractImport(null);
    setEditableContractFields({});
  }

  function updateEditableContractField(field: string, value: string) {
    setEditableContractFields((prev) => ({ ...prev, [field]: value }));
  }

  function updateEditableImportField(field: string, value: string) {
    setEditableImportFields((prev) => ({ ...prev, [field]: value }));
  }

  function appendTimelineEntry(type: VisitTimelineEventType, title: string, detail: string, dealershipName = appData.deal.dealershipName) {
    setAppData((prev) => ({
      ...prev,
      visitTimeline: [createTimelineEntry(type, dealershipName, title, detail), ...prev.visitTimeline].slice(0, 120),
    }));
  }

  function deleteTimelineEntry(id: string) {
    setAppData((prev) => ({
      ...prev,
      visitTimeline: prev.visitTimeline.filter((entry) => entry.id !== id),
    }));
  }

  function confirmDeleteTimelineEntry(id: string) {
    Alert.alert('Delete this log?', 'This removes it from the visit timeline.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTimelineEntry(id) },
    ]);
  }

  function saveVisitNoteToTimeline() {
    const text = appData.notes.trim();
    if (!text) {
      Alert.alert('Add a note first', 'Type a dealership note before saving it to the visit timeline.');
      return;
    }
    if (isDuplicateVisitNote(appData.visitTimeline, text)) {
      Alert.alert('Already saved', 'That note is already on the visit timeline.');
      return;
    }
    appendTimelineEntry('noteAdded', 'Visit note saved', text);
    Alert.alert('Log saved', 'That note is now on the visit timeline.');
  }

  function deletePromiseRecord(id: string) {
    setAppData((prev) => ({
      ...prev,
      promises: prev.promises.filter((promise) => promise.id !== id),
    }));
  }

  function confirmDeletePromise(id: string) {
    Alert.alert('Delete this promise?', 'This removes it from the promise tracker.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePromiseRecord(id) },
    ]);
  }

  function deletePressureIncident(id: string) {
    setAppData((prev) => ({
      ...prev,
      pressureIncidents: prev.pressureIncidents.filter((incident) => incident.id !== id),
    }));
  }

  function confirmDeletePressureIncident(id: string) {
    Alert.alert('Delete this pressure log?', 'This removes it from pressure history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePressureIncident(id) },
    ]);
  }

  function trackEvent(type: string, label: string, detail: string) {
    setAppData((prev) => ({
      ...prev,
      analyticsEvents: [createAnalyticsEvent(type, label, detail), ...prev.analyticsEvents].slice(0, 120),
    }));
  }

  async function enablePremiumPreview(onEnabled?: () => void) {
    if (!isPremiumPreviewAllowed()) {
      void startPaywallPurchase(onEnabled);
      return;
    }
    setPremiumPreviewMode(true);
    await savePremiumPreviewMode(true);
    setShowPremiumPreviewBanner(true);
    trackEvent('premium_preview', 'Premium preview enabled', PREMIUM_PREVIEW_DISCLAIMER);
    asVoidCallback(onEnabled)?.();
  }

  function promptPremiumPreview(onEnabled?: () => void) {
    if (!isPremiumPreviewAllowed()) {
      void startPaywallPurchase(onEnabled);
      return;
    }
    Alert.alert(
      'Premium Preview Mode',
      `${PREMIUM_PREVIEW_DISCLAIMER}\n\nYou can preview calculators, comparisons, and Pro tools while billing sync completes.`,
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Preview Pro tools', onPress: () => void enablePremiumPreview(onEnabled) },
      ]
    );
  }

  function exitPremiumPreview() {
    void savePremiumPreviewMode(false).then(() => {
      setPremiumPreviewMode(false);
      setShowPremiumPreviewBanner(false);
      trackEvent('premium_preview', 'Premium preview disabled', 'User exited Premium Preview Mode.');
    });
  }

  function setExperienceMode(mode: ExperienceMode) {
    setAppData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        experienceMode: mode,
      },
    }));
  }

  function enableFirstTimeBuyerMode() {
    setAppData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        experienceMode: 'firstTimeBuyer',
        buyerStage: prev.preferences.buyerStage === 'undecided' ? 'firstCar' : prev.preferences.buyerStage,
      },
    }));
    startQuestionFlow('scan');
    trackEvent('first_time_mode_enabled', 'First-time mode enabled', 'Started the guided first-time buyer setup flow from Sign Check.');
  }

  function startExperiencedBuyerSetup() {
    setExperienceMode('standard');
    startQuestionFlow('scan');
    trackEvent('experienced_buyer_setup_started', 'Experienced buyer setup started', 'Started guided setup for a returning buyer from Sign Check.');
  }

  function disableFirstTimeBuyerMode() {
    setExperienceMode('standard');
    trackEvent('first_time_mode_disabled', 'First-time mode disabled', 'Switched back to standard buyer guidance.');
  }

  function startGuidedBuyerSetup() {
    startQuestionFlow('scan');
    trackEvent('guided_setup_started', 'Guided setup started', 'Reopened the readiness questionnaire from Sign Check.');
  }

  function routeAfterQuestionFlow() {
    if (experienceMode === 'firstTimeBuyer') {
      setMainTab('tactics');
      setScreen('checklist');
      trackEvent('first_time_routed_checklist', 'First-time buyer routed to checklist', 'Sent a first-time buyer to the dealership checklist after setup.');
      return;
    }

    setMainTab('scan');
    setScreen('scanHub');
    trackEvent('experienced_buyer_routed_roadmap', 'Experienced buyer routed to roadmap', 'Returned a returning buyer to the Sign Check roadmap after setup.');
  }

  function completeQuestionFlow() {
    setAppData((prev) => {
      const preferences = derivePreferencesFromAnswers(prev.answers, prev.preferences);
      const dealPatch = applyReadinessAnswersToDeal(prev.deal, prev.answers);
      return {
        ...prev,
        preferences,
        deal: { ...prev.deal, ...dealPatch },
      };
    });
    trackEvent('onboarding_completed', 'Guided setup completed', 'Finished readiness questions and applied the buyer profile.');
  }

  function handleReadinessNextAction() {
    switch (readinessNextAction.kind) {
      case 'roadmapBudget':
        openBudgetSetup();
        return;
      case 'roadmapQuickCheck':
        openDealReview('manual');
        return;
      case 'checklist':
        openScreen('checklist', 'tactics');
        return;
      case 'roadmapCurrent':
        handleRoadmapStepPress(carBuyingRoadmap.currentStepId);
        return;
      default:
        return;
    }
  }

  function updatePreference<K extends keyof typeof appData.preferences>(key: K, value: (typeof appData.preferences)[K]) {
    setAppData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));
  }

  async function startPaywallPurchase(onUnlocked?: () => void) {
    const onSuccess = asVoidCallback(onUnlocked);
    if (!isPro && billingStoreUnavailable && isPremiumPreviewAllowed()) {
      promptPremiumPreview(onSuccess);
      return;
    }

    if (!isPro) {
      trackEvent('paywall_opened', 'Paywall opened', 'User tapped a Pro-locked feature or upgrade path.');
    }
    setBillingBusy(true);

    try {
      const result = await purchaseProEntitlement();
      const billing = await initializeBilling(result.tier);
      applyBillingState(billing, result.tier);
      trackEvent('purchase_started', 'Sign Check Pro purchase', result.note);
      if (result.tier === 'pro') {
        Alert.alert('Sign Check Pro', result.note);
        setShowProActivatedBanner(true);
        onSuccess?.();
      } else if (result.note === 'Purchase cancelled.') {
        Alert.alert('Sign Check Pro', result.note);
      } else if (isPremiumPreviewAllowed() && (billingStoreUnavailable || isBillingStoreUnavailable(billing))) {
        Alert.alert('Sign Check Pro', `${result.note}\n\nBilling is still syncing. You can preview Pro tools instead.`, [
          { text: 'OK', style: 'cancel' },
          { text: 'Preview Pro tools', onPress: () => void enablePremiumPreview(onSuccess) },
        ]);
      } else {
        Alert.alert('Sign Check Pro', result.note);
      }
      await refreshBillingDiagnostics(result.tier);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Purchase could not start.';
      if (isPremiumPreviewAllowed()) {
        Alert.alert('Sign Check Pro', `${message}\n\nYou can preview Pro tools while billing sync completes.`, [
          { text: 'OK', style: 'cancel' },
          { text: 'Preview Pro tools', onPress: () => void enablePremiumPreview(onSuccess) },
        ]);
      } else {
        Alert.alert('Sign Check Pro', message);
      }
    } finally {
      setBillingBusy(false);
    }
  }

  async function restorePurchase() {
    setBillingBusy(true);

    try {
      const result = await restoreProEntitlement(appData.subscription.tier);
      const billing = await initializeBilling(result.tier);
      applyBillingState(billing, result.tier);
      trackEvent('purchase_restored', 'Restore purchase', result.note);
      if (result.tier === 'pro') {
        Alert.alert('Restore purchase', result.note);
      } else if (isPremiumPreviewAllowed() && (billingStoreUnavailable || isBillingStoreUnavailable(billing))) {
        Alert.alert('Restore purchase', `${result.note}\n\nBilling is still syncing. You can preview Pro tools instead.`, [
          { text: 'OK', style: 'cancel' },
          { text: 'Preview Pro tools', onPress: () => void enablePremiumPreview() },
        ]);
      } else {
        Alert.alert('Restore purchase', result.note);
      }
      await refreshBillingDiagnostics(result.tier);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Restore could not complete.';
      if (isPremiumPreviewAllowed()) {
        Alert.alert('Restore purchase', `${message}\n\nYou can preview Pro tools while billing sync completes.`, [
          { text: 'OK', style: 'cancel' },
          { text: 'Preview Pro tools', onPress: () => void enablePremiumPreview() },
        ]);
      } else {
        Alert.alert('Restore purchase', message);
      }
    } finally {
      setBillingBusy(false);
    }
  }

  async function refreshBillingDiagnostics(tier: PremiumTier = appData.subscription.tier) {
    setBillingDiagnosticsBusy(true);
    try {
      const diagnostics = await getBillingDiagnostics(tier);
      setBillingDiagnostics(diagnostics);
    } finally {
      setBillingDiagnosticsBusy(false);
    }
  }

  function handleLockedFeaturePress(feature: string) {
    if (feature === 'AI Lot Coach') {
      if (billingStoreUnavailable && isPremiumPreviewAllowed()) {
        promptPremiumPreview(() => setBottomTab('lotCoach'));
        return;
      }
      void startPaywallPurchase(() => setBottomTab('lotCoach'));
      return;
    }

    void startPaywallPurchase();
  }

  function incrementUsage(key: keyof typeof appData.subscription.usage) {
    setAppData((prev) => ({
      ...prev,
      subscription: {
        ...prev.subscription,
        usage: {
          ...prev.subscription.usage,
          [key]: prev.subscription.usage[key] + 1,
        },
      },
    }));
  }

  function updateEditableLineItem(section: 'fee' | 'addon', id: string, key: 'label' | 'amount', value: string) {
    const setter = section === 'fee' ? setEditableFeeItems : setEditableAddOnItems;
    setter((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function addEditableLineItem(section: 'fee' | 'addon') {
    const setter = section === 'fee' ? setEditableFeeItems : setEditableAddOnItems;
    setter((prev) => [...prev, createLineItem()]);
  }

  function removeEditableLineItem(section: 'fee' | 'addon', id: string) {
    const setter = section === 'fee' ? setEditableFeeItems : setEditableAddOnItems;
    setter((prev) => prev.filter((item) => item.id !== id));
  }

  function getLineItemReview(section: 'fee' | 'addon', id: string) {
    const reviews = section === 'fee' ? pendingImport?.feeItemReviews : pendingImport?.addOnItemReviews;
    return reviews?.find((item) => item.id === id) ?? null;
  }

  async function pickQuotePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Photo library access is required to choose a quote image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    updateDeal('importedPhotoUri', result.assets[0].uri);
    setAppData((prev) => ({
      ...prev,
      deal: {
        ...prev.deal,
        importedPhotoUri: result.assets[0].uri,
        importReviewNotes: [
          Platform.OS === 'web'
            ? 'Photo selected. Run OCR to extract text from the image.'
            : 'Photo selected. OCR is not supported in Expo Go on native yet, so use the pasted text importer or run this flow on web.',
        ],
      },
    }));
  }

  function removeQuotePhoto() {
    setAppData((prev) => ({
      ...prev,
      deal: {
        ...prev.deal,
        importedPhotoUri: '',
        importReviewNotes: prev.deal.importReviewNotes.filter((note) => !note.startsWith('Photo selected')),
      },
    }));
  }

  function removeContractPhoto() {
    setAppData((prev) => ({
      ...prev,
      deal: {
        ...prev.deal,
        contractImportedPhotoUri: '',
        contractScannedText: '',
        contractImportReviewNotes: prev.deal.contractImportReviewNotes.filter((note) => !note.startsWith('Contract photo selected')),
      },
    }));
  }

  async function pickContractPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Photo library access is required to choose a contract image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    updateDeal('contractImportedPhotoUri', result.assets[0].uri);
    updateDeal('contractImportReviewNotes', ['Contract photo selected. Run OCR to extract contract fields for the paperwork audit.']);
  }

  async function extractTextFromImage(uri: string) {
    let text = '';

    if (Platform.OS === 'web') {
      const { recognize } = await import('tesseract.js');
      const result = await recognize(uri, 'eng');
      text = result.data.text?.trim() ?? '';
    } else {
      if (Constants.appOwnership === 'expo') {
        throw new Error('expo-go-contract-ocr');
      }

      const { default: TextRecognition } = await import('@react-native-ml-kit/text-recognition');
      const result = await TextRecognition.recognize(uri);
      text = result?.text?.trim?.() ?? '';
    }

    return text;
  }

  async function runPhotoOcrImport() {
    if (!appData.deal.importedPhotoUri) {
      Alert.alert('No photo selected', 'Choose a photo first, then run OCR.');
      return;
    }

    setIsRunningPhotoOcr(true);

    try {
      const text = await extractTextFromImage(appData.deal.importedPhotoUri);

      if (!text) {
        Alert.alert('OCR review', 'No readable text was extracted from that image. Try a clearer crop with higher contrast.');
        return;
      }

      queueQuoteImport(text, Platform.OS === 'web' ? 'photo OCR' : 'native photo OCR');
    } catch (error) {
      Alert.alert(
        'OCR failed',
        error instanceof Error && error.message === 'expo-go-contract-ocr'
          ? 'Native photo OCR needs a rebuilt development client. Expo Go can preview the photo, but ML Kit OCR only works after creating and opening a development build.'
          : Platform.OS === 'web'
          ? 'Could not read text from that photo right now. Try the pasted text importer or another image.'
          : 'Could not run native OCR from that photo. Make sure you are using a rebuilt development build, then try another image.'
      );
    } finally {
      setIsRunningPhotoOcr(false);
    }
  }

  async function runContractOcrImport() {
    if (!appData.deal.contractImportedPhotoUri) {
      Alert.alert('No contract photo selected', 'Choose a contract or buyer order photo first, then run OCR.');
      return;
    }

    setIsRunningContractOcr(true);

    try {
      const text = await extractTextFromImage(appData.deal.contractImportedPhotoUri);

      if (!text) {
        Alert.alert('Contract OCR review', 'No readable text was extracted from that contract image. Try a flatter, clearer document photo.');
        return;
      }

      queueContractImport(text, Platform.OS === 'web' ? 'contract photo OCR' : 'native contract OCR');
    } catch (error) {
      Alert.alert(
        'Contract OCR failed',
        error instanceof Error && error.message === 'expo-go-contract-ocr'
          ? 'Native contract OCR needs a rebuilt development client. Expo Go can preview the contract photo, but OCR only works after opening a development build.'
          : 'Could not extract the contract fields from that image right now. Try a clearer photo or enter the contract values manually.'
      );
    } finally {
      setIsRunningContractOcr(false);
    }
  }

  function dismissPendingListingImport() {
    setPendingListingImport(null);
    setEditableListingFields({});
    setListingConfirmedFields({});
    setPendingListingPhotoUri('');
  }

  function startManualListingEntry(photoUri: unknown = pendingListingPhotoUri) {
    const uri = typeof photoUri === 'string' ? photoUri : '';
    if (appData.watchedVehicles.length >= MAX_WATCHED_VEHICLES) {
      Alert.alert('Watchlist full', `You can save up to ${MAX_WATCHED_VEHICLES} vehicles. Remove one to add another.`);
      return;
    }

    const draft = createBlankListingImport(uri, uri ? 'manual entry with photo' : 'manual entry');
    setPendingListingPhotoUri(uri);
    setPendingListingImport(draft);
    setEditableListingFields({
      Year: '',
      Make: '',
      Model: '',
      Trim: '',
      'Asking price': '',
      'City / county': '',
      State: '',
      'Miles away': '',
      Mileage: '',
      'Dealer / seller': '',
      Notes: '',
    });
    setListingConfirmedFields({});
    openScreen('watchlist', 'analyzer');
    trackEvent('watchlist_manual', 'Manual listing entry opened', uri ? 'Opened blank listing form with a photo.' : 'Opened blank listing form without a photo.');
  }

  async function pickListingPhoto(source: 'camera' | 'library') {
    if (appData.watchedVehicles.length >= MAX_WATCHED_VEHICLES) {
      Alert.alert('Watchlist full', `You can save up to ${MAX_WATCHED_VEHICLES} vehicles. Remove one to add another.`);
      return;
    }

    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera permission needed', 'Allow camera access to photograph an Autotrader listing.');
        return;
      }
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo permission needed', 'Allow photo access to import an Autotrader listing screenshot.');
        return;
      }
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 1,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 1,
          });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    setPendingListingImport(null);
    setEditableListingFields({});
    setListingConfirmedFields({});
    setPendingListingPhotoUri(result.assets[0].uri);
    openScreen('watchlist', 'analyzer');
  }

  async function runListingPhotoOcr() {
    if (!pendingListingPhotoUri) {
      Alert.alert('No photo selected', 'Take or choose a listing photo first, then run OCR.');
      return;
    }

    setIsRunningListingOcr(true);

    try {
      const text = await extractTextFromImage(pendingListingPhotoUri);
      if (!text) {
        Alert.alert(
          'OCR review',
          'No readable text was extracted from that listing image. You can try a clearer crop, or enter the details manually and keep the photo.',
          [
            { text: 'Try again later', style: 'cancel' },
            { text: 'Enter manually', onPress: () => startManualListingEntry(pendingListingPhotoUri) },
          ]
        );
        return;
      }

      const draft = importListingText(
        text,
        pendingListingPhotoUri,
        Platform.OS === 'web' ? 'listing photo OCR' : 'native listing photo OCR'
      );
      setPendingListingImport(draft);
      setEditableListingFields({
        Year: draft.year,
        Make: draft.make,
        Model: draft.model,
        Trim: draft.trim,
        'Asking price': draft.askingPrice,
        'City / county': draft.cityOrCounty,
        State: draft.stateCode,
        'Miles away': draft.milesAway,
        Mileage: draft.mileage,
        'Dealer / seller': draft.dealerOrSeller,
        Notes: '',
      });
      setListingConfirmedFields({});
      trackEvent('watchlist_ocr', 'Listing OCR imported', `Captured listing fields from ${draft.sourceLabel}.`);
    } catch (error) {
      const expoGoBlocked = error instanceof Error && error.message === 'expo-go-contract-ocr';
      Alert.alert(
        'Listing OCR failed',
        expoGoBlocked
          ? 'Native photo OCR needs a rebuilt development client. You can still enter the listing details manually and keep this photo.'
          : Platform.OS === 'web'
            ? 'Could not read text from that photo right now. Enter the details manually, or try another image.'
            : 'Could not run native OCR from that photo. Enter the details manually, or try another image in a development/store build.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enter manually', onPress: () => startManualListingEntry(pendingListingPhotoUri) },
        ]
      );
    } finally {
      setIsRunningListingOcr(false);
    }
  }

  function savePendingListingImport() {
    if (!pendingListingImport) return;

    const year = (editableListingFields.Year ?? pendingListingImport.year).trim();
    const make = (editableListingFields.Make ?? pendingListingImport.make).trim();
    const model = (editableListingFields.Model ?? pendingListingImport.model).trim();
    const askingPrice = (editableListingFields['Asking price'] ?? pendingListingImport.askingPrice).trim();
    if (!make && !model && !askingPrice && !year) {
      Alert.alert('Add a few details', 'Enter at least a make, model, year, or asking price before saving.');
      return;
    }

    const vehicle = createWatchedVehicleFromImport(
      pendingListingImport,
      {
        year,
        make,
        model,
        trim: editableListingFields.Trim ?? pendingListingImport.trim,
        askingPrice,
        cityOrCounty: editableListingFields['City / county'] ?? pendingListingImport.cityOrCounty,
        stateCode: editableListingFields.State ?? pendingListingImport.stateCode,
        milesAway: editableListingFields['Miles away'] ?? pendingListingImport.milesAway,
        mileage: editableListingFields.Mileage ?? pendingListingImport.mileage,
        dealerOrSeller: editableListingFields['Dealer / seller'] ?? pendingListingImport.dealerOrSeller,
        notes: editableListingFields.Notes ?? '',
        photoUri: pendingListingImport.photoUri || pendingListingPhotoUri,
      },
      () => `watch-${makeId()}`
    );

    setAppData((prev) => ({
      ...prev,
      watchedVehicles: [vehicle, ...prev.watchedVehicles].slice(0, MAX_WATCHED_VEHICLES),
    }));
    dismissPendingListingImport();
    trackEvent('watchlist_saved', 'Watched vehicle saved', `Saved ${vehicle.title || 'listing'} to the watchlist.`);
  }

  function deleteWatchedVehicle(id: string) {
    setAppData((prev) => ({
      ...prev,
      watchedVehicles: prev.watchedVehicles.filter((vehicle) => vehicle.id !== id),
    }));
  }

  function useWatchedVehicleInDealReview(vehicle: WatchedVehicle) {
    setAppData((prev) => {
      const existingComps = prev.deal.marketComparablePricesText.trim();
      const locationLabel = [vehicle.cityOrCounty, vehicle.stateCode].filter(Boolean).join(', ');
      const distanceLabel = vehicle.milesAway.trim() ? `${vehicle.milesAway} mi away` : '';
      const placeNote = [locationLabel, distanceLabel].filter(Boolean).join(' · ');
      const nextNotes = placeNote
        ? [prev.deal.offerNotes, `Watchlist: ${vehicle.title || 'vehicle'} in ${placeNote}`].filter(Boolean).join('\n')
        : prev.deal.offerNotes;

      return {
        ...prev,
        deal: {
          ...prev.deal,
          vehiclePrice: vehicle.askingPrice || prev.deal.vehiclePrice,
          dealershipName: vehicle.dealerOrSeller || prev.deal.dealershipName,
          offerNotes: nextNotes,
          marketComparablePricesText: vehicle.askingPrice
            ? existingComps
              ? `${existingComps}, ${vehicle.askingPrice}`
              : vehicle.askingPrice
            : prev.deal.marketComparablePricesText,
        },
      };
    });
    trackEvent('watchlist_to_deal', 'Watchlist price sent to deal review', 'Copied a watched listing price into deal review.');
    openDealReview('default', { skipBudgetGate: true });
  }

  async function exportBuyerCasePdf() {
    try {
      const Print = await import('expo-print');
      const Sharing = await import('expo-sharing');
      const html = `
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px;">
            <h1>Sign Check Buyer Case File</h1>
            <pre style="white-space: pre-wrap; font-size: 13px;">${buyerReport.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>
            <hr />
            <pre style="white-space: pre-wrap; font-size: 12px;">${visitCaseSummary.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>
          </body>
        </html>
      `;
      const result = await Print.printToFileAsync({ html });
      appendTimelineEntry('reportShared', 'Buyer case file exported as PDF', 'Generated a PDF buyer case file for sharing or records.');

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle: 'Share buyer case file' });
      } else {
        Alert.alert('PDF exported', `Saved buyer case file to ${result.uri}`);
      }
    } catch (error) {
      Alert.alert(
        'PDF export unavailable',
        'PDF export needs a development build that includes Expo Print. The rest of the app should still work, and you can use copy or share in the meantime until you rebuild your Android development build.'
      );
    }
  }

  function updateDealLineItem(section: 'feeItems' | 'addOnItems', id: string, key: 'label' | 'amount', value: string) {
    setAppData((prev) => ({
      ...prev,
      deal: {
        ...prev.deal,
        [section]: prev.deal[section].map((item) => (item.id === id ? { ...item, [key]: value } : item)),
      },
    }));
  }

  function addDealLineItem(section: 'feeItems' | 'addOnItems') {
    setAppData((prev) => ({
      ...prev,
      deal: {
        ...prev.deal,
        [section]: [...prev.deal[section], createLineItem()],
      },
    }));
  }

  function removeDealLineItem(section: 'feeItems' | 'addOnItems', id: string) {
    setAppData((prev) => ({
      ...prev,
      deal: {
        ...prev.deal,
        [section]: prev.deal[section].filter((item) => item.id !== id),
      },
    }));
  }

  function beginNavigation(next: Screen) {
    if (HUB_SCREENS.has(next) || next === 'firstRunWalkthrough' || screen === 'firstRunWalkthrough') {
      screenHistoryRef.current = [];
      return;
    }
    if (screen === next) return;
    screenHistoryRef.current = pushNavFrame(
      screenHistoryRef.current,
      { screen, tab: coerceMainTab(mainTab, 'scan') },
      next
    );
  }

  function goBackScreen() {
    const { previous, remaining } = popNavFrame(screenHistoryRef.current);
    screenHistoryRef.current = remaining;
    if (previous) {
      setMainTab(previous.tab);
      setScreen(previous.screen);
      const nextBottomTab = resolveBottomTabForScreen(previous.screen, previous.tab);
      if (nextBottomTab) setBottomTabState(nextBottomTab);
      return;
    }
    goToHub('scan');
  }

  function goToHub(tab: MainTab = mainTab) {
    const safeTab = coerceMainTab(tab, 'scan');
    screenHistoryRef.current = [];
    setMainTab(safeTab);
    setScreen(TAB_HUBS[safeTab]);
    const nextBottomTab = resolveBottomTabForScreen(TAB_HUBS[safeTab], safeTab);
    if (nextBottomTab) setBottomTabState(nextBottomTab);
  }

  function setBottomTab(next: BottomTab) {
    setBottomTabState(next);
    if (next === 'calculator') {
      setMainTab('analyzer');
      if (screen === 'liveMode' || screen === 'tacticsHub' || screen === 'scanHub' || screen === 'settingsHub') {
        beginNavigation('analyzerHub');
        setScreen('analyzerHub');
      }
      return;
    }

    beginNavigation('liveMode');
    setMainTab('tactics');
    setScreen('liveMode');
  }

  function getHeaderTitle() {
    if (screen === 'dealReview' && dealReviewEntryMode === 'budget') return 'Walk-away budget';
    return resolveScreenTitle(screen, bottomTab, mainTab);
  }

  function getHeaderSubtitle() {
    return resolveScreenSubtitle(screen, mainTab);
  }

  function preserveBudgetGuardrails(deal: DealState) {
    return {
      targetTotalPaid: deal.targetTotalPaid,
      downPayment: deal.downPayment,
      outsideLenderApr: deal.outsideLenderApr,
      outsideLenderTerm: deal.outsideLenderTerm,
      months: deal.months,
    };
  }

  function promptBudgetGate() {
    Alert.alert(
      'Set your budget first',
      'Complete Step 1: Budget in Sign Check before reviewing dealership quotes. This locks in your walk-away numbers.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Set budget', onPress: openBudgetSetup },
      ]
    );
  }

  function openDealReview(
    entryMode: DealReviewEntryMode = 'default',
    options?: { startOcr?: boolean; skipBudgetGate?: boolean }
  ) {
    if (!options?.skipBudgetGate && entryMode !== 'budget' && !isRoadmapBudgetComplete(appData)) {
      promptBudgetGate();
      return;
    }

    beginNavigation('dealReview');
    setMainTab('analyzer');
    setDealReviewEntryMode(entryMode);
    setScreen('dealReview');
    setBottomTabState('calculator');
    setDealReviewWizardStep(entryMode === 'budget' ? 'numbers' : 'import');

    if (options?.startOcr) {
      void pickQuotePhoto();
    }
  }

  function openScreen(next: Screen, tab?: MainTab) {
    if (!isScreen(next)) return;
    if (next === 'dealReview') {
      openDealReview('default');
      return;
    }
    beginNavigation(next);
    if (tab) setMainTab(tab);
    setScreen(next);
    const nextBottomTab = resolveBottomTabForScreen(next, tab ?? mainTab);
    if (nextBottomTab) setBottomTabState(nextBottomTab);
  }

  function applySituationHome(situation: (typeof appData.preferences)['buyerSituation'] = appData.preferences.buyerSituation) {
    const home = getHomeForSituation(situation);
    if (home.screen === 'liveMode' && !hasProAccess) {
      goToHub('scan');
      return;
    }
    if (home.screen === 'dealReview') {
      if (!isRoadmapBudgetComplete(appData)) {
        goToHub('scan');
        return;
      }
      openDealReview('default', { skipBudgetGate: true });
      setDealReviewWizardStep('details');
      return;
    }
    openScreen(home.screen, home.tab);
  }

  function completeFirstRunWalkthrough() {
    setAppData((prev) => appDataAfterWalkthrough(prev));
    goToHub('scan');
    trackEvent('first_run_walkthrough_complete', 'First-run walkthrough complete', 'Finished the walk-away explainer.');
  }

  function startWalkAwayFromWalkthrough() {
    setAppData((prev) => appDataAfterWalkthrough(prev));
    openBudgetSetup();
    trackEvent('first_run_walkthrough_complete', 'First-run walkthrough complete', 'Started real walk-away setup from the explainer.');
  }

  function openBudgetSetup() {
    beginNavigation('dealReview');
    setMainTab('analyzer');
    setDealReviewEntryMode('budget');
    setScreen('dealReview');
    setBottomTabState('calculator');
    trackEvent('budget_setup_opened', 'Budget setup opened', 'Opened free budget guardrails from the car buying roadmap.');
  }

  function openWhatIfLab() {
    if (!hasProAccess) {
      if (billingStoreUnavailable && isPremiumPreviewAllowed()) {
        promptPremiumPreview(() => openWhatIfLab());
        return;
      }
      void startPaywallPurchase(() => openWhatIfLab());
      return;
    }

    const suggested = buildSuggestedWhatIfDeal(appData.deal);
    setWhatIfDeal(cloneDealState(suggested.deal));
    setWhatIfSmartHeadline(suggested.headline);
    incrementUsage('whatIfRuns');
    trackEvent('what_if_opened', 'What-if lab opened', 'Opened the what-if lab with a smart counter scenario.');
    openScreen('whatIfLab', 'analyzer');
  }

  function openLiveDealershipMode() {
    if (!hasProAccess) {
      if (billingStoreUnavailable && isPremiumPreviewAllowed()) {
        promptPremiumPreview(() => openLiveDealershipMode());
        return;
      }
      void startPaywallPurchase(() => openLiveDealershipMode());
      return;
    }

    openScreen('liveMode', 'tactics');
  }

  function handleShieldNextStep() {
    switch (nextStepGuidance.stepId) {
      case 'checklist':
        openScreen('checklist', 'tactics');
        return;
      case 'budget':
        openBudgetSetup();
        return;
      case 'quickCheck':
        openDealReview('manual');
        return;
      case 'lotInspection':
        openLiveDealershipMode();
        return;
      case 'contractScan':
        openDealReview('ocr', { startOcr: true });
        return;
      case 'compare':
        openScreen('compareDeals', 'analyzer');
        return;
      default:
        if (!appData.preferences.onboardingComplete) {
          startGuidedBuyerSetup();
        }
        return;
    }
  }

  function applyEstimatorToDealReview(loanPrice: string, aprValue: string, monthsValue: number) {
    if (!isRoadmapBudgetComplete(appData)) {
      promptBudgetGate();
      return;
    }

    setAppData((prev) => ({
      ...prev,
      deal: {
        ...prev.deal,
        vehiclePrice: loanPrice,
        apr: aprValue,
        months: String(monthsValue),
      },
    }));
    openDealReview('default', { skipBudgetGate: true });
    trackEvent('estimator_applied', 'Estimator applied to deal review', 'Copied quick payment estimator values into deal review.');
  }

  function fillSampleQuote() {
    loadSampleDealDemo();
  }

  function toggleOcrConfirm(field: string) {
    setOcrConfirmedFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }

  function handleRoadmapStepPress(stepId: RoadmapStepId) {
    switch (stepId) {
      case 'budget':
        openBudgetSetup();
        return;
      case 'quickCheck':
        openDealReview('manual');
        return;
      case 'lotInspection':
        openLiveDealershipMode();
        return;
      case 'contractScan':
        openDealReview('ocr', { startOcr: true });
        return;
      default:
        return;
    }
  }

  function updateWhatIfDeal<K extends keyof DealState>(key: K, value: DealState[K]) {
    setWhatIfDeal((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetWhatIfDeal() {
    const suggested = buildSuggestedWhatIfDeal(appData.deal);
    setWhatIfDeal(cloneDealState(suggested.deal));
    setWhatIfSmartHeadline(suggested.headline);
  }

  function applyWhatIfDealToReview() {
    setAppData((prev) => ({
      ...prev,
      deal: cloneDealState(whatIfDeal),
    }));
    appendTimelineEntry('offerSaved', 'What-if scenario applied', 'Applied the current what-if lab scenario back into Deal review.');
    trackEvent('what_if_applied', 'Scenario applied to deal review', 'Applied a modeled scenario back into the active deal review.');
    Alert.alert('Scenario applied', 'The what-if scenario is now loaded into Deal review.');
    openDealReview('default');
  }

  function completeSigningCheckpoint() {
    incrementUsage('checkpointPasses');
    trackEvent('checkpoint_completed', 'Signing checkpoint completed', 'Marked the signing checkpoint as clean for this review.');
    Alert.alert('Checkpoint logged', 'This clean pre-sign review was added to your local product signals.');
  }

  function exportLocalBackup() {
    const backup = JSON.stringify(appData, null, 2);
    void copyText('Sign Check backup', backup);
    trackEvent('backup_exported', 'Local backup exported', 'Copied a full local backup of the current app state.');
  }

  function importLocalBackup() {
    if (!backupDraft.trim()) {
      Alert.alert('Paste a backup first', 'Paste the exported Sign Check backup JSON before trying to import it.');
      return;
    }

    try {
      const parsed = JSON.parse(backupDraft);
      const sanitized = sanitizeAppData(parsed);
      setAppData(sanitized);
      setBackupDraft('');
      trackEvent('backup_imported', 'Local backup imported', 'Imported a local backup into the current app state.');
      Alert.alert('Backup imported', 'The local backup was imported into this device.');
    } catch (error) {
      Alert.alert('Import failed', `That backup could not be imported: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }

  function startQuestionFlow(origin?: unknown) {
    const tab = coerceMainTab(origin, 'tactics');
    beginNavigation('questions');
    setQuestionIndex(0);
    setMainTab(tab);
    setScreen('questions');
  }

  function selectAnswer(value: string) {
    if (!currentQuestion) return;
    setAppData((prev) => ({
      ...prev,
      answers: { ...prev.answers, [currentQuestion.id]: value },
    }));
  }

  function toggleCheck(item: string) {
    setAppData((prev) => ({
      ...prev,
      checkedItems: { ...prev.checkedItems, [item]: !prev.checkedItems[item] },
    }));
  }

  function toggleNegotiationFlag(flag: NegotiationFlag) {
    const adding = !appData.negotiationFlags.includes(flag);
    setAppData((prev) => {
      if (prev.negotiationFlags.includes(flag)) return removeLotNegotiationFlag(prev, flag);
      return addLotNegotiationFlag(
        prev,
        flag,
        {
          id: makeId(),
          flag,
          dealershipName: prev.deal.dealershipName.trim() || 'Unnamed dealership',
          notedAt: new Date().toISOString(),
        },
        createTimelineEntry('pressureLogged', prev.deal.dealershipName, 'Pressure tactic logged', `${flag} was marked during the dealership session.`)
      );
    });
    if (adding) {
      incrementUsage('tacticsLogged');
      void completeClosedBetaStep('pressureLogged');
    }
  }

  function logDeskTactic(flag: NegotiationFlag) {
    toggleNegotiationFlag(flag);
  }

  function addPromiseRecord() {
    const text = promiseDraft.trim();
    if (!text) {
      Alert.alert('Add a promise first', 'Type the salesperson promise before saving it.');
      return;
    }
    if (isDuplicatePromise(appData.promises, text)) {
      Alert.alert('Already saved', 'That promise is already on the tracker.');
      return;
    }

    const newPromise: PromiseRecord = {
      id: makeId(),
      dealershipName: appData.deal.dealershipName.trim() || 'Unnamed dealership',
      text,
      status: 'open',
      notedAt: new Date().toISOString(),
      resolvedAt: null,
    };

    setAppData((prev) => ({
      ...prev,
      promises: [newPromise, ...prev.promises].slice(0, 100),
    }));
    appendTimelineEntry('promiseLogged', 'Promise logged', text, newPromise.dealershipName);
    setPromiseDraft('');
    Alert.alert('Promise saved', 'That promise is now on the tracker.');
  }

  function updatePromiseStatus(id: string, status: PromiseRecord['status']) {
    setAppData((prev) => ({
      ...prev,
      promises: prev.promises.map((promise) =>
        promise.id === id
          ? {
              ...promise,
              status,
              resolvedAt: status === 'open' ? null : new Date().toISOString(),
            }
          : promise
      ),
    }));
    appendTimelineEntry('promiseUpdated', 'Promise status updated', `Promise marked as ${status}.`);
  }

  function goNext() {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
      return;
    }
    completeQuestionFlow();
    if (mainTab === 'scan') {
      routeAfterQuestionFlow();
      return;
    }
    setScreen('result');
  }

  function goBack() {
    if (questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
      return;
    }
    goBackScreen();
  }

  async function copyText(label: string, text: string) {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied', `${label} copied to your clipboard.`);
    } catch {
      Alert.alert('Copy failed', `Could not copy ${label.toLowerCase()} right now. You can still read it on screen and share it manually.`);
    }
  }

  async function shareText(title: string, message: string) {
    try {
      await Share.share({ title, message });
    } catch {
      Alert.alert('Share failed', 'Could not open the share sheet right now. Try the copy button instead.');
    }
  }

  function saveCurrentDeal() {
    if (
      !appData.deal.vehiclePrice &&
      !appData.deal.dealerFees &&
      !appData.deal.addOns &&
      !appData.deal.apr &&
      appData.deal.feeItems.length === 0 &&
      appData.deal.addOnItems.length === 0
    ) {
      Alert.alert('Nothing to save', 'Enter deal details first, then save the offer for comparison.');
      return;
    }

    const loadedDeal = loadedDealId ? appData.savedDeals.find((item) => item.id === loadedDealId) ?? null : null;
    const normalizedDealer = appData.deal.dealershipName.trim().toLowerCase();
    const matchingSeries = normalizedDealer
      ? appData.savedDeals.find((item) => item.dealershipName.trim().toLowerCase() === normalizedDealer)
      : null;
    const seriesId = loadedDeal?.seriesId ?? matchingSeries?.seriesId ?? createSeriesId();
    const priorRevisions = appData.savedDeals.filter((item) => item.seriesId === seriesId);
    const revisionNumber = priorRevisions.length > 0 ? Math.max(...priorRevisions.map((item) => item.revisionNumber || 1)) + 1 : 1;

    const newDeal: SavedDeal = {
      ...appData.deal,
      id: makeId(),
      savedAt: new Date().toISOString(),
      dealershipName: appData.deal.dealershipName.trim() || `Saved offer ${appData.savedDeals.length + 1}`,
      seriesId,
      revisionNumber,
      basedOnDealId: loadedDeal?.id ?? priorRevisions[0]?.id ?? null,
    };

    setAppData((prev) => ({
      ...prev,
      savedDeals: [newDeal, ...prev.savedDeals].slice(0, 10),
      deal: {
        ...createInitialDeal(),
        buyerStateCode: prev.deal.buyerStateCode,
        ...preserveBudgetGuardrails(prev.deal),
      },
    }));
    incrementUsage('dealsSaved');
    appendTimelineEntry('offerSaved', 'Offer saved to timeline', `Saved revision ${revisionNumber} for ${newDeal.dealershipName}.`, newDeal.dealershipName);
    trackEvent('deal_saved', 'Offer saved', `Saved revision ${revisionNumber} for ${newDeal.dealershipName}.`);
    setLoadedDealId(null);

    Alert.alert(
      'Deal saved',
      revisionNumber > 1
        ? `Saved as revision ${revisionNumber} for this dealership timeline. The form cleared so you can enter the next quote.`
        : 'This offer is now available in Compare dealership offers. The form cleared so you can enter the next quote.'
    );
  }

  function openNewOfferReview() {
    setLoadedDealId(null);
    setDealReviewEntryMode('default');
    setPendingImport(null);
    setOcrConfirmedFields({});
    setEditableImportFields({});
    setEditableFeeItems([]);
    setEditableAddOnItems([]);
    setAppData((prev) => ({
      ...prev,
      deal: {
        ...createInitialDeal(),
        buyerStateCode: prev.deal.buyerStateCode,
        ...preserveBudgetGuardrails(prev.deal),
      },
    }));
    openDealReview('default', { skipBudgetGate: true });
    trackEvent('new_offer_started', 'New offer started', 'Opened a fresh deal review form for another dealership quote.');
  }

  function loadSavedDeal(id: string) {
    if (!isRoadmapBudgetComplete(appData)) {
      promptBudgetGate();
      return;
    }

    const found = appData.savedDeals.find((item) => item.id === id);
    if (!found) return;

    const { id: _id, savedAt: _savedAt, seriesId: _seriesId, revisionNumber: _revisionNumber, basedOnDealId: _basedOnDealId, ...rest } = found;
    setAppData((prev) => ({
      ...prev,
      deal: rest,
    }));
    setLoadedDealId(id);
    openDealReview('default', { skipBudgetGate: true });
  }

  function deleteSavedDeal(id: string) {
    setAppData((prev) => ({
      ...prev,
      savedDeals: prev.savedDeals.filter((item) => item.id !== id),
    }));
    setLoadedDealId((prev) => (prev === id ? null : prev));
    setSelectedComparePair((prev) => ({
      firstId: prev.firstId === id ? null : prev.firstId,
      secondId: prev.secondId === id ? null : prev.secondId,
    }));
  }

  function toggleComparePick(slot: 'firstId' | 'secondId', id: string) {
    setSelectedComparePair((prev) => {
      const currentValue = prev[slot];
      if (currentValue === id) return { ...prev, [slot]: null };
      const otherSlot = slot === 'firstId' ? 'secondId' : 'firstId';
      if (prev[otherSlot] === id) return prev;
      return { ...prev, [slot]: id };
    });
  }

  function confirmReset() {
    Alert.alert(
      'Reset app data?',
      'This will clear answers, notes, saved offers, checklist progress, and negotiation flags.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetStoredAppData();
            await clearUserRole();
            await clearFirstRunProfile();
            setPremiumPreviewMode(false);
            setShowPremiumPreviewBanner(false);
            setAppData(createInitialAppData());
            router.replace('/');
          },
        },
      ]
    );
  }

  const navigationApiRef = useRef({
    openScreen,
    goToHub,
    setBottomTab,
    getHeaderTitle,
    refreshBillingDiagnostics,
    getBillingDiagnostics: () => billingDiagnostics,
    getBillingDiagnosticsBusy: () => billingDiagnosticsBusy,
    startPaywallPurchase,
    restorePurchase,
    isPro: () => isPro,
    isPremiumPreview: () => isPremiumPreview,
    billingStoreUnavailable: () => billingStoreUnavailable,
    promptPremiumPreview,
  });
  navigationApiRef.current = {
    openScreen,
    goToHub,
    setBottomTab,
    getHeaderTitle,
    refreshBillingDiagnostics,
    getBillingDiagnostics: () => billingDiagnostics,
    getBillingDiagnosticsBusy: () => billingDiagnosticsBusy,
    startPaywallPurchase,
    restorePurchase,
    isPro: () => isPro,
    isPremiumPreview: () => isPremiumPreview,
    billingStoreUnavailable: () => billingStoreUnavailable,
    promptPremiumPreview,
  };

  useEffect(() => {
    if (!loaded) return;

    registerNavigation({
      openScreen: (nextScreen, tab) => navigationApiRef.current.openScreen(nextScreen, tab),
      goToHub: (tab) => navigationApiRef.current.goToHub(tab),
      setBottomTab: (tab) => navigationApiRef.current.setBottomTab(tab),
      getHeaderTitle: () => navigationApiRef.current.getHeaderTitle(),
      refreshBillingDiagnostics: () => navigationApiRef.current.refreshBillingDiagnostics(),
      getBillingDiagnostics: () => navigationApiRef.current.getBillingDiagnostics(),
      getBillingDiagnosticsBusy: () => navigationApiRef.current.getBillingDiagnosticsBusy(),
      startPaywallPurchase: () => navigationApiRef.current.startPaywallPurchase(),
      restorePurchase: () => navigationApiRef.current.restorePurchase(),
      isPro: () => navigationApiRef.current.isPro(),
      isPremiumPreview: () => navigationApiRef.current.isPremiumPreview(),
      billingStoreUnavailable: () => navigationApiRef.current.billingStoreUnavailable(),
      promptPremiumPreview: (onEnabled) => navigationApiRef.current.promptPremiumPreview(onEnabled),
    });

    return () => {
      registerNavigation(null);
    };
  }, [loaded, registerNavigation]);

  useEffect(() => {
    if (!loaded) return;
    bridge.setHeaderTitle(getHeaderTitle());
    bridge.setBillingDiagnostics(billingDiagnostics);
    bridge.setBillingDiagnosticsBusy(billingDiagnosticsBusy);
    bridge.setIsPro(isPro);
    bridge.setIsPremiumPreview(isPremiumPreview);
    bridge.setBillingStoreUnavailable(billingStoreUnavailable);
    bridge.setPromptPremiumPreview(promptPremiumPreview);
  }, [
    billingDiagnostics,
    billingDiagnosticsBusy,
    billingStoreUnavailable,
    bridge,
    isPremiumPreview,
    isPro,
    loaded,
    promptPremiumPreview,
    screen,
    mainTab,
    bottomTab,
  ]);

  useEffect(() => {
    if (!loaded) return;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [loaded, screen]);

  useEffect(() => {
    if (!loaded) return;
    bridge.setShowAdvancedNav(shouldShowAdvancedTools(appData, appData.preferences.walkthroughComplete));
  }, [appData, bridge, loaded]);

  useEffect(() => {
    if (!loaded) return;
    void refreshBillingDiagnostics();
  }, [loaded]);

  if (!loaded) {
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
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={SHIELD_THEME.gold} />
          <Text style={styles.heroText}>Loading your saved dealership prep data...</Text>
        </View>
      </View>
    );
  }

  const currentDealSummary = buildCurrentDealSummary(appData.deal, dealAnalysis);
  const negotiationPlanSummary = buildNegotiationPlanSummary(appData.deal, dealAnalysis, negotiationPlan);
  const paperworkAuditSummary = paperworkAudit ? buildPaperworkAuditSummary(appData.deal, paperworkAudit) : '';
  const dealInputGuidance = buildDealInputGuidance(appData.deal, dealConfidence);
  const whatIfSummary = [
    `Sign Check what-if lab${appData.deal.dealershipName ? `: ${appData.deal.dealershipName}` : ''}`,
    '',
    whatIfComparison.headline,
    whatIfComparison.detail,
    '',
    `Current monthly: ${currency(whatIfComparison.currentMonthlyPayment)}`,
    `Scenario monthly: ${currency(whatIfComparison.scenarioMonthlyPayment)}`,
    `Monthly change: ${whatIfComparison.monthlyDifference < 0 ? '-' : '+'}${currency(Math.abs(whatIfComparison.monthlyDifference))}`,
    `Current total paid: ${currency(whatIfComparison.currentTotalPaid)}`,
    `Scenario total paid: ${currency(whatIfComparison.scenarioTotalPaid)}`,
    `Total change: ${whatIfComparison.totalDifference < 0 ? '-' : '+'}${currency(Math.abs(whatIfComparison.totalDifference))}`,
    '',
    'Changed fields:',
    ...(whatIfComparison.fieldChanges.length
      ? whatIfComparison.fieldChanges.map((item) => `- ${item.label}: ${item.currentValue} -> ${item.scenarioValue}. ${item.impact}`)
      : ['- No fields changed yet.']),
    '',
    `Strongest move: ${whatIfComparison.strongestMove}`,
  ].join('\n');
  const secondOpinionShare = buildSecondOpinionShare(appData.deal, dealAnalysis, actionRecommendation, negotiationPlan);
  const referralLoop = buildReferralLoop(appData.deal, dealAnalysis, actionRecommendation, secondOpinionShare);
  const visitCaseSummary = buildVisitCaseSummary(appData.visitTimeline, appData.deal.dealershipName);
  const buyerReport = buildBuyerReport(
    appData.deal,
    dealAnalysis,
    dealConfidence,
    actionRecommendation,
    negotiationPlan,
    marketBenchmarkAssessment,
    tradeInAssessment,
    paperworkAudit
  );

  const headerTopPadding = getHeaderTopPadding(insets);
  const bottomTabPadding = getBottomTabPadding(insets);
  const bottomTabBarHeight = getBottomTabBarHeight(insets);

  hardwareBackRef.current = () => {
    const action = resolveHardwareBack({
      drawerOpen: bridge.drawerOpen,
      screen,
      questionIndex,
      canWalkthroughBack: false,
    });

    switch (action) {
      case 'closeDrawer':
        bridge.closeDrawer();
        return true;
      case 'walkthroughBack':
      case 'stay':
        return true;
      case 'questionBack':
        setQuestionIndex((prev) => Math.max(0, prev - 1));
        return true;
      case 'popScreen':
        goBackScreen();
        return true;
      case 'goShield':
        goToHub('scan');
        return true;
      default:
        return false;
    }
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.appShell}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.container, { paddingBottom: bottomTabBarHeight + 16 }]}
        >
          <View style={{ paddingTop: headerTopPadding }}>
            <Header
              title={getHeaderTitle()}
              subtitle={getHeaderSubtitle()}
              planStatus={isPro ? 'pro' : isPremiumPreview ? 'preview' : 'free'}
              billingBusy={billingBusy}
              onMenuPress={bridge.openDrawer}
              onBackPress={HUB_SCREENS.has(screen) || screen === 'firstRunWalkthrough' ? undefined : () => goBackScreen()}
              onUpgradePress={() => void startPaywallPurchase()}
              onPreviewPress={exitPremiumPreview}
              onResetPress={confirmReset}
            />
          </View>

          {shouldShowClosedBetaWelcome(closedBetaChecklist) && WELCOME_CARD_SCREENS.has(screen) && screen !== 'firstRunWalkthrough' ? (
            <ClosedBetaWelcomeCard
              checklist={closedBetaChecklist}
              onLoadSampleDeal={loadSampleDealDemo}
              onOpenLotCoach={openLotCoachFromChecklist}
              onLogPressure={openLiveModeFromChecklist}
              onSendFeedback={openClosedBetaFeedback}
              onDismiss={() => void handleDismissClosedBetaWelcome()}
            />
          ) : null}

          {screen === 'firstRunWalkthrough' && (
            <FirstRunWalkthrough
              onSetNumber={startWalkAwayFromWalkthrough}
              onSkip={completeFirstRunWalkthrough}
            />
          )}

          {screen === 'scanHub' && (
            <ScanHubContent
              onboardingComplete={appData.preferences.onboardingComplete}
              experienceMode={experienceMode}
              headline={onboardingSummary.headline}
              detail={onboardingSummary.detail}
              checklistProgress={checklistProgress}
              nextStep={nextStepGuidance}
              roadmapSteps={carBuyingRoadmap.steps}
              onFirstTimeBuyer={enableFirstTimeBuyerMode}
              onExperiencedBuyer={startExperiencedBuyerSetup}
              onUpdateSetup={startGuidedBuyerSetup}
              onDisableFirstTimeMode={disableFirstTimeBuyerMode}
              onNextStep={handleShieldNextStep}
              onOpenChecklist={() => openScreen('checklist', 'tactics')}
              onRoadmapStepPress={handleRoadmapStepPress}
              onPaywall={() => void startPaywallPurchase()}
              hideSetupCard={appData.preferences.walkthroughComplete}
            />
          )}

          {screen === 'analyzerHub' && (
            <AnalyzerHubContent
              isPro={hasProAccess}
              budgetComplete={budgetStepComplete}
              savedOfferCount={appData.savedDeals.length}
              watchedVehicleCount={appData.watchedVehicles.length}
              capRows={capVsQuote}
              onUseEstimatorInDealReview={applyEstimatorToDealReview}
              onOpenDealReview={() => openDealReview('default')}
              onOpenCompare={() => openScreen('compareDeals', 'analyzer')}
              onOpenWatchlist={() => openScreen('watchlist', 'analyzer')}
              onOpenWhatIfLab={openWhatIfLab}
              onOpenFinanceDefense={() => openScreen('financeDefense', 'analyzer')}
              onPaywall={() => void startPaywallPurchase()}
              onBudgetGate={promptBudgetGate}
              showAdvancedTools={shouldShowAdvancedTools(appData, appData.preferences.walkthroughComplete)}
            />
          )}

        {screen === 'tacticsHub' && (
          <>
            <Card>
              <StatusBadge
                label={readinessLabel === 'Strong' ? 'Ready to negotiate' : readinessLabel === 'Almost Ready' ? 'Some weak spots' : 'At risk'}
                tone={readinessLabel === 'Strong' ? 'good' : readinessLabel === 'Almost Ready' ? 'warn' : 'bad'}
              />
              <View style={styles.stackGap}>
                <View style={styles.proLockedButtonWrap}>
                  {!hasProAccess ? (
                    <View style={styles.proPreviewBadgeCorner}>
                      <ProFeatureBadge unlocked={false} />
                    </View>
                  ) : null}
                  <AppButton
                    label={hasProAccess ? 'I am at the dealership now' : 'Unlock live dealership mode'}
                    onPress={() => void openLiveDealershipMode()}
                  />
                </View>
                <AppButton label="Start readiness check" variant="secondary" onPress={() => startQuestionFlow()} />
              </View>
            </Card>
            <View style={styles.stackGap}>
              <FeatureMenuCard
                title="Session playbook"
                description="Get a step-by-step visit plan for live negotiations so you know what to say and ask in order."
                requiresPro
                isPremium={hasProAccess}
                onPress={openLiveDealershipMode}
                onPaywall={() => void startPaywallPurchase()}
              />
              <FeatureMenuCard
                title="Trap library"
                description="Learn common dealership tactics and what to say back."
                isPremium={hasProAccess}
                onPress={() => openScreen('traps', 'tactics')}
                onPaywall={() => void startPaywallPurchase()}
              />
              <FeatureMenuCard
                title="Sales tactic decoder"
                description="Tap what the salesperson said and get instant coaching on how to respond."
                isPremium={hasProAccess}
                onPress={() => openScreen('tacticDecoder', 'tactics')}
                onPaywall={() => void startPaywallPurchase()}
              />
              <FeatureMenuCard
                title="Buyer checklist"
                description="Know what to bring and what to verify before signing."
                isPremium={hasProAccess}
                onPress={() => openScreen('checklist', 'tactics')}
                onPaywall={() => void startPaywallPurchase()}
              />
            </View>
          </>
        )}

        {screen === 'settingsHub' && (
          <>
            <Card>
              <View style={styles.stackGap}>
                <AppButton label="Privacy policy" variant="secondary" onPress={() => void openExternalLink(getPrivacyPolicyUrl(), 'Privacy policy')} />
                <AppButton label="Terms and disclaimer" variant="secondary" onPress={() => void openExternalLink(getLegalDisclaimerUrl(), 'Terms and disclaimer')} />
              </View>
            </Card>

            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.menuTitle}>Sign Check Pro</Text>
                <StatusBadge
                  label={isPro ? 'Pro active' : isPremiumPreview ? 'Premium Preview' : 'Free plan'}
                  tone={isPro ? 'good' : isPremiumPreview ? 'warn' : 'warn'}
                />
              </View>
              <Text style={styles.detailText}>{monetizationSummary.headline}</Text>
              <Text style={styles.detailText}>{monetizationSummary.detail}</Text>
              {!isPro && savingsOpportunity.estimatedSavings > 0 ? (
                <Text style={styles.detailText}>
                  This deal could cost about {currency(savingsOpportunity.estimatedSavings)} more than a cleaner structure. Pro tools help you push back with scripts and modeling.
                </Text>
              ) : null}
              {!isPro ? (
                <>
                  <AppButton label={upgradeCtaLabel} onPress={() => void startPaywallPurchase()} disabled={billingBusy} />
                  <Text style={styles.detailText}>{LIFETIME_PRO_PURCHASE_NOTE}</Text>
                </>
              ) : null}
            </Card>

            <FreeVsProComparison
              title={isPro ? 'Your plan includes' : 'Free vs Pro'}
              showLifetimeIncluded
              showPurchaseNote={isPro}
              isPro={hasProAccess}
              onLockedFeaturePress={handleLockedFeaturePress}
            />
            <AnalyticsFunnelCard steps={analyticsFunnel} completionRate={funnelCompletionRate} />

            <View style={styles.stackGap}>
              <FeatureMenuCard
                title="Pro details and restore"
                description="Review premium tools, restore purchases, and manage billing status."
                isPremium={hasProAccess}
                onPress={() => openScreen('upgradeHub', 'settings')}
                onPaywall={() => void startPaywallPurchase()}
              />
              <FeatureMenuCard
                title="Dealership notes"
                description="Keep quotes, promises, and red flags in one private notebook."
                isPremium={hasProAccess}
                onPress={() => openScreen('notes', 'settings')}
                onPaywall={() => void startPaywallPurchase()}
              />
            </View>

          </>
        )}

        {screen === 'questions' && currentQuestion ? (
          <Card>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionLabel}>{experienceMode === 'firstTimeBuyer' ? 'First-time buyer setup' : 'Readiness check'}</Text>
              <Text style={styles.sectionLabel}>
                {questionIndex + 1} / {questions.length}
              </Text>
            </View>
            <ProgressBar value={((questionIndex + 1) / questions.length) * 100} />
            <Text style={styles.questionTitle}>{currentQuestion.title}</Text>
            <Text style={styles.questionSubtitle}>
              {experienceMode === 'firstTimeBuyer'
                ? `${currentQuestion.subtitle} This helps the app explain whether the dealership numbers are reasonable.`
                : currentQuestion.subtitle}
            </Text>

            <View style={styles.stackGap}>
              {currentQuestion.options.map((option) => {
                const active = appData.answers[currentQuestion.id] === option;
                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => selectAnswer(option)}
                    activeOpacity={0.85}
                    style={[styles.optionButton, active && styles.optionButtonActive]}
                  >
                    <Text style={active ? styles.optionTextActive : styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.doubleButtons}>
              <View style={styles.flexOne}>
                <AppButton label="Back" variant="secondary" onPress={goBack} />
              </View>
              <View style={styles.flexOne}>
                <AppButton label={questionIndex === questions.length - 1 ? 'See result' : 'Next'} onPress={goNext} disabled={!appData.answers[currentQuestion.id]} />
              </View>
            </View>
          </Card>
        ) : null}

        {screen === 'questions' && !currentQuestion ? (
          <Card>
            <Text style={styles.menuTitle}>Readiness check</Text>
            <Text style={styles.heroText}>That check could not load. Go back and try it again from Tactician Guide.</Text>
            <AppButton label="Back" variant="secondary" onPress={goBackScreen} />
          </Card>
        ) : null}

        {screen === 'result' && (
          <>
            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.heroTitle}>Your readiness: {readinessLabel}</Text>
                <StatusBadge label={readinessLabel} tone={readinessLabel === 'Strong' ? 'good' : readinessLabel === 'Almost Ready' ? 'warn' : 'bad'} />
              </View>
              <Text style={styles.heroText}>Score: {readiness.score} / {readiness.max}</Text>
              <ProgressBar value={(readiness.score / readiness.max) * 100} />
              {experienceMode === 'firstTimeBuyer' ? (
                <View style={styles.infoBox}>
                  <Text style={styles.bold}>What this means</Text>
                  <Text style={styles.infoBoxText}>
                    Strong means you are less likely to be pushed around. Almost Ready means you can still improve leverage. Not Ready means the dealership may have more room to control the conversation.
                  </Text>
                </View>
              ) : null}

              <Text style={styles.subheading}>What to fix first</Text>
              <View style={styles.stackGapSmall}>
                {readiness.missing.map((item) => (
                  <View key={item} style={styles.warningRow}>
                    <Text style={styles.warningBullet}>•</Text>
                    <Text style={styles.warningText}>{item}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card>
              <Text style={styles.subheading}>Recommended next step</Text>
              <Text style={styles.detailText}>{readinessNextAction.description}</Text>
              <AppButton label={readinessNextAction.label} onPress={handleReadinessNextAction} />
            </Card>

            <View style={styles.stackGap}>
              <AppButton label="Car buying roadmap" variant="secondary" onPress={() => goToHub('scan')} />
              <AppButton label="Checklist" variant="secondary" onPress={() => openScreen('checklist', 'tactics')} />
              <AppButton label="Deal review" variant="secondary" onPress={() => openScreen('dealReview', 'analyzer')} />
            </View>
          </>
        )}

        {screen === 'traps' && (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.screenTitle}>Trap library</Text>
              <TouchableOpacity onPress={goBackScreen}>
                <Text style={styles.linkText}>Back</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.stackGap}>
              {trapCards.map((trap) => (
                <Card key={trap.title}>
                  <Text style={styles.menuTitle}>{trap.title}</Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.bold}>What it looks like: </Text>
                    {trap.danger}
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.bold}>Why it matters: </Text>
                    {trap.why}
                  </Text>
                  <View style={styles.scriptBox}>
                    <Text style={styles.detailText}>
                      <Text style={styles.bold}>What to say: </Text>
                      &ldquo;{trap.response}&rdquo;
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          </>
        )}

        {screen === 'checklist' && (
          <>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.screenTitle}>Dealership checklist</Text>
                <Text style={styles.sectionLabel}>
                  {completedCount} of {checklistCount} completed
                </Text>
              </View>
              <TouchableOpacity onPress={goBackScreen}>
                <Text style={styles.linkText}>Back</Text>
              </TouchableOpacity>
            </View>
            <ProgressBar value={checklistProgress} />

            <View style={styles.stackGap}>
              {checklistSections.map((section) => (
                <Card key={section.title}>
                  <Text style={styles.menuTitle}>{section.title}</Text>
                  <View style={styles.stackGapSmall}>
                    {section.items.map((item) => {
                      const checked = !!appData.checkedItems[item];
                      return (
                        <TouchableOpacity
                          key={item}
                          onPress={() => toggleCheck(item)}
                          activeOpacity={0.85}
                          style={[styles.checkItem, checked && styles.checkItemActive]}
                        >
                          <Text style={checked ? styles.checkMarkActive : styles.checkMark}>{checked ? '✓' : '○'}</Text>
                          <Text style={checked ? styles.checkTextActive : styles.checkText}>{item}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Card>
              ))}
            </View>
          </>
        )}

        {screen === 'liveMode' && !hasProAccess ? (
          <PremiumPreviewCard
            title="Live dealership mode"
            detail="Get live coaching, pressure tracking, honesty scoring, and a step-by-step session playbook while you are sitting at the lot."
            showPreviewOption={canOfferPremiumPreview && billingStoreUnavailable}
            onPreview={() => promptPremiumPreview(() => openLiveDealershipMode())}
            onPaywall={() => void startPaywallPurchase()}
          />
        ) : null}

        {screen === 'liveMode' && hasProAccess ? (
          <Card>
            <DeskHud
              action={actionRecommendation.action}
              capRows={capVsQuote}
              onLogTactic={logDeskTactic}
            />

            <LotCoachCard
              context={lotCoachContext}
              onTrack={(detail) => trackEvent('lot_coach_question', 'Lot Coach question', detail)}
              onAnswered={() => void completeClosedBetaStep('lotCoachAsked')}
            />

            <AppButton
              label={appData.lotCheckClear ? 'No red flags saved' : 'No red flags'}
              variant={appData.lotCheckClear ? 'secondary' : 'primary'}
              onPress={() => {
                setAppData((prev) => markLotCheckClear(prev));
                trackEvent('lot_check_clear', 'No red flags', 'Physical lot check completed with no dealer red flags.');
                goToHub('scan');
              }}
            />

            <View style={styles.deskSectionRow}>
              {(
                [
                  ['flags', 'Flags'],
                  ['coaching', 'Coaching'],
                  ['score', 'Score'],
                  ['visit', 'Visit'],
                ] as const
              ).map(([id, label]) => {
                const selected = deskSection === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.deskSectionChip, selected && styles.deskSectionChipSelected]}
                    onPress={() => setDeskSection((current) => (current === id ? null : id))}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.deskSectionChipText, selected && styles.deskSectionChipTextSelected]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {deskSection === 'score' ? (
              <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Readiness</Text>
                <Text style={styles.statValue}>{readinessLabel}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Checklist done</Text>
                <Text style={styles.statValue}>{checklistProgress}%</Text>
              </View>
            </View>

            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.menuTitle}>Dealer honesty score</Text>
                <StatusBadge label={`${honestyScore.score}/100`} tone={honestyScore.tone} />
              </View>
              <Text style={styles.detailText}>{honestyScore.label}</Text>
              <ProgressBar value={honestyScore.score} />
              <View style={styles.stackGapSmall}>
                {honestyScore.notes.map((note) => (
                  <Text key={note} style={styles.detailText}>
                    • {note}
                  </Text>
                ))}
              </View>
            </Card>

            <Card>
              <Text style={styles.menuTitle}>Why the honesty score moved</Text>
              <ScoreBreakdown items={honestyScore.breakdown.map((item) => ({ ...item, tone: item.delta >= 0 ? 'good' : Math.abs(item.delta) >= 10 ? 'bad' : 'warn' }))} />
            </Card>
              </>
            ) : null}

            {deskSection === 'visit' ? (
              <>
            <Card>
              <Text style={styles.menuTitle}>Dealer pressure log</Text>
              <Text style={styles.detailText}>{pressureSummary.headline}</Text>
              <View style={styles.stackGapSmall}>
                {pressureSummary.notes.map((note) => (
                  <Text key={note} style={styles.detailText}>
                    • {note}
                  </Text>
                ))}
              </View>
              <Text style={styles.subheading}>Recent incidents</Text>
              <View style={styles.stackGapSmall}>
                {pressureSummary.recent.length > 0 ? (
                  pressureSummary.recent.map((incident) => (
                    <View key={incident.id} style={styles.infoBox}>
                      <Text style={styles.bold}>{incident.dealershipName}</Text>
                      <Text style={styles.infoBoxText}>{incident.flag}</Text>
                      <Text style={styles.infoBoxText}>{new Date(incident.notedAt).toLocaleString()}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.detailText}>No incidents logged yet. Open Flags when a tactic happens and this record will build automatically.</Text>
                )}
              </View>
            </Card>

            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.menuTitle}>Live dealership flow</Text>
                <StatusBadge label={guidedSessionFlow.currentStepLabel} tone="warn" />
              </View>
              <Text style={styles.detailText}>{guidedSessionFlow.headline}</Text>
              <View style={styles.stackGapSmall}>
                {guidedSessionFlow.steps.map((step) => (
                  <View key={step.title} style={styles.infoBox}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.bold}>{step.title}</Text>
                      <StatusBadge label={step.status === 'done' ? 'Done' : step.status === 'active' ? 'Now' : 'Later'} tone={step.status === 'done' ? 'good' : step.status === 'active' ? 'warn' : 'bad'} />
                    </View>
                    <Text style={styles.infoBoxText}>{step.detail}</Text>
                  </View>
                ))}
              </View>
            </Card>

            {hasProAccess ? (
              <Card>
                <View style={styles.proFeatureHeader}>
                  <Text style={styles.menuTitle}>Session playbook</Text>
                  <ProFeatureBadge unlocked />
                </View>
                <Text style={styles.detailText}>{sessionPlaybook.headline}</Text>
                <View style={styles.stackGapSmall}>
                  {sessionPlaybook.steps.map((step, index) => (
                    <View key={`${step.title}-${index}`} style={styles.infoBox}>
                      <Text style={styles.bold}>
                        Step {index + 1}: {step.title}
                      </Text>
                      <Text style={styles.infoBoxText}>{step.detail}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ) : (
              <PremiumPreviewCard
                title="Session playbook"
                detail="At the lot, pressure moves fast and it's easy to forget what to ask next. Sign Check Pro turns your deal into a step-by-step visit plan—what to say first, which numbers to push, the questions to ask, and what to verify before you sign."
                showPreviewOption={canOfferPremiumPreview && billingStoreUnavailable}
                onPreview={() => promptPremiumPreview(() => openLiveDealershipMode())}
                onPaywall={() => void startPaywallPurchase()}
              />
            )}
              </>
            ) : null}

            {deskSection === 'coaching' ? (
              <>
            <Card>
              <Text style={styles.menuTitle}>Live coaching</Text>
              <Text style={styles.detailText}>{liveCoachingPlan.headline}</Text>
              <View style={styles.scriptBox}>
                <Text style={styles.detailText}>
                  <Text style={styles.bold}>Say this now: </Text>
                  {liveCoachingPlan.immediateScript}
                </Text>
              </View>
              <Text style={styles.subheading}>Ask next</Text>
              <View style={styles.stackGapSmall}>
                {liveCoachingPlan.nextQuestions.map((question) => (
                  <Text key={question} style={styles.detailText}>
                    • {question}
                  </Text>
                ))}
              </View>
              <Text style={styles.subheading}>Walk away if</Text>
              <View style={styles.stackGapSmall}>
                {liveCoachingPlan.walkAwayTriggers.map((trigger) => (
                  <Text key={trigger} style={styles.warningText}>
                    • {trigger}
                  </Text>
                ))}
              </View>
            </Card>

            <Card>
              <Text style={styles.menuTitle}>Live response pack</Text>
              <Text style={styles.detailText}>{liveResponsePack.headline}</Text>
              <View style={styles.stackGapSmall}>
                {liveResponsePack.responses.map((item) => (
                  <View key={item.label} style={styles.infoBox}>
                    <Text style={styles.bold}>{item.label}</Text>
                    <Text style={styles.infoBoxText}>{item.script}</Text>
                    <Text style={styles.infoBoxText}>{item.reason}</Text>
                  </View>
                ))}
              </View>
            </Card>
              </>
            ) : null}

            {deskSection === 'flags' ? (
            <Card>
              <Text style={styles.menuTitle}>Pressure tactic tracker</Text>
              <View style={styles.stackGapSmall}>
                {negotiationFlagItems.map((flag) => {
                  const active = appData.negotiationFlags.includes(flag.id);
                  return (
                    <TouchableOpacity
                      key={flag.id}
                      activeOpacity={0.85}
                      onPress={() => toggleNegotiationFlag(flag.id)}
                      style={[styles.flagCard, active && styles.flagCardActive]}
                    >
                      <Text style={active ? styles.menuTitleActive : styles.menuTitle}>{flag.label}</Text>
                      <Text style={active ? styles.detailTextActive : styles.detailText}>{flag.meaning}</Text>
                      <Text style={active ? styles.detailTextActive : styles.detailText}>
                        <Text style={styles.bold}>Response: </Text>
                        {flag.response}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>
            ) : null}
          </Card>
        ) : null}

        {screen === 'dealReview' && (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.screenTitle}>{dealReviewEntryMode === 'budget' ? 'Budget setup' : 'Deal review'}</Text>
              <TouchableOpacity onPress={() => (dealReviewEntryMode === 'budget' ? goToHub('scan') : goBackScreen())}>
                <Text style={styles.linkText}>{dealReviewEntryMode === 'budget' ? 'Roadmap' : 'Back'}</Text>
              </TouchableOpacity>
            </View>

            {showPremiumPreviewBanner ? (
              <Card>
                <View style={styles.rowBetween}>
                  <Text style={styles.menuTitle}>Premium Preview Mode</Text>
                  <StatusBadge label="Review" tone="warn" />
                </View>
                <Text style={styles.detailText}>{PREMIUM_PREVIEW_DISCLAIMER}</Text>
                <View style={styles.doubleButtons}>
                  <View style={styles.flexOne}>
                    <AppButton label="Continue preview" variant="secondary" onPress={() => setShowPremiumPreviewBanner(false)} />
                  </View>
                  <View style={styles.flexOne}>
                    <AppButton label="Exit preview" variant="secondary" onPress={exitPremiumPreview} />
                  </View>
                </View>
              </Card>
            ) : null}

            {showProActivatedBanner ? (
              <Card>
                <View style={styles.rowBetween}>
                  <Text style={styles.menuTitle}>Sign Check Pro active</Text>
                  <StatusBadge label="Unlocked" tone="good" />
                </View>
                <Text style={styles.detailText}>Sign Check Pro tools are unlocked on this device.</Text>
                <AppButton label="Continue" variant="secondary" onPress={() => setShowProActivatedBanner(false)} />
              </Card>
            ) : null}

            {dealReviewEntryMode === 'budget' ? (
              <Card>
                <Text style={styles.menuTitle}>Set your budget guardrails</Text>
                <Text style={styles.heroText}>
                  {experienceMode === 'firstTimeBuyer'
                    ? 'Lock in your walk-away numbers before a salesperson sets them for you. You only need a target total paid or a down payment, APR, and loan term.'
                    : 'Model your payment ceiling and total paid limit before you visit the lot. Save a target total paid or your down payment, outside lender APR, and term.'}
                </Text>
                <DealInput
                  label="Your walk-away total (all-in)"
                  value={appData.deal.targetTotalPaid}
                  onChangeText={(text) => updateDeal('targetTotalPaid', text)}
                  placeholder="28500"
                />
                <Text style={styles.fieldHint}>This is your personal ceiling — not Sign Check’s suggested counter.</Text>
                <DealInput label="Down payment" value={appData.deal.downPayment} onChangeText={(text) => updateDeal('downPayment', text)} placeholder="3000" />
                <DealInput
                  label={experienceMode === 'firstTimeBuyer' ? 'The rate your bank or credit union offered' : 'Outside lender APR'}
                  value={appData.deal.outsideLenderApr}
                  onChangeText={(text) => updateDeal('outsideLenderApr', text)}
                  placeholder="5.9"
                />
                <DealInput
                  label="Outside lender term (months)"
                  value={appData.deal.outsideLenderTerm}
                  onChangeText={(text) => updateDeal('outsideLenderTerm', text)}
                  placeholder="60"
                />
                <DealInput label="Loan term (months)" value={appData.deal.months} onChangeText={(text) => updateDeal('months', text)} placeholder="60" />
                <View style={styles.stackGap}>
                  <AppButton
                    label="Save and return to roadmap"
                    onPress={() => {
                      if (!isRoadmapBudgetComplete(appData)) {
                        Alert.alert(
                          'Budget still incomplete',
                          'Add a walk-away total, or down payment + outside APR + loan term, then save. You can keep editing here without leaving this screen.'
                        );
                        return;
                      }
                      goToHub('scan');
                    }}
                  />
                  <AppButton
                    label="Clear budget fields"
                    variant="secondary"
                    onPress={() => {
                      Alert.alert('Clear budget?', 'This clears your walk-away total and related budget fields. You will stay on this screen.', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Clear',
                          style: 'destructive',
                          onPress: () => {
                            updateDeal('targetTotalPaid', '');
                            updateDeal('outsideLenderApr', '');
                            updateDeal('outsideLenderTerm', '');
                          },
                        },
                      ]);
                    }}
                  />
                  {hasProAccess ? (
                    <AppButton label="Open What-if Lab (Pro)" variant="secondary" onPress={() => void openWhatIfLab()} />
                  ) : null}
                </View>
              </Card>
            ) : null}

            {dealReviewEntryMode !== 'budget' && !budgetStepComplete ? (
              <Card>
                <StatusBadge label="Step 1 required" tone="warn" />
                <Text style={styles.menuTitle}>Set your budget first</Text>
                <Text style={styles.heroText}>
                  Complete Step 1: Budget in Sign Check before reviewing dealership quotes. Your budget guardrails keep every quote check anchored to what you can actually afford.
                </Text>
                <View style={styles.stackGap}>
                  <AppButton label="Set your budget" onPress={openBudgetSetup} />
                  <AppButton label="Back to roadmap" variant="secondary" onPress={() => goToHub('scan')} />
                </View>
              </Card>
            ) : null}

            {dealReviewEntryMode !== 'budget' && budgetStepComplete ? (
              <>
            <DealReviewStepper step={dealReviewWizardStep} onSelect={setDealReviewWizardStep} />
            {dealReviewWizardStep === 'import' ? (
            <>
            {dealReviewEntryMode === 'manual' ? (
              <Card>
                <Text style={styles.menuTitle}>Quick manual quote check</Text>
                <Text style={styles.heroText}>
                  Enter the numbers from your quote below. Sign Check will analyze price, fees, APR, and total exposure without opening the camera.
                </Text>
              </Card>
            ) : null}

            {dealReviewEntryMode !== 'manual' ? (
              <Card>
                <Text style={styles.menuTitle}>Paste quote text</Text>
                <Text style={styles.heroText}>
                  {experienceMode === 'firstTimeBuyer'
                    ? 'Paste a text message or email quote, or take a photo. Sign Check will pull out the important numbers.'
                    : 'Paste a worksheet, text message, or email quote. Sign Check will try to pull out price, APR, term, trade, and fee/add-on lines.'}
                </Text>
                <View style={styles.infoBox}>
                  <Text style={styles.bold}>Best results</Text>
                  <Text style={styles.infoBoxText}>Use a flat, printed quote with strong lighting and a tight crop. Handwritten notes can work, but they usually need review and manual correction.</Text>
                  <Text style={styles.infoBoxText}>If a handwritten worksheet misses key fields, import what it can, then add the missing numbers in the confirmation step before applying.</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.bold}>Capture tips</Text>
                  <Text style={styles.infoBoxText}>Try to keep labels explicit: `Price`, `APR`, `Term`, `Down payment` or `DP`, and `Trade` are the easiest for OCR to recover.</Text>
                  <Text style={styles.infoBoxText}>Printed buyer orders, emailed worksheets, and texted screenshots will usually beat handwriting for accuracy.</Text>
                </View>
                <TextInput
                  style={styles.notesInput}
                  value={appData.deal.importedQuoteText}
                  onChangeText={(text) => updateDeal('importedQuoteText', text)}
                  placeholder="Example:\nDealer: Metro Auto\nSelling price: $25,995\nDoc fee: $499\nProtection package: $1,295\nAPR: 8.9%\nTerm: 72 months\nTrade allowance: $6,000"
                  placeholderTextColor="#94a3b8"
                  multiline
                  textAlignVertical="top"
                />
                <View style={styles.doubleButtons}>
                  <View style={styles.flexOne}>
                    <AppButton label="Import quote" onPress={importQuoteIntoDeal} />
                  </View>
                  <View style={styles.flexOne}>
                    <AppButton label="Clear pasted text" variant="secondary" onPress={() => updateDeal('importedQuoteText', '')} />
                  </View>
                </View>
                <View style={styles.doubleButtons}>
                  <View style={styles.flexOne}>
                    <AppButton label="Choose quote photo" variant="secondary" onPress={() => void pickQuotePhoto()} />
                  </View>
                  <View style={styles.flexOne}>
                    <AppButton
                      label={isRunningPhotoOcr ? 'Reading photo...' : 'Run OCR from photo'}
                      onPress={() => void runPhotoOcrImport()}
                      disabled={isRunningPhotoOcr || !appData.deal.importedPhotoUri}
                    />
                  </View>
                </View>
                {appData.deal.importedPhotoUri ? (
                  <View style={styles.stackGapSmall}>
                    <Image source={{ uri: appData.deal.importedPhotoUri }} style={styles.quotePreview} resizeMode="cover" />
                    <Text style={styles.detailText}>
                      {Platform.OS === 'web'
                        ? 'Selected photo is ready for OCR.'
                        : Constants.appOwnership === 'expo'
                          ? 'Selected photo preview is saved. To run OCR on your phone, open this app in a rebuilt development build instead of Expo Go.'
                          : 'Selected photo is ready for native ML Kit OCR in this development build.'}
                    </Text>
                    <AppButton label="Remove photo" variant="secondary" onPress={removeQuotePhoto} />
                  </View>
                ) : null}
                {appData.deal.importReviewNotes.length > 0 && (
                  <>
                    <Text style={styles.subheading}>Import review</Text>
                    <View style={styles.stackGapSmall}>
                      {appData.deal.importReviewNotes.map((note) => (
                        <Text key={note} style={styles.detailText}>
                          • {note}
                        </Text>
                      ))}
                    </View>
                  </>
                )}
              </Card>
            ) : null}

            {pendingImport && pendingImport.matchedFields.length > 0 && (
              <Card>
                <Text style={styles.menuTitle}>Confirm extracted values</Text>
                <Text style={styles.heroText}>Review these OCR results before applying them to the deal. Medium-confidence fields were cleaned up from likely OCR mistakes.</Text>
                {pendingImport.missingFields.length > 0 && (
                  <View style={styles.infoBox}>
                    <Text style={styles.bold}>Still missing</Text>
                    <Text style={styles.infoBoxText}>{pendingImport.missingFields.join(', ')}</Text>
                    <Text style={styles.infoBoxText}>If the image was handwritten or low contrast, fill these manually after applying the imported draft.</Text>
                  </View>
                )}
                <OcrConfirmChips
                  fields={pendingImport.fieldReviews}
                  confirmedFields={ocrConfirmedFields}
                  onToggleConfirm={toggleOcrConfirm}
                />
                <View style={styles.stackGapSmall}>
                  {pendingImport.fieldReviews.map((item) => (
                    <View key={`${item.field}-${item.value}`} style={styles.infoBox}>
                      <DealInput
                        label={`${item.field} (${item.confidence === 'high' ? 'high confidence' : 'needs review'})`}
                        value={editableImportFields[item.field] ?? item.value}
                        onChangeText={(text) => updateEditableImportField(item.field, text)}
                        placeholder={item.field}
                        numeric={item.field !== 'Dealership name'}
                      />
                      <Text style={styles.infoBoxText}>
                        Confidence: {item.confidence === 'high' ? 'High' : 'Needs review'}
                      </Text>
                      <Text style={styles.infoBoxText}>{item.note}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.stackGap}>
                  <Text style={styles.subheading}>Review extracted fee lines</Text>
                  {editableFeeItems.length === 0 ? (
                    <Text style={styles.detailText}>No fee lines were detected automatically.</Text>
                  ) : (
                    editableFeeItems.map((item) => (
                      <View key={item.id} style={styles.infoBox}>
                        <DealInput label="Fee label" value={item.label} onChangeText={(text) => updateEditableLineItem('fee', item.id, 'label', text)} placeholder="Doc fee" numeric={false} />
                        <DealInput label="Fee amount" value={item.amount} onChangeText={(text) => updateEditableLineItem('fee', item.id, 'amount', text)} placeholder="499" />
                        {getLineItemReview('fee', item.id) ? (
                          <>
                            <Text style={styles.infoBoxText}>
                              Confidence: {getLineItemReview('fee', item.id)?.confidence === 'high' ? 'High' : 'Needs review'}
                            </Text>
                            <Text style={styles.infoBoxText}>{getLineItemReview('fee', item.id)?.note}</Text>
                          </>
                        ) : (
                          <Text style={styles.infoBoxText}>Added manually during review.</Text>
                        )}
                        <TouchableOpacity onPress={() => removeEditableLineItem('fee', item.id)} activeOpacity={0.85}>
                          <Text style={styles.removeText}>Remove fee line</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                  <TouchableOpacity onPress={() => addEditableLineItem('fee')} activeOpacity={0.85}>
                    <Text style={styles.linkText}>Add fee line</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.stackGap}>
                  <Text style={styles.subheading}>Review extracted add-on lines</Text>
                  {editableAddOnItems.length === 0 ? (
                    <Text style={styles.detailText}>No add-on lines were detected automatically.</Text>
                  ) : (
                    editableAddOnItems.map((item) => (
                      <View key={item.id} style={styles.infoBox}>
                        <DealInput label="Add-on label" value={item.label} onChangeText={(text) => updateEditableLineItem('addon', item.id, 'label', text)} placeholder="Protection package" numeric={false} />
                        <DealInput label="Add-on amount" value={item.amount} onChangeText={(text) => updateEditableLineItem('addon', item.id, 'amount', text)} placeholder="1295" />
                        {getLineItemReview('addon', item.id) ? (
                          <>
                            <Text style={styles.infoBoxText}>
                              Confidence: {getLineItemReview('addon', item.id)?.confidence === 'high' ? 'High' : 'Needs review'}
                            </Text>
                            <Text style={styles.infoBoxText}>{getLineItemReview('addon', item.id)?.note}</Text>
                          </>
                        ) : (
                          <Text style={styles.infoBoxText}>Added manually during review.</Text>
                        )}
                        <TouchableOpacity onPress={() => removeEditableLineItem('addon', item.id)} activeOpacity={0.85}>
                          <Text style={styles.removeText}>Remove add-on line</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                  <TouchableOpacity onPress={() => addEditableLineItem('addon')} activeOpacity={0.85}>
                    <Text style={styles.linkText}>Add add-on line</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.doubleButtons}>
                  <View style={styles.flexOne}>
                    <AppButton label="Apply extracted values" onPress={applyPendingImport} />
                  </View>
                  <View style={styles.flexOne}>
                    <AppButton
                      label="Dismiss review"
                      variant="secondary"
                      onPress={dismissPendingImport}
                    />
                  </View>
                </View>
              </Card>
            )}

            {ocrRecovery ? (
              <Card>
                <Text style={styles.menuTitle}>OCR recovery help</Text>
                <Text style={styles.detailText}>{ocrRecovery.headline}</Text>
                <Text style={styles.detailText}>{ocrRecovery.detail}</Text>
                {ocrRecovery.lowConfidenceFields.length > 0 ? (
                  <>
                    <Text style={styles.subheading}>Low-confidence fields</Text>
                    <View style={styles.stackGapSmall}>
                      {ocrRecovery.lowConfidenceFields.map((item) => (
                        <Text key={item} style={styles.detailText}>
                          • {item}
                        </Text>
                      ))}
                    </View>
                  </>
                ) : null}
                <View style={styles.stackGapSmall}>
                  {ocrRecovery.suggestions.map((item) => (
                    <Text key={item} style={styles.detailText}>
                      • {item}
                    </Text>
                  ))}
                </View>
              </Card>
            ) : null}

            <View style={styles.stackGap}>
              <AppButton label="Type the 4 numbers instead" onPress={() => setDealReviewWizardStep('numbers')} />
            </View>
            </>
            ) : null}

            {dealReviewWizardStep === 'numbers' ? (
              <Card>
                <Text style={styles.menuTitle}>Confirm these 4 numbers</Text>
                <Text style={styles.heroText}>
                  {experienceMode === 'firstTimeBuyer'
                    ? 'You only need price, down payment, the interest rate (APR), and how many months the loan lasts.'
                    : 'Confirm vehicle price, down payment, APR, and term. Add fees on the next step if you have them.'}
                </Text>
                <DealInput label="Vehicle price" value={appData.deal.vehiclePrice} onChangeText={(text) => updateDeal('vehiclePrice', text)} placeholder="25000" />
                <DealInput label="Down payment" value={appData.deal.downPayment} onChangeText={(text) => updateDeal('downPayment', text)} placeholder="3000" />
                <DealInput label="Interest rate (APR)" value={appData.deal.apr} onChangeText={(text) => updateDeal('apr', text)} placeholder="6.9" />
                <DealInput label="Loan length in months" value={appData.deal.months} onChangeText={(text) => updateDeal('months', text)} placeholder="60" />
                <View style={styles.stackGap}>
                  <AppButton label="See the verdict" onPress={() => setDealReviewWizardStep('verdict')} />
                  <AppButton label="Add fees and extras" variant="secondary" onPress={() => setDealReviewWizardStep('details')} />
                  <AppButton label="Back" variant="secondary" onPress={() => setDealReviewWizardStep('import')} />
                </View>
              </Card>
            ) : null}

            {dealReviewWizardStep === 'details' ? (
            <>
            <Card>
              <Text style={styles.menuTitle}>Offer details</Text>
              <DealInput label="Dealership name" value={appData.deal.dealershipName} onChangeText={(text) => updateDeal('dealershipName', text)} placeholder="Example Auto Group" numeric={false} />

              <Text style={styles.inputLabel}>State context</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stateChipRow}>
                {stateOptions.map((option) => {
                  const active = appData.deal.buyerStateCode === option.code;
                  return (
                    <TouchableOpacity
                      key={option.code || 'none'}
                      activeOpacity={0.85}
                      onPress={() => updateDeal('buyerStateCode', option.code)}
                      style={[styles.stateChip, active && styles.stateChipActive]}
                    >
                      <Text style={active ? styles.stateChipTextActive : styles.stateChipText}>{option.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <Text style={styles.detailText}>{dealAnalysis.stateContext}</Text>

              <DealInput label="Vehicle price" value={appData.deal.vehiclePrice} onChangeText={(text) => updateDeal('vehiclePrice', text)} placeholder="25000" />
              <DealInput label="Sales tax" value={appData.deal.salesTax} onChangeText={(text) => updateDeal('salesTax', text)} placeholder="1560" />
              {appData.deal.buyerStateCode ? (
                <View style={styles.stackGapSmall}>
                  <AppButton
                    label="Estimate sales tax from state"
                    variant="secondary"
                    onPress={() => {
                      const estimate = estimateStateSalesTax(appData.deal.buyerStateCode, appData.deal.vehiclePrice);
                      if (!estimate) {
                        Alert.alert(
                          'Need a vehicle price',
                          'Enter the vehicle price first, then Sign Check can estimate sales tax from your selected state.'
                        );
                        return;
                      }
                      updateDeal('salesTax', estimate.amount);
                      Alert.alert('Sales tax estimate applied', `${estimate.label} ≈ ${currency(estimate.amount)}. ${STATE_SALES_TAX_DISCLAIMER}`);
                    }}
                  />
                  <Text style={styles.fieldHint}>{STATE_SALES_TAX_DISCLAIMER}</Text>
                </View>
              ) : (
                <Text style={styles.fieldHint}>Select a state above to estimate sales tax from the vehicle price.</Text>
              )}
              <DealInput
                label="Researched market price"
                value={appData.deal.marketVehiclePrice}
                onChangeText={(text) => updateDeal('marketVehiclePrice', text)}
                placeholder="23500"
              />
              <DealInput
                label="Comparable listing prices"
                value={appData.deal.marketComparablePricesText}
                onChangeText={(text) => updateDeal('marketComparablePricesText', text)}
                placeholder="22995, 23450, 23990"
                numeric={false}
                multiline
              />
              <DealInput
                label="Outside lender APR"
                value={appData.deal.outsideLenderApr}
                onChangeText={(text) => updateDeal('outsideLenderApr', text)}
                placeholder="5.9"
              />
              <DealInput
                label="Outside lender term"
                value={appData.deal.outsideLenderTerm}
                onChangeText={(text) => updateDeal('outsideLenderTerm', text)}
                placeholder="60"
              />
              <DealInput
                label="Your walk-away total (all-in)"
                value={appData.deal.targetTotalPaid}
                onChangeText={(text) => updateDeal('targetTotalPaid', text)}
                placeholder="28500"
              />
              <Text style={styles.fieldHint}>Your personal ceiling from budget setup. Sign Check may also suggest a separate negotiate-toward number on the verdict screen.</Text>
              <LineItemEditor
                title="Fee line items"
                items={appData.deal.feeItems}
                onChange={(id, key, value) => updateDealLineItem('feeItems', id, key, value)}
                onAdd={() => addDealLineItem('feeItems')}
                onRemove={(id) => removeDealLineItem('feeItems', id)}
              />
              <Text style={styles.detailText}>Structured fee total: {currency(getFeeTotal(appData.deal))}</Text>
              {appData.deal.feeItems.every((item) => !Number(item.amount || 0)) ? (
                <DealInput
                  label="Fee total only (if you don’t have a breakdown yet)"
                  value={appData.deal.dealerFees}
                  onChangeText={(text) => updateDeal('dealerFees', text)}
                  placeholder="995"
                />
              ) : (
                <Text style={styles.fieldHint}>Using fee line items above. Clear amounts on those lines if you only know a single fee total.</Text>
              )}
              <LineItemEditor
                title="Add-on line items"
                items={appData.deal.addOnItems}
                onChange={(id, key, value) => updateDealLineItem('addOnItems', id, key, value)}
                onAdd={() => addDealLineItem('addOnItems')}
                onRemove={(id) => removeDealLineItem('addOnItems', id)}
              />
              <Text style={styles.detailText}>Structured add-on total: {currency(getAddOnTotal(appData.deal))}</Text>
              {appData.deal.addOnItems.every((item) => !Number(item.amount || 0)) ? (
                <DealInput
                  label="Add-ons total only (if you don’t have a breakdown yet)"
                  value={appData.deal.addOns}
                  onChangeText={(text) => updateDeal('addOns', text)}
                  placeholder="0"
                />
              ) : (
                <Text style={styles.fieldHint}>Using add-on line items above.</Text>
              )}
              <DealInput label="Down payment" value={appData.deal.downPayment} onChangeText={(text) => updateDeal('downPayment', text)} placeholder="3000" />
              <DealInput label="Trade-in value" value={appData.deal.tradeIn} onChangeText={(text) => updateDeal('tradeIn', text)} placeholder="4000" />
              <DealInput
                label="Outside trade benchmark"
                value={appData.deal.tradeReferenceValue}
                onChangeText={(text) => updateDeal('tradeReferenceValue', text)}
                placeholder="6500"
              />
              <Text style={styles.fieldHint}>
                Trade Equity Audit: Compares the dealer&apos;s trade-in offer against independent valuation benchmarks to ensure you aren&apos;t underpaid for your current vehicle.
              </Text>
              <DealInput
                label="Trade payoff balance"
                value={appData.deal.tradePayoff}
                onChangeText={(text) => updateDeal('tradePayoff', text)}
                placeholder="5200"
              />
              <DealInput label="APR" value={appData.deal.apr} onChangeText={(text) => updateDeal('apr', text)} placeholder="6.9" />
              <DealInput label="Loan term in months" value={appData.deal.months} onChangeText={(text) => updateDeal('months', text)} placeholder="60" />
              <DealInput
                label="Offer-specific notes"
                value={appData.deal.offerNotes}
                onChangeText={(text) => updateDeal('offerNotes', text)}
                placeholder="Manager special, hidden package, promised to remove etching tomorrow."
                numeric={false}
                multiline
              />
            </Card>

            <Card>
              <Text style={styles.menuTitle}>Contract photo audit</Text>
              <Text style={styles.detailText}>Choose a buyer&apos;s order or contract photo and let Sign Check prefill the paperwork audit from OCR before you sign.</Text>
              <View style={styles.doubleButtons}>
                <View style={styles.flexOne}>
                  <AppButton label="Choose contract photo" variant="secondary" onPress={() => void pickContractPhoto()} />
                </View>
                <View style={styles.flexOne}>
                  <AppButton
                    label={isRunningContractOcr ? 'Reading contract...' : 'Run contract OCR'}
                    onPress={() => void runContractOcrImport()}
                    disabled={isRunningContractOcr || !appData.deal.contractImportedPhotoUri}
                  />
                </View>
              </View>
              {appData.deal.contractImportedPhotoUri ? (
                <View style={styles.stackGapSmall}>
                  <Image source={{ uri: appData.deal.contractImportedPhotoUri }} style={styles.quotePreview} resizeMode="cover" />
                  <Text style={styles.detailText}>Selected contract photo is ready for OCR and paperwork audit review.</Text>
                  <AppButton label="Remove photo" variant="secondary" onPress={removeContractPhoto} />
                </View>
              ) : null}
              {appData.deal.contractImportReviewNotes.length > 0 ? (
                <View style={styles.stackGapSmall}>
                  {appData.deal.contractImportReviewNotes.map((note) => (
                    <Text key={note} style={styles.detailText}>
                      • {note}
                    </Text>
                  ))}
                </View>
              ) : null}
            </Card>

            {showContractScanResults && dealShieldAuditDashboard.flaggedCount > 0 ? (
              hasProAccess ? (
                <View style={styles.auditDashboardShell}>
                  <Card>
                    <View style={styles.auditDashboardHeader}>
                      <Text style={styles.auditDashboardTitle}>⚠️ SIGN CHECK AUDIT: AUDITED ITEMS</Text>
                      <ProFeatureBadge unlocked />
                    </View>
                    <Text style={styles.auditDashboardSubtitle}>
                      Sign Check flagged {dealShieldAuditDashboard.flaggedCount} common dealership markup
                      {dealShieldAuditDashboard.flaggedCount === 1 ? '' : 's'} in your scanned contract text.
                    </Text>
                    <View style={styles.stackGapSmall}>
                      {dealShieldAuditDashboard.items.map((item) => (
                        <View key={item.id} style={styles.auditDashboardItem}>
                          <View style={styles.rowBetween}>
                            <Text style={styles.auditDashboardItemLabel}>{item.label}</Text>
                            <Text style={styles.auditDashboardItemCost}>{item.costLabel}</Text>
                          </View>
                          <Text style={styles.auditDashboardItemExplanation}>{item.explanation}</Text>
                          <Text style={styles.auditDashboardItemTip}>
                            <Text style={styles.bold}>Removal tip: </Text>
                            {item.removalTip}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                </View>
              ) : (
                <PremiumPreviewCard
                  title="Sign Check Audit Dashboard"
                  detail={`We detected ${dealShieldAuditDashboard.flaggedCount} common dealership markup${dealShieldAuditDashboard.flaggedCount === 1 ? '' : 's'} in your contract scan—including items like etching, nitrogen, prep fees, or protection plans. Unlock Pro to see each fee, what it really is, and exactly how to request removal before signing.`}
                  onPaywall={() => void startPaywallPurchase()}
                />
              )
            ) : null}

            {pendingContractImport ? (
              <Card>
                <Text style={styles.menuTitle}>Confirm imported contract fields</Text>
                <Text style={styles.detailText}>Review these OCR values before they are applied to the final paperwork audit.</Text>
                <DealInput label="Contract vehicle price" value={editableContractFields.contractVehiclePrice ?? ''} onChangeText={(text) => updateEditableContractField('contractVehiclePrice', text)} placeholder="25000" />
                <DealInput label="Contract fees" value={editableContractFields.contractFees ?? ''} onChangeText={(text) => updateEditableContractField('contractFees', text)} placeholder="995" />
                <DealInput label="Contract add-ons" value={editableContractFields.contractAddOns ?? ''} onChangeText={(text) => updateEditableContractField('contractAddOns', text)} placeholder="0" />
                <DealInput label="Contract down payment" value={editableContractFields.contractDownPayment ?? ''} onChangeText={(text) => updateEditableContractField('contractDownPayment', text)} placeholder="3000" />
                <DealInput label="Contract trade-in" value={editableContractFields.contractTradeIn ?? ''} onChangeText={(text) => updateEditableContractField('contractTradeIn', text)} placeholder="4000" />
                <DealInput label="Contract APR" value={editableContractFields.contractApr ?? ''} onChangeText={(text) => updateEditableContractField('contractApr', text)} placeholder="6.9" />
                <DealInput label="Contract term" value={editableContractFields.contractMonths ?? ''} onChangeText={(text) => updateEditableContractField('contractMonths', text)} placeholder="60" />
                <View style={styles.doubleButtons}>
                  <View style={styles.flexOne}>
                    <AppButton label="Apply contract values" onPress={applyPendingContractImport} />
                  </View>
                  <View style={styles.flexOne}>
                    <AppButton label="Dismiss" variant="secondary" onPress={dismissPendingContractImport} />
                  </View>
                </View>
              </Card>
            ) : null}

            {contractOcrRecovery ? (
              <Card>
                <Text style={styles.menuTitle}>Contract OCR recovery help</Text>
                <Text style={styles.detailText}>{contractOcrRecovery.headline}</Text>
                <Text style={styles.detailText}>{contractOcrRecovery.detail}</Text>
                <View style={styles.stackGapSmall}>
                  {contractOcrRecovery.suggestions.map((item) => (
                    <Text key={item} style={styles.detailText}>
                      • {item}
                    </Text>
                  ))}
                </View>
              </Card>
            ) : null}

            <Card>
              <Text style={styles.menuTitle}>Final paperwork audit</Text>
              <Text style={styles.detailText}>Before signing, enter the numbers from the buyer&apos;s order or finance contract here. Sign Check will compare them against the reviewed offer and flag late changes.</Text>
              <Text style={styles.detailText}>If OCR misses something, the manual fields below are still the source of truth for the audit.</Text>
              <DealInput label="Contract vehicle price" value={appData.deal.contractVehiclePrice} onChangeText={(text) => updateDeal('contractVehiclePrice', text)} placeholder="25000" />
              <DealInput label="Contract fees" value={appData.deal.contractFees} onChangeText={(text) => updateDeal('contractFees', text)} placeholder="995" />
              <DealInput label="Contract add-ons" value={appData.deal.contractAddOns} onChangeText={(text) => updateDeal('contractAddOns', text)} placeholder="0" />
              <DealInput label="Contract down payment" value={appData.deal.contractDownPayment} onChangeText={(text) => updateDeal('contractDownPayment', text)} placeholder="3000" />
              <DealInput label="Contract trade-in" value={appData.deal.contractTradeIn} onChangeText={(text) => updateDeal('contractTradeIn', text)} placeholder="4000" />
              <DealInput label="Contract APR" value={appData.deal.contractApr} onChangeText={(text) => updateDeal('contractApr', text)} placeholder="6.9" />
              <DealInput label="Contract term" value={appData.deal.contractMonths} onChangeText={(text) => updateDeal('contractMonths', text)} placeholder="60" />

              {paperworkAudit ? (
                <>
                  <View style={styles.rowBetween}>
                    <Text style={styles.subheading}>Audit result</Text>
                    <StatusBadge
                      label={
                        paperworkAudit.summaryTone === 'bad'
                          ? 'Review contract'
                          : paperworkAudit.items.some((item) => item.tone === 'good' && !item.detail.startsWith('Matches'))
                            ? 'Improved offer'
                            : 'Matches offer'
                      }
                      tone={paperworkAudit.summaryTone}
                    />
                  </View>
                  <Text style={styles.detailText}>{paperworkAudit.headline}</Text>
                  <View style={styles.stackGapSmall}>
                    {paperworkAudit.items.map((item) => (
                      <View key={item.label} style={styles.infoBox}>
                        <View style={styles.rowBetween}>
                          <Text style={styles.bold}>{item.label}</Text>
                          <StatusBadge
                            label={item.tone === 'bad' ? 'Worse' : item.detail.startsWith('Matches') ? 'Match' : 'Better'}
                            tone={item.tone}
                          />
                        </View>
                        <Text style={styles.infoBoxText}>Reviewed: {item.expectedValue}</Text>
                        <Text style={styles.infoBoxText}>Contract: {item.contractValue}</Text>
                        <Text style={styles.infoBoxText}>{item.detail}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.stackGap}>
                    <AppButton
                      label="Copy paperwork audit"
                      variant="secondary"
                      onPress={() => {
                        appendTimelineEntry('paperworkChecked', 'Paperwork audit copied', 'Copied the paperwork audit summary for review.');
                        void copyText('Paperwork audit', paperworkAuditSummary);
                      }}
                    />
                    <AppButton
                      label="Share paperwork audit"
                      onPress={() => {
                        appendTimelineEntry('paperworkChecked', 'Paperwork audit shared', 'Shared the paperwork audit summary.');
                        void shareText('Sign Check paperwork audit', paperworkAuditSummary);
                      }}
                    />
                  </View>
                </>
              ) : (
                <Text style={styles.detailText}>Enter any contract numbers above to start the audit.</Text>
              )}
            </Card>

            <PaperworkSignatureGate
              readiness={signingReadiness}
              onShareAudit={() => {
                appendTimelineEntry('paperworkChecked', 'Paperwork audit shared', 'Shared the paperwork audit summary.');
                void shareText('Sign Check paperwork audit', paperworkAuditSummary);
              }}
              onCheckpoint={completeSigningCheckpoint}
            />

            <View style={styles.stackGap}>
              <AppButton label="See the verdict" onPress={() => setDealReviewWizardStep('verdict')} />
              <AppButton label="Back" variant="secondary" onPress={() => setDealReviewWizardStep('numbers')} />
            </View>
            </>
            ) : null}

            {dealReviewWizardStep === 'verdict' ? (
            <>
            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.menuTitle}>Deal savings counter</Text>
                <StatusBadge
                  label={savingsOpportunity.estimatedSavings > 0 ? currency(savingsOpportunity.estimatedSavings) : 'Protect deal'}
                  tone={savingsOpportunity.tone}
                />
              </View>
              <Text style={styles.detailText}>{savingsOpportunity.headline}</Text>
              <Text style={styles.detailText}>{savingsOpportunity.detail}</Text>
              <View style={styles.scriptBox}>
                <Text style={styles.detailText}>
                  <Text style={styles.bold}>Move to try next: </Text>
                  {savingsOpportunity.strongestLever}
                </Text>
              </View>
            </Card>

            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.menuTitle}>Savings proved</Text>
                <StatusBadge label={savingsProof.totalProtectedEstimate > 0 ? currency(savingsProof.totalProtectedEstimate) : 'Trust layer'} tone={savingsProof.totalProtectedEstimate > 0 ? 'good' : 'warn'} />
              </View>
              <Text style={styles.detailText}>{savingsProof.headline}</Text>
              <Text style={styles.detailText}>{savingsProof.detail}</Text>
              <View style={styles.stackGapSmall}>
                {savingsProof.proofPoints.map((item) => (
                  <Text key={item} style={styles.detailText}>
                    • {item}
                  </Text>
                ))}
              </View>
            </Card>

            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.menuTitle}>Offer verdict</Text>
                <StatusBadge label={dealAnalysis.dealVerdict} tone={dealAnalysis.dealGradeTone} />
              </View>
              <Text style={styles.detailText}>{dealAnalysis.dealGuidance}</Text>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Financed</Text>
                  <Text style={styles.statValue}>{currency(dealAnalysis.amountFinanced)}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Monthly</Text>
                  <Text style={styles.statValue}>{currency(dealAnalysis.monthlyPayment)}</Text>
                </View>
              </View>
              <MathDisclaimer />

              {showSecondOpinionCta ? (
                <Card>
                  <Text style={styles.menuTitle}>Get a second opinion before you sign</Text>
                  <Text style={styles.detailText}>
                    This offer flagged {dealAnalysis.dealVerdict.toLowerCase()}. Share a summary with someone you trust or copy the buyer report before moving forward.
                  </Text>
                  <View style={styles.stackGap}>
                    <AppButton
                      label="Share offer summary"
                      onPress={() => void shareText('Sign Check offer review', currentDealSummary)}
                    />
                    {hasProAccess ? (
                      <AppButton
                        label="Share buyer report"
                        variant="secondary"
                        onPress={() => {
                          incrementUsage('reportsShared');
                          void shareText('Sign Check buyer report', buyerReport);
                        }}
                      />
                    ) : (
                      <AppButton label="Unlock shareable buyer report" variant="secondary" onPress={() => void startPaywallPurchase()} />
                    )}
                  </View>
                </Card>
              ) : null}

              <Text style={styles.subheading}>Why this score happened</Text>
              <ScoreBreakdown items={dealAnalysis.scoreBreakdown} />

              <Text style={styles.subheading}>Fee review</Text>
              <View style={styles.stackGapSmall}>
                {dealAnalysis.flaggedFees.length ? (
                  dealAnalysis.flaggedFees.map((fee) => (
                    <View key={fee.key} style={styles.infoBox}>
                      <Text style={styles.bold}>{fee.label}</Text>
                      <Text style={styles.infoBoxText}>{fee.reason}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.detailText}>No suspicious fee keywords were detected from the current fee notes.</Text>
                )}
              </View>

              {dealAnalysis.dealWarnings.length > 0 && (
                <>
                  <Text style={styles.subheading}>Warnings</Text>
                  <View style={styles.stackGapSmall}>
                    {dealAnalysis.dealWarnings.map((warning) => (
                      <View key={warning} style={styles.warningRow}>
                        <Text style={styles.warningBullet}>•</Text>
                        <Text style={styles.warningText}>{warning}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              <View style={styles.stackGap}>
                <AppButton label={saveOfferLabel} onPress={saveCurrentDeal} />
                <AppButton label="Add another offer" variant="secondary" onPress={openNewOfferReview} />
                <View style={styles.proLockedButtonWrap}>
                  {!hasProAccess ? (
                    <View style={styles.proPreviewBadgeCorner}>
                      <ProFeatureBadge unlocked={false} />
                    </View>
                  ) : null}
                  <AppButton
                    label={hasProAccess ? 'Open what-if lab' : 'Unlock what-if lab'}
                    variant="secondary"
                    onPress={() => void openWhatIfLab()}
                  />
                </View>
                <AppButton label="Copy offer summary" variant="secondary" onPress={() => void copyText('Offer summary', currentDealSummary)} />
                <AppButton label="Share offer summary" variant="secondary" onPress={() => void shareText('Sign Check offer review', currentDealSummary)} />
              </View>
            </Card>

            {hasProAccess ? (
              <Card>
                <View style={styles.proFeatureHeader}>
                  <Text style={styles.menuTitle}>Shareable buyer report</Text>
                  <ProFeatureBadge unlocked />
                </View>
                <Text style={styles.detailText}>Package the deal, confidence level, market benchmark, trade fairness, recommendation, and paperwork audit into one clean summary for someone else to review.</Text>
                <View style={styles.stackGap}>
                  <AppButton
                    label="Copy buyer report"
                    variant="secondary"
                    onPress={() => {
                      incrementUsage('reportsShared');
                      void copyText('Buyer report', buyerReport);
                    }}
                  />
                  <AppButton
                    label="Share buyer report"
                    onPress={() => {
                      incrementUsage('reportsShared');
                      appendTimelineEntry('reportShared', 'Buyer report shared', 'Shared the full buyer report with someone else.');
                      void shareText('Sign Check buyer report', buyerReport);
                    }}
                  />
                  <AppButton label="Export buyer case file PDF" variant="secondary" onPress={() => void exportBuyerCasePdf()} />
                </View>
              </Card>
            ) : (
              <PremiumPreviewCard
                title="Shareable buyer report"
                detail="The free second-opinion text is a quick heads-up. Sign Check Pro packages the full picture—verdict, recommended move, negotiation plan, market and trade checks, and paperwork gaps—into one report you can text, share, or export as a PDF before anyone signs."
                onPaywall={() => void startPaywallPurchase()}
              />
            )}

            <Card>
              <Text style={styles.menuTitle}>Second-opinion share</Text>
              <Text style={styles.detailText}>
                Turn this deal into a short message you can send to someone you trust before you sign. Copy it to your clipboard or open your phone&apos;s share sheet.
              </Text>
              <View style={styles.doubleButtons}>
                <View style={styles.flexOne}>
                  <AppButton
                    label="Copy"
                    variant="secondary"
                    onPress={() => {
                      incrementUsage('referralShares');
                      appendTimelineEntry('referralShared', 'Second-opinion summary copied', 'Copied the fast second-opinion text for outside review.');
                      void copyText('Second-opinion text', secondOpinionShare);
                    }}
                  />
                </View>
                <View style={styles.flexOne}>
                  <AppButton
                    label="Share"
                    onPress={() => {
                      incrementUsage('referralShares');
                      appendTimelineEntry('referralShared', 'Second-opinion summary shared', 'Shared the fast second-opinion message with someone else.');
                      void shareText('Help me review this deal', secondOpinionShare);
                    }}
                  />
                </View>
              </View>
            </Card>

            <Card>
              <Text style={styles.menuTitle}>Invite someone else into Sign Check</Text>
              <Text style={styles.detailText}>{referralLoop.headline}</Text>
              <Text style={styles.detailText}>{referralLoop.detail}</Text>
              <View style={styles.stackGap}>
                <AppButton
                  label="Share invite message"
                  variant="secondary"
                  onPress={() => {
                    incrementUsage('referralShares');
                    appendTimelineEntry('referralShared', 'Invite message shared', 'Shared a Sign Check invite after the second-opinion flow.');
                    void shareText('Try Sign Check', referralLoop.inviteMessage);
                  }}
                />
              </View>
            </Card>

            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.menuTitle}>Deal confidence</Text>
                <StatusBadge label={`${dealConfidence.score}%`} tone={dealConfidence.tone} />
              </View>
              <Text style={styles.detailText}>{dealConfidence.label}</Text>
              <ProgressBar value={dealConfidence.score} />
              <Text style={styles.detailText}>{dealConfidence.detail}</Text>
              {dealConfidence.missingFields.length > 0 ? (
                <>
                  <Text style={styles.subheading}>Still missing</Text>
                  <View style={styles.stackGapSmall}>
                    {dealConfidence.missingFields.map((item) => (
                      <Text key={item} style={styles.detailText}>
                        • {item}
                      </Text>
                    ))}
                  </View>
                </>
              ) : null}
            </Card>

            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.menuTitle}>Ask for these next</Text>
                <StatusBadge label={dealInputGuidance.questions.length === 0 ? 'Covered' : `${dealInputGuidance.questions.length} left`} tone={dealInputGuidance.tone} />
              </View>
              <Text style={styles.detailText}>{dealInputGuidance.headline}</Text>
              <Text style={styles.detailText}>{dealInputGuidance.detail}</Text>
              {dealInputGuidance.questions.length > 0 ? (
                <>
                  <View style={styles.stackGapSmall}>
                    {dealInputGuidance.questions.map((item) => (
                      <View key={item.label} style={styles.infoBox}>
                        <Text style={styles.bold}>{item.label}</Text>
                        <Text style={styles.infoBoxText}>{item.question}</Text>
                        <Text style={styles.infoBoxText}>{item.reason}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.stackGap}>
                    <AppButton
                      label="Copy next questions"
                      variant="secondary"
                      onPress={() =>
                        void copyText(
                          'Next questions',
                          [
                            'Questions to ask the dealership next:',
                            '',
                            ...dealInputGuidance.questions.map((item) => `- ${item.question}`),
                          ].join('\n')
                        )
                      }
                    />
                  </View>
                </>
              ) : (
                <Text style={styles.detailText}>You already have enough written structure for a stronger review. Now focus on negotiating the weak spots or checking the final contract.</Text>
              )}
            </Card>

            <Card>
              <Text style={styles.menuTitle}>Negotiation memory</Text>
              <Text style={styles.detailText}>{personalizedInsight.headline}</Text>
              <Text style={styles.detailText}>{personalizedInsight.detail}</Text>
              <View style={styles.stackGapSmall}>
                {personalizedInsight.bullets.map((item) => (
                  <Text key={item} style={styles.detailText}>
                    • {item}
                  </Text>
                ))}
              </View>
            </Card>

            {marketBenchmarkAssessment && (
              <Card>
                <View style={styles.rowBetween}>
                  <Text style={styles.menuTitle}>Market benchmark</Text>
                  <StatusBadge
                    label={
                      marketBenchmarkAssessment.tone === 'good'
                        ? 'Near target'
                        : marketBenchmarkAssessment.tone === 'bad'
                          ? 'Above target'
                          : 'Counter range'
                    }
                    tone={marketBenchmarkAssessment.tone}
                  />
                </View>
                <Text style={styles.detailText}>{marketBenchmarkAssessment.headline}</Text>
                <Text style={styles.detailText}>{marketBenchmarkAssessment.detail}</Text>
                <View style={styles.statsRow}>
                  {appData.deal.marketVehiclePrice ? (
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>Price gap</Text>
                      <Text style={styles.statValue}>{currency(Math.abs(marketBenchmarkAssessment.vehiclePriceGap))}</Text>
                    </View>
                  ) : null}
                  {appData.deal.targetTotalPaid ? (
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>Total gap</Text>
                      <Text style={styles.statValue}>{currency(Math.abs(marketBenchmarkAssessment.totalPaidGap))}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.scriptBox}>
                  <Text style={styles.detailText}>
                    <Text style={styles.bold}>Say this: </Text>
                    {marketBenchmarkAssessment.negotiationScript}
                  </Text>
                </View>
              </Card>
            )}

            {marketCompSnapshot ? (
              <Card>
                <Text style={styles.menuTitle}>Live market benchmarks</Text>
                <Text style={styles.detailText}>{marketCompSnapshot.headline}</Text>
                <Text style={styles.detailText}>{marketCompSnapshot.detail}</Text>
                <View style={styles.statsRow}>
                  {marketCompSnapshot.comparableCount > 0 ? (
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>Comparable avg</Text>
                      <Text style={styles.statValue}>{currency(marketCompSnapshot.averageComparablePrice)}</Text>
                    </View>
                  ) : null}
                  {marketCompSnapshot.comparableCount > 0 ? (
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>Comparable count</Text>
                      <Text style={styles.statValue}>{marketCompSnapshot.comparableCount}</Text>
                    </View>
                  ) : null}
                  {marketCompSnapshot.lenderApr > 0 ? (
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>Outside APR</Text>
                      <Text style={styles.statValue}>{marketCompSnapshot.lenderApr}%</Text>
                    </View>
                  ) : null}
                  {marketCompSnapshot.lenderSavingsEstimate > 0 ? (
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>Rate savings</Text>
                      <Text style={styles.statValue}>{currency(marketCompSnapshot.lenderSavingsEstimate)}</Text>
                    </View>
                  ) : null}
                </View>
              </Card>
            ) : null}

            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.menuTitle}>Buy, counter, or leave</Text>
                <StatusBadge label={actionRecommendation.action} tone={actionRecommendation.tone} />
              </View>
              <Text style={styles.detailText}>{actionRecommendation.headline}</Text>
              <Text style={styles.detailText}>{actionRecommendation.detail}</Text>
              <View style={styles.statsRow}>
                {typeof actionRecommendation.targetTotalPaid === 'number' ? (
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Negotiate toward</Text>
                    <Text style={styles.statValue}>{currency(actionRecommendation.targetTotalPaid)}</Text>
                  </View>
                ) : null}
                {appData.deal.targetTotalPaid.trim() ? (
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Your walk-away</Text>
                    <Text style={styles.statValue}>{currency(appData.deal.targetTotalPaid)}</Text>
                  </View>
                ) : null}
                {typeof actionRecommendation.targetMonthlyPayment === 'number' ? (
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Target monthly</Text>
                    <Text style={styles.statValue}>{currency(actionRecommendation.targetMonthlyPayment)}</Text>
                  </View>
                ) : null}
              </View>
            </Card>

            {tradeInAssessment ? (
              <TradeEquityAuditCard
                assessment={tradeInAssessment}
                onCopyScript={() => void copyText('Trade script', tradeInAssessment.negotiationScript)}
              />
            ) : null}

            <Card>
              <Text style={styles.menuTitle}>Negotiation blueprint</Text>
              <Text style={styles.detailText}>{negotiationPlan.headline}</Text>

              <View style={styles.scriptBox}>
                <Text style={styles.detailText}>
                  <Text style={styles.bold}>Best next line: </Text>
                  {negotiationPlan.strongestMove}
                </Text>
              </View>

              <View style={styles.stackGapSmall}>
                {negotiationPlan.scenarios.length > 0 ? (
                  negotiationPlan.scenarios.map((scenario) => (
                    <View key={scenario.title} style={styles.infoBox}>
                      <Text style={styles.bold}>{scenario.title}</Text>
                      <Text style={styles.infoBoxText}>{scenario.detail}</Text>
                      <Text style={styles.infoBoxText}>
                        Estimated total impact: {currency(scenario.totalChange)}
                      </Text>
                      <Text style={styles.infoBoxText}>
                        {scenario.monthlyChange >= 0
                          ? `Estimated monthly drop: ${currency(scenario.monthlyChange)}`
                          : `Estimated monthly increase: ${currency(Math.abs(scenario.monthlyChange))}`}
                      </Text>
                      {scenario.tradeoff ? <Text style={styles.infoBoxText}>{scenario.tradeoff}</Text> : null}
                      <View style={styles.scriptBox}>
                        <Text style={styles.detailText}>
                          <Text style={styles.bold}>Say this: </Text>
                          {scenario.script}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.detailText}>No single lever is dominating this deal. Keep pushing for a cleaner written out-the-door price and lower total paid.</Text>
                )}
              </View>

              <View style={styles.stackGap}>
                <AppButton label="Copy negotiation blueprint" variant="secondary" onPress={() => void copyText('Negotiation blueprint', negotiationPlanSummary)} />
                <AppButton label="Share negotiation blueprint" onPress={() => void shareText('Sign Check negotiation blueprint', negotiationPlanSummary)} />
              </View>
            </Card>

            {offerTimeline.length > 0 && (
              <Card>
                <Text style={styles.menuTitle}>Offer strength timeline</Text>
                <Text style={styles.detailText}>Each saved revision shows whether the dealership really improved the deal or just moved numbers around.</Text>
                <View style={styles.stackGapSmall}>
                  {offerTimeline.map((entry) => (
                    <View key={entry.deal.id} style={styles.infoBox}>
                      <Text style={styles.bold}>
                        Revision {entry.deal.revisionNumber} • {new Date(entry.deal.savedAt).toLocaleString()}
                      </Text>
                      <Text style={styles.infoBoxText}>
                        Verdict: {entry.analysis.dealVerdict} • Total paid: {currency(entry.analysis.totalPaid)} • Monthly: {currency(entry.analysis.monthlyPayment)}
                      </Text>
                      {entry.insights.map((insight) => (
                        <Text key={`${entry.deal.id}-${insight.label}`} style={styles.infoBoxText}>
                          • {insight.label}: {insight.detail}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              </Card>
            )}
            <View style={styles.stackGap}>
              <AppButton label="Back to numbers" variant="secondary" onPress={() => setDealReviewWizardStep('numbers')} />
            </View>
              </>
            ) : null}
              </>
            ) : null}
          </>
        )}

        {screen === 'financeDefense' && (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.screenTitle}>Finance office defense</Text>
              <TouchableOpacity onPress={goBackScreen}>
                <Text style={styles.linkText}>Back</Text>
              </TouchableOpacity>
            </View>

            <Card>
              <Text style={styles.heroText}>The finance office is where optional products and payment framing often get bundled into the deal.</Text>
              <View style={styles.stackGapSmall}>
                {financeOfficeChecklist.map((item) => (
                  <Text key={item} style={styles.detailText}>
                    • {item}
                  </Text>
                ))}
              </View>
            </Card>

            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.menuTitle}>Total paid reality check</Text>
                <StatusBadge label="Finance office defense" tone="warn" />
              </View>
              <Text style={styles.detailText}>
                Dealerships often anchor on monthly payment. This is the full out-of-pocket cost over the loan life, including your down payment.
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Monthly on paperwork</Text>
                  <Text style={styles.statValue}>{currency(dealAnalysis.monthlyPayment)}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Total paid over life</Text>
                  <Text style={styles.statValue}>{currency(dealAnalysis.totalPaid)}</Text>
                </View>
              </View>
              <Text style={styles.detailText}>
                {Number(appData.deal.months || 0) > 0
                  ? `${currency(dealAnalysis.monthlyPayment)} × ${appData.deal.months} months + ${currency(Number(appData.deal.downPayment || 0))} down = ${currency(dealAnalysis.totalPaid)} total out of pocket.`
                  : 'Enter loan term and down payment in Deal review to calculate the full lifetime cost.'}
              </Text>
              <MathDisclaimer />
            </Card>

            <View style={styles.stackGap}>
              {financeOfficeItems.map((item) => (
                <Card key={item.title}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.bold}>Danger: </Text>
                    {item.danger}
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.bold}>Watch for: </Text>
                    {item.watch}
                  </Text>
                  <View style={styles.scriptBox}>
                    <Text style={styles.detailText}>
                      <Text style={styles.bold}>Say this: </Text>
                      {item.script}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          </>
        )}

        {screen === 'whatIfLab' && !hasProAccess ? (
          <PremiumPreviewCard
            title="What-if lab"
            detail="Model cleaner APR, fees, add-ons, and term structures—and get a dollar-backed counter script before you push back at the desk."
            showPreviewOption={canOfferPremiumPreview && billingStoreUnavailable}
            onPreview={() => promptPremiumPreview(() => openWhatIfLab())}
            onPaywall={() => void startPaywallPurchase()}
          />
        ) : null}

        {screen === 'whatIfLab' && hasProAccess ? (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.screenTitle}>What-if lab</Text>
              <TouchableOpacity onPress={goBackScreen}>
                <Text style={styles.linkText}>Back</Text>
              </TouchableOpacity>
            </View>

            {whatIfSmartHeadline ? (
              <Card>
                <View style={styles.proFeatureHeader}>
                  <Text style={styles.menuTitle}>Smart counter</Text>
                  <ProFeatureBadge unlocked />
                </View>
                <Text style={styles.detailText}>{whatIfSmartHeadline}</Text>
              </Card>
            ) : null}

            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.menuTitle}>Scenario impact</Text>
                <StatusBadge
                  label={
                    whatIfComparison.totalDifference < 0
                      ? `${currency(Math.abs(whatIfComparison.totalDifference))} lower`
                      : whatIfComparison.totalDifference > 0
                        ? `${currency(whatIfComparison.totalDifference)} higher`
                        : 'Neutral'
                  }
                  tone={whatIfComparison.tone}
                />
              </View>
              <Text style={styles.detailText}>{whatIfComparison.headline}</Text>
              <Text style={styles.detailText}>{whatIfComparison.detail}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Current monthly</Text>
                  <Text style={styles.statValue}>{currency(whatIfComparison.currentMonthlyPayment)}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Scenario monthly</Text>
                  <Text style={styles.statValue}>{currency(whatIfComparison.scenarioMonthlyPayment)}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Current total</Text>
                  <Text style={styles.statValue}>{currency(whatIfComparison.currentTotalPaid)}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Scenario total</Text>
                  <Text style={styles.statValue}>{currency(whatIfComparison.scenarioTotalPaid)}</Text>
                </View>
              </View>
              <View style={styles.scriptBox}>
                <Text style={styles.detailText}>
                  <Text style={styles.bold}>Strongest move: </Text>
                  {whatIfComparison.strongestMove}
                </Text>
              </View>
              <View style={styles.doubleButtons}>
                <View style={styles.flexOne}>
                  <AppButton label="Copy scenario" variant="secondary" onPress={() => void copyText('What-if summary', whatIfSummary)} />
                </View>
                <View style={styles.flexOne}>
                  <AppButton label="Share scenario" onPress={() => void shareText('Sign Check what-if lab', whatIfSummary)} />
                </View>
              </View>
            </Card>

            <Card>
              <Text style={styles.menuTitle}>Edit your scenario</Text>
              <Text style={styles.detailText}>Change the numbers below without overwriting your real deal. Use this screen to test the cleaner structure you want the dealership to match.</Text>
              <DealInput label="Scenario vehicle price" value={whatIfDeal.vehiclePrice} onChangeText={(text) => updateWhatIfDeal('vehiclePrice', text)} placeholder="25000" />
              <DealInput label="Scenario fees" value={whatIfDeal.dealerFees} onChangeText={(text) => updateWhatIfDeal('dealerFees', text)} placeholder="995" />
              <DealInput label="Scenario add-ons" value={whatIfDeal.addOns} onChangeText={(text) => updateWhatIfDeal('addOns', text)} placeholder="0" />
              <DealInput label="Scenario APR" value={whatIfDeal.apr} onChangeText={(text) => updateWhatIfDeal('apr', text)} placeholder="6.9" />
              <DealInput label="Scenario term" value={whatIfDeal.months} onChangeText={(text) => updateWhatIfDeal('months', text)} placeholder="60" />
              <DealInput label="Scenario down payment" value={whatIfDeal.downPayment} onChangeText={(text) => updateWhatIfDeal('downPayment', text)} placeholder="3000" />
              <DealInput label="Scenario trade-in" value={whatIfDeal.tradeIn} onChangeText={(text) => updateWhatIfDeal('tradeIn', text)} placeholder="4000" />
              <View style={styles.doubleButtons}>
                <View style={styles.flexOne}>
                  <AppButton label="Reset from current deal" variant="secondary" onPress={resetWhatIfDeal} />
                </View>
                <View style={styles.flexOne}>
                  <AppButton label="Apply to deal review" onPress={applyWhatIfDealToReview} />
                </View>
              </View>
            </Card>

            <Card>
              <Text style={styles.menuTitle}>What changed</Text>
              <View style={styles.stackGapSmall}>
                {whatIfComparison.fieldChanges.length > 0 ? (
                  whatIfComparison.fieldChanges.map((item) => (
                    <View key={item.label} style={styles.infoBox}>
                      <Text style={styles.bold}>{item.label}</Text>
                      <Text style={styles.infoBoxText}>Current: {item.currentValue}</Text>
                      <Text style={styles.infoBoxText}>Scenario: {item.scenarioValue}</Text>
                      <Text style={styles.infoBoxText}>{item.impact}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.detailText}>No fields changed yet. Start by lowering a fee, removing add-ons, improving APR, or testing a shorter term.</Text>
                )}
              </View>
            </Card>
          </>
        ) : null}

        {screen === 'tacticDecoder' && (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.screenTitle}>Sales tactic decoder</Text>
              <TouchableOpacity onPress={goBackScreen}>
                <Text style={styles.linkText}>Back</Text>
              </TouchableOpacity>
            </View>

            <Card>
              <Text style={styles.heroText}>Tap the line that sounds closest to what the salesperson just said.</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stateChipRow}>
                {salesTacticItems.map((item, index) => {
                  const active = selectedTacticIndex === index;
                  return (
                    <TouchableOpacity
                      key={item.line}
                      activeOpacity={0.85}
                      onPress={() => setSelectedTacticIndex(index)}
                      style={[styles.stateChip, active && styles.stateChipActive]}
                    >
                      <Text style={active ? styles.stateChipTextActive : styles.stateChipText}>{item.tactic}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {selectedTactic ? (
                <>
              <View style={styles.infoBox}>
                <Text style={styles.bold}>They said:</Text>
                <Text style={styles.infoBoxText}>{selectedTactic.line}</Text>
              </View>
              <Text style={styles.detailText}>
                <Text style={styles.bold}>Why it works: </Text>
                {selectedTactic.why}
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.bold}>Your risk: </Text>
                {selectedTactic.risk}
              </Text>
              <View style={styles.scriptBox}>
                <Text style={styles.detailText}>
                  <Text style={styles.bold}>Best response: </Text>
                  {selectedTactic.script}
                </Text>
              </View>
                </>
              ) : null}
            </Card>

            <Card>
              <Text style={styles.menuTitle}>Quick scripts</Text>
              <View style={styles.stackGapSmall}>
                {quickScripts.map((script) => (
                  <TouchableOpacity key={script} style={styles.scriptRow} activeOpacity={0.85} onPress={() => void copyText('Script', script)}>
                    <Text style={[styles.flexOne, styles.detailText]}>{script}</Text>
                    <Text style={styles.linkText}>Copy</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            <Card>
              <Text style={styles.menuTitle}>Negotiation simulator</Text>
              {activeSimulationTurn ? (
                <View style={styles.stackGapSmall}>
                  <View style={styles.infoBox}>
                    <Text style={styles.bold}>{activeSimulationTurn.title}</Text>
                    <Text style={styles.infoBoxText}>They say: {activeSimulationTurn.salespersonLine}</Text>
                  </View>
                  <View style={styles.scriptBox}>
                    <Text style={styles.detailText}>
                      <Text style={styles.bold}>Best response: </Text>
                      {activeSimulationTurn.bestResponse}
                    </Text>
                  </View>
                  <Text style={styles.detailText}>
                    <Text style={styles.bold}>If you fold: </Text>
                    {activeSimulationTurn.ifYouFold}
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.bold}>If you hold: </Text>
                    {activeSimulationTurn.ifYouHold}
                  </Text>
                  <View style={styles.doubleButtons}>
                    <View style={styles.flexOne}>
                      <AppButton label="Copy response" variant="secondary" onPress={() => void copyText('Simulator response', activeSimulationTurn.bestResponse)} />
                    </View>
                    <View style={styles.flexOne}>
                      <AppButton label="Next scenario" onPress={() => setSimulatorIndex((prev) => prev + 1)} />
                    </View>
                  </View>
                </View>
              ) : (
                <Text style={styles.detailText}>No simulation scenarios available yet.</Text>
              )}
            </Card>
          </>
        )}

        {screen === 'watchlist' && (
          <WatchlistScreenContent
            vehicles={appData.watchedVehicles}
            budgetTarget={appData.deal.targetTotalPaid}
            pendingImport={pendingListingImport}
            editableFields={editableListingFields}
            confirmedFields={listingConfirmedFields}
            pendingPhotoUri={pendingListingPhotoUri}
            ocrBusy={isRunningListingOcr}
            onGoHome={goBackScreen}
            onChangeEditableField={(field, value) =>
              setEditableListingFields((prev) => ({
                ...prev,
                [field]: value,
              }))
            }
            onToggleConfirm={(field) =>
              setListingConfirmedFields((prev) => ({
                ...prev,
                [field]: !prev[field],
              }))
            }
            onPickCamera={() => void pickListingPhoto('camera')}
            onPickLibrary={() => void pickListingPhoto('library')}
            onStartManual={() => startManualListingEntry()}
            onRunOcr={() => void runListingPhotoOcr()}
            onSavePending={savePendingListingImport}
            onDismissPending={dismissPendingListingImport}
            onDeleteVehicle={deleteWatchedVehicle}
            onUsePriceInDealReview={useWatchedVehicleInDealReview}
          />
        )}

        {screen === 'compareDeals' && (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.screenTitle}>Compare dealership offers</Text>
              <TouchableOpacity onPress={goBackScreen}>
                <Text style={styles.linkText}>Back</Text>
              </TouchableOpacity>
            </View>

            {appData.savedDeals.length > 0 ? (
              <Card>
                <Text style={styles.detailText}>
                  Enter another dealership quote without going back through the Analyzer home screen.
                </Text>
                <AppButton label="Add another offer" onPress={openNewOfferReview} />
              </Card>
            ) : null}

            {appData.savedDeals.length === 0 ? (
              <EmptyStateGuide
                title="Compare dealerships side by side"
                detail="Save at least two quotes to see monthly payment, total paid, and risk flags next to each other."
                exampleTitle="Try the sample quote"
                exampleLines={[
                  `${SAMPLE_QUOTE.dealershipName}: ${currency(SAMPLE_QUOTE.vehiclePrice)} vehicle`,
                  `${SAMPLE_QUOTE.apr}% APR for ${SAMPLE_QUOTE.months} months`,
                  `${currency(SAMPLE_QUOTE.salesTax)} sales tax + ${currency(SAMPLE_QUOTE.dealerFees)} fees`,
                ]}
                primaryLabel="Go to Deal review"
                onPrimary={() => openScreen('dealReview', 'analyzer')}
                secondaryLabel="Load sample quote"
                onSecondary={fillSampleQuote}
              />
            ) : (
              <>
                {dealerScorecards.length > 0 &&
                  dealerReputationReports.length > 0 && (
                    <Card>
                      <Text style={styles.menuTitle}>Dealer reputation layer</Text>
                      <Text style={styles.detailText}>This combines offer quality, pressure behavior, promises, and visit timeline signals into one trust snapshot.</Text>
                      <View style={styles.stackGapSmall}>
                        {dealerReputationReports.map((report) => (
                          <View key={report.dealershipName} style={styles.infoBox}>
                            <View style={styles.rowBetween}>
                              <Text style={styles.bold}>{report.dealershipName}</Text>
                              <StatusBadge label={`${report.trustScore}/100`} tone={report.tone} />
                            </View>
                            <Text style={styles.infoBoxText}>{report.headline}</Text>
                            {report.highlights.map((highlight) => (
                              <Text key={`${report.dealershipName}-${highlight}`} style={styles.infoBoxText}>
                                • {highlight}
                              </Text>
                            ))}
                          </View>
                        ))}
                      </View>
                    </Card>
                  )}

                {dealerScorecards.length > 0 &&
                  (hasProAccess ? (
                    <Card>
                      <View style={styles.proFeatureHeader}>
                        <Text style={styles.menuTitle}>Dealer scorecards</Text>
                        <ProFeatureBadge unlocked />
                      </View>
                      <Text style={styles.detailText}>These scorecards combine the latest deal quality with pressure incidents and promise outcomes for each dealership.</Text>
                      <View style={styles.stackGapSmall}>
                        {dealerScorecards.map((scorecard) => (
                          <View key={scorecard.dealershipName} style={styles.infoBox}>
                            <View style={styles.rowBetween}>
                              <Text style={styles.bold}>{scorecard.dealershipName}</Text>
                              <StatusBadge label={scorecard.latestVerdict} tone={scorecard.tone} />
                            </View>
                            <Text style={styles.infoBoxText}>{scorecard.headline}</Text>
                            <Text style={styles.infoBoxText}>Revisions: {scorecard.revisionCount}</Text>
                            <Text style={styles.infoBoxText}>Pressure incidents: {scorecard.pressureCount}</Text>
                            <Text style={styles.infoBoxText}>Promises kept / broken: {scorecard.keptPromiseCount} / {scorecard.brokenPromiseCount}</Text>
                            <Text style={styles.infoBoxText}>
                              Latest total paid: {typeof scorecard.latestTotalPaid === 'number' ? currency(scorecard.latestTotalPaid) : 'No saved offer yet'}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </Card>
                  ) : (
                    <PremiumPreviewCard
                      title="Dealer scorecards"
                      detail="When you are comparing multiple offers, Pro shows how each dealership stacks up on deal quality, pressure tactics, and kept or broken promises—so patterns are easier to spot before you sign."
                      onPaywall={() => void startPaywallPurchase()}
                    />
                  ))}

                {comparison?.winner && (
                  <Card>
                    <StatusBadge label="Current best offer" tone="good" />
                    <Text style={styles.menuTitle}>{comparison.winner.deal.dealershipName || 'Unnamed dealership'}</Text>
                    <Text style={styles.detailText}>State context: {getStateName(comparison.winner.deal.buyerStateCode)}</Text>
                    <Text style={styles.detailText}>Estimated total paid: {currency(comparison.winner.analysis.totalPaid)}</Text>
                    <Text style={styles.detailText}>Estimated monthly payment: {currency(comparison.winner.analysis.monthlyPayment)}</Text>
                    <Text style={styles.detailText}>Structured fees: {currency(getFeeTotal(comparison.winner.deal))}</Text>
                    <Text style={styles.detailText}>Warning count: {comparison.winner.analysis.dealWarnings.length + comparison.winner.analysis.flaggedFees.length}</Text>
                    {whyOfferWins ? (
                      <View style={styles.gradePanel}>
                        <Text style={styles.bold}>{whyOfferWins.headline}</Text>
                        <Text style={styles.detailText}>{whyOfferWins.summary}</Text>
                        {whyOfferWins.bullets.map((bullet) => (
                          <Text key={bullet} style={styles.detailText}>
                            • {bullet}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </Card>
                )}

                {appData.savedDeals.length >= 2 && (
                  <Card>
                    <Text style={styles.menuTitle}>Choose 2 offers to compare</Text>
                    <Text style={styles.detailText}>Pick one offer for the left column and one for the right column.</Text>
                    <View style={styles.stackGapSmall}>
                      {appData.savedDeals.map((savedDeal) => {
                        const pickedLeft = selectedComparePair.firstId === savedDeal.id;
                        const pickedRight = selectedComparePair.secondId === savedDeal.id;
                        return (
                          <View key={`pick-${savedDeal.id}`} style={styles.comparePickRow}>
                            <View style={styles.flexOne}>
                              <Text style={styles.comparePickName}>{savedDeal.dealershipName || 'Unnamed dealership'}</Text>
                              <Text style={styles.detailText}>State: {getStateName(savedDeal.buyerStateCode)}</Text>
                            </View>
                            <TouchableOpacity
                              activeOpacity={0.85}
                              onPress={() => toggleComparePick('firstId', savedDeal.id)}
                              style={[styles.comparePickButton, pickedLeft && styles.comparePickButtonActive]}
                            >
                              <Text style={pickedLeft ? styles.comparePickButtonTextActive : styles.comparePickButtonText}>Left</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              activeOpacity={0.85}
                              onPress={() => toggleComparePick('secondId', savedDeal.id)}
                              style={[styles.comparePickButton, pickedRight && styles.comparePickButtonActive]}
                            >
                              <Text style={pickedRight ? styles.comparePickButtonTextActive : styles.comparePickButtonText}>Right</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                    <View style={styles.doubleButtons}>
                      <View style={styles.flexOne}>
                        <AppButton
                          label="Copy summary"
                          variant="secondary"
                          onPress={() => {
                            if (!selectedDealsForCompare.first || !selectedDealsForCompare.second || !manualCompareAnalyses.first || !manualCompareAnalyses.second) return;
                            void copyText(
                              'Comparison summary',
                              buildComparisonSummary(
                                selectedDealsForCompare.first,
                                selectedDealsForCompare.second,
                                manualCompareAnalyses.first,
                                manualCompareAnalyses.second
                              )
                            );
                          }}
                          disabled={!selectedDealsForCompare.first || !selectedDealsForCompare.second}
                        />
                      </View>
                      <View style={styles.flexOne}>
                        <AppButton
                          label="Share summary"
                          onPress={() => {
                            if (!selectedDealsForCompare.first || !selectedDealsForCompare.second || !manualCompareAnalyses.first || !manualCompareAnalyses.second) return;
                            void shareText(
                              'Sign Check comparison summary',
                              buildComparisonSummary(
                                selectedDealsForCompare.first,
                                selectedDealsForCompare.second,
                                manualCompareAnalyses.first,
                                manualCompareAnalyses.second
                              )
                            );
                          }}
                          disabled={!selectedDealsForCompare.first || !selectedDealsForCompare.second}
                        />
                      </View>
                    </View>
                  </Card>
                )}

                {selectedDealsForCompare.first && selectedDealsForCompare.second && manualCompareAnalyses.first && manualCompareAnalyses.second && (
                  <Card>
                    <Text style={styles.menuTitle}>Head-to-head comparison</Text>
                    <View style={styles.headToHeadHeader}>
                      <Text style={styles.headToHeadDealName}>{selectedDealsForCompare.first.dealershipName || 'Offer 1'}</Text>
                      <Text style={styles.headToHeadDealName}>{selectedDealsForCompare.second.dealershipName || 'Offer 2'}</Text>
                    </View>

                    <View style={styles.compareRow}>
                      <Text style={styles.compareLabel}>Verdict</Text>
                      <Text style={styles.compareValue}>{manualCompareAnalyses.first.dealVerdict}</Text>
                      <Text style={styles.compareValue}>{manualCompareAnalyses.second.dealVerdict}</Text>
                    </View>
                    <View style={styles.compareRow}>
                      <Text style={styles.compareLabel}>State</Text>
                      <Text style={styles.compareValue}>{getStateName(selectedDealsForCompare.first.buyerStateCode)}</Text>
                      <Text style={styles.compareValue}>{getStateName(selectedDealsForCompare.second.buyerStateCode)}</Text>
                    </View>
                    <View style={styles.compareRow}>
                      <Text style={styles.compareLabel}>Amount financed</Text>
                      <Text style={styles.compareValue}>{currency(manualCompareAnalyses.first.amountFinanced)}</Text>
                      <Text style={styles.compareValue}>{currency(manualCompareAnalyses.second.amountFinanced)}</Text>
                    </View>
                    <View style={styles.compareRow}>
                      <Text style={styles.compareLabel}>Monthly payment</Text>
                      <Text style={styles.compareValue}>{currency(manualCompareAnalyses.first.monthlyPayment)}</Text>
                      <Text style={styles.compareValue}>{currency(manualCompareAnalyses.second.monthlyPayment)}</Text>
                    </View>
                    <View style={styles.compareRow}>
                      <Text style={styles.compareLabel}>Total paid</Text>
                      <Text style={styles.compareValue}>{currency(manualCompareAnalyses.first.totalPaid)}</Text>
                      <Text style={styles.compareValue}>{currency(manualCompareAnalyses.second.totalPaid)}</Text>
                    </View>
                    <View style={styles.compareRow}>
                      <Text style={styles.compareLabel}>Warnings</Text>
                      <Text style={styles.compareValue}>{manualCompareAnalyses.first.dealWarnings.length + manualCompareAnalyses.first.flaggedFees.length}</Text>
                      <Text style={styles.compareValue}>{manualCompareAnalyses.second.dealWarnings.length + manualCompareAnalyses.second.flaggedFees.length}</Text>
                    </View>
                    <View style={styles.compareRow}>
                      <Text style={styles.compareLabel}>Fees</Text>
                      <Text style={styles.compareValue}>{currency(getFeeTotal(selectedDealsForCompare.first))}</Text>
                      <Text style={styles.compareValue}>{currency(getFeeTotal(selectedDealsForCompare.second))}</Text>
                    </View>
                    <View style={styles.compareRow}>
                      <Text style={styles.compareLabel}>Add-ons</Text>
                      <Text style={styles.compareValue}>{currency(getAddOnTotal(selectedDealsForCompare.first))}</Text>
                      <Text style={styles.compareValue}>{currency(getAddOnTotal(selectedDealsForCompare.second))}</Text>
                    </View>
                  </Card>
                )}

                {manualComparisonInsights.length > 0 && (
                  <Card>
                    <Text style={styles.menuTitle}>What changed between offers</Text>
                    <View style={styles.stackGapSmall}>
                      {manualComparisonInsights.map((insight) => (
                        <View key={insight.label} style={styles.infoBox}>
                          <Text style={styles.bold}>
                            {insight.label}: {insight.winner === 'tie' ? 'Tie' : insight.winner === 'left' ? 'Left offer' : 'Right offer'}
                          </Text>
                          <Text style={styles.infoBoxText}>{insight.detail}</Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                )}

                {selectedWhyOfferWins ? (
                  <Card>
                    <StatusBadge label="Why this wins" tone="good" />
                    <Text style={styles.menuTitle}>{selectedWhyOfferWins.headline}</Text>
                    <Text style={styles.detailText}>{selectedWhyOfferWins.summary}</Text>
                    <View style={styles.stackGapSmall}>
                      {selectedWhyOfferWins.bullets.map((bullet) => (
                        <Text key={bullet} style={styles.detailText}>
                          • {bullet}
                        </Text>
                      ))}
                    </View>
                  </Card>
                ) : null}

                {compareLotCoachContext && hasProAccess ? (
                  <LotCoachCard
                    context={compareLotCoachContext}
                    title="Explain my offers (AI)"
                    detail="Ask Lot Coach to read the two offers you selected and explain what differs — not generic desk coaching."
                    placeholder="Which offer is better and why?"
                    quickPrompts={LOT_COACH_COMPARE_PROMPTS}
                    onTrack={(detail) => trackEvent('lot_coach_compare', 'Lot Coach compared offers', detail)}
                    onAnswered={() => void completeClosedBetaStep('lotCoachAsked')}
                  />
                ) : null}

                {compareLotCoachContext && !hasProAccess ? (
                  <PremiumPreviewCard
                    title="Explain my offers with AI"
                    detail="Pro unlocks Lot Coach on Compare so it can read both saved offers and explain which one is better — instead of defaulting to live desk scripts."
                    onPaywall={() => void startPaywallPurchase()}
                  />
                ) : null}

                {manualCounterMoves.length > 0 && (
                  <Card>
                    <Text style={styles.menuTitle}>How to counter the weaker offer</Text>
                    <View style={styles.stackGapSmall}>
                      {manualCounterMoves.map((move) => (
                        <View key={move.title} style={styles.scriptBox}>
                          <Text style={styles.bold}>{move.title}</Text>
                          <Text style={styles.detailText}>{move.detail}</Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                )}

                <View style={styles.stackGap}>
                  {appData.savedDeals.map((savedDeal) => {
                    const analysis = buildDealAnalysis(savedDeal, readinessLabel);
                    const isWinner = comparison?.winner.deal.id === savedDeal.id;

                    return (
                      <Card key={savedDeal.id}>
                        <View style={styles.rowBetween}>
                          <Text style={styles.menuTitle}>{savedDeal.dealershipName || 'Unnamed dealership'}</Text>
                          <StatusBadge label={isWinner ? 'Best' : analysis.dealVerdict} tone={isWinner ? 'good' : analysis.dealGradeTone} />
                        </View>
                        <Text style={styles.detailText}>Revision {savedDeal.revisionNumber}</Text>
                        <Text style={styles.detailText}>State: {getStateName(savedDeal.buyerStateCode)}</Text>
                        <Text style={styles.detailText}>Estimated financed: {currency(analysis.amountFinanced)}</Text>
                        <Text style={styles.detailText}>Estimated monthly: {currency(analysis.monthlyPayment)}</Text>
                        <Text style={styles.detailText}>Estimated total paid: {currency(analysis.totalPaid)}</Text>
                        <Text style={styles.detailText}>Fees / add-ons: {currency(getFeeTotal(savedDeal))} / {currency(getAddOnTotal(savedDeal))}</Text>
                        <Text style={styles.detailText}>Offer notes: {savedDeal.offerNotes || 'None attached.'}</Text>
                        <Text style={styles.detailText}>Saved: {new Date(savedDeal.savedAt).toLocaleString()}</Text>
                        <View style={styles.doubleButtons}>
                          <View style={styles.flexOne}>
                            <AppButton label="Load" variant="secondary" onPress={() => loadSavedDeal(savedDeal.id)} />
                          </View>
                          <View style={styles.flexOne}>
                            <AppButton label="Delete" variant="danger" onPress={() => deleteSavedDeal(savedDeal.id)} />
                          </View>
                        </View>
                      </Card>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}

        {screen === 'upgradeHub' && (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.screenTitle}>Features Matrix</Text>
              <TouchableOpacity onPress={goBackScreen}>
                <Text style={styles.linkText}>Back</Text>
              </TouchableOpacity>
            </View>

            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.menuTitle}>Current plan</Text>
                <StatusBadge
                  label={isPro ? 'Pro active' : isPremiumPreview ? 'Premium Preview' : 'Free plan'}
                  tone={isPro ? 'good' : isPremiumPreview ? 'warn' : 'warn'}
                />
              </View>
              <Text style={styles.detailText}>{monetizationSummary.headline}</Text>
              <Text style={styles.detailText}>{monetizationSummary.detail}</Text>
              {!isPro && savingsOpportunity.estimatedSavings > 0 ? (
                <Text style={styles.detailText}>
                  Based on your current deal, Pro modeling could protect about {currency(savingsOpportunity.estimatedSavings)}.
                </Text>
              ) : null}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Lifetime access</Text>
                  <Text style={styles.statValue}>
                    {appData.billing.provider === 'revenuecat' && appData.billing.offeringsLoaded
                      ? appData.billing.packageLabel
                      : monetizationSummary.monthlyPriceLabel}
                  </Text>
                </View>
              </View>
              <Text style={styles.detailText}>One-time purchase unlocks Sign Check Pro on this account. Restore purchases if you reinstall or switch devices.</Text>
              <View style={styles.stackGap}>
                {!isPro ? (
                  <AppButton label={upgradeCtaLabel} onPress={() => void startPaywallPurchase()} disabled={billingBusy} />
                ) : null}
                <AppButton label="Restore purchase" variant="secondary" onPress={() => void restorePurchase()} disabled={billingBusy} />
                {canOfferPremiumPreview && !isPro ? (
                  <AppButton
                    label={isPremiumPreview ? 'Exit Premium Preview' : 'Preview Pro tools'}
                    variant="secondary"
                    onPress={() => (isPremiumPreview ? exitPremiumPreview() : void enablePremiumPreview())}
                  />
                ) : null}
              </View>
              <View style={styles.stackGap}>
                <AppButton label="Privacy policy" variant="secondary" onPress={() => void openExternalLink(getPrivacyPolicyUrl(), 'Privacy policy')} />
                <AppButton label="Terms and disclaimer" variant="secondary" onPress={() => void openExternalLink(getLegalDisclaimerUrl(), 'Terms and disclaimer')} />
              </View>
            </Card>

            <FreeVsProComparison
              title={isPro ? 'Your plan includes' : 'Free vs Pro at a glance'}
              showLifetimeIncluded
              showPurchaseNote
              isPro={hasProAccess}
              onLockedFeaturePress={handleLockedFeaturePress}
            />
          </>
        )}

        {screen === 'notes' && (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.screenTitle}>Incident Logs</Text>
              <TouchableOpacity onPress={goBackScreen}>
                <Text style={styles.linkText}>Back</Text>
              </TouchableOpacity>
            </View>
            <Card>
              <Text style={styles.heroText}>Save quotes, salesperson names, promises, and anything that felt off. These notes stay separate from the per-offer notes in Deal review.</Text>
              <TextInput
                style={styles.notesInput}
                value={appData.notes}
                onChangeText={(text) => setAppData((prev) => ({ ...prev, notes: text }))}
                placeholder="Example: Dealer quoted 8.9% APR, pushed paint protection, and would not show full out-the-door price until late in the conversation."
                placeholderTextColor="#94a3b8"
                multiline
                textAlignVertical="top"
              />
              <AppButton label="Save visit note to timeline" variant="secondary" onPress={saveVisitNoteToTimeline} />
            </Card>
            <Card>
              <Text style={styles.menuTitle}>Backup and move your data</Text>
              <Text style={styles.detailText}>Until full account sync exists, you can copy a local backup from one device and paste it into another Sign Check install.</Text>
              <View style={styles.stackGap}>
                <AppButton label="Copy local backup" variant="secondary" onPress={exportLocalBackup} />
              </View>
              <TextInput
                style={styles.notesInput}
                value={backupDraft}
                onChangeText={setBackupDraft}
                placeholder="Paste a Sign Check backup JSON here to import it on this device."
                placeholderTextColor="#94a3b8"
                multiline
                textAlignVertical="top"
              />
              <AppButton label="Import local backup" onPress={importLocalBackup} />
            </Card>
            <Card>
              <Text style={styles.menuTitle}>Dealership visit timeline</Text>
              <Text style={styles.detailText}>This turns the current dealership interaction into a reusable case file you can review later or share with someone else.</Text>
              <View style={styles.stackGap}>
                <AppButton label="Copy visit case file" variant="secondary" onPress={() => void copyText('Visit case file', visitCaseSummary)} />
              </View>
              <View style={styles.stackGapSmall}>
                {appData.visitTimeline.length > 0 ? (
                  appData.visitTimeline.map((entry) => (
                    <View key={entry.id} style={styles.infoBox}>
                      <Text style={styles.bold}>{entry.title}</Text>
                      <Text style={styles.infoBoxText}>{entry.detail}</Text>
                      <Text style={styles.infoBoxText}>{entry.dealershipName}</Text>
                      <Text style={styles.infoBoxText}>{new Date(entry.createdAt).toLocaleString()}</Text>
                      <TouchableOpacity onPress={() => confirmDeleteTimelineEntry(entry.id)} activeOpacity={0.85}>
                        <Text style={styles.removeText}>Delete log</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.detailText}>No visit timeline entries yet. Your first entries usually appear automatically after you import a quote, save an offer, log pressure, or save a note.</Text>
                )}
              </View>
            </Card>
            <Card>
              <Text style={styles.menuTitle}>Promise tracker</Text>
              <Text style={styles.detailText}>{promiseSummary.headline}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Open</Text>
                  <Text style={styles.statValue}>{promiseSummary.openCount}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Kept</Text>
                  <Text style={styles.statValue}>{promiseSummary.keptCount}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Broken</Text>
                  <Text style={styles.statValue}>{promiseSummary.brokenCount}</Text>
                </View>
              </View>
              <DealInput
                label="Log a promise"
                value={promiseDraft}
                onChangeText={setPromiseDraft}
                placeholder="Example: We will remove the prep fee before you come back."
                numeric={false}
                multiline
              />
              <AppButton label="Save promise" onPress={addPromiseRecord} />
              <View style={styles.stackGapSmall}>
                {promiseSummary.recent.length > 0 ? (
                  promiseSummary.recent.map((promise) => (
                    <View key={promise.id} style={styles.infoBox}>
                      <Text style={styles.bold}>{promise.dealershipName}</Text>
                      <Text style={styles.infoBoxText}>{promise.text}</Text>
                      <Text style={styles.infoBoxText}>Status: {promise.status}</Text>
                      <Text style={styles.infoBoxText}>Logged: {new Date(promise.notedAt).toLocaleString()}</Text>
                      <View style={styles.doubleButtons}>
                        <View style={styles.flexOne}>
                          <AppButton label="Kept" variant="secondary" onPress={() => updatePromiseStatus(promise.id, 'kept')} />
                        </View>
                        <View style={styles.flexOne}>
                          <AppButton label="Broken" variant="danger" onPress={() => updatePromiseStatus(promise.id, 'broken')} />
                        </View>
                      </View>
                      {promise.status !== 'open' ? <AppButton label="Reopen" variant="secondary" onPress={() => updatePromiseStatus(promise.id, 'open')} /> : null}
                      <TouchableOpacity onPress={() => confirmDeletePromise(promise.id)} activeOpacity={0.85}>
                        <Text style={styles.removeText}>Delete promise</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.detailText}>No promises logged yet. Save anything the dealership says it will fix, remove, discount, or send later so you can track whether it actually happens.</Text>
                )}
              </View>
            </Card>
            <Card>
              <Text style={styles.menuTitle}>Pressure history</Text>
              <Text style={styles.detailText}>{pressureSummary.headline}</Text>
              <View style={styles.stackGapSmall}>
                {pressureSummary.recent.length > 0 ? (
                  pressureSummary.recent.map((incident) => (
                    <View key={incident.id} style={styles.infoBox}>
                      <Text style={styles.bold}>{incident.dealershipName}</Text>
                      <Text style={styles.infoBoxText}>{incident.flag}</Text>
                      <Text style={styles.infoBoxText}>{new Date(incident.notedAt).toLocaleString()}</Text>
                      <TouchableOpacity onPress={() => confirmDeletePressureIncident(incident.id)} activeOpacity={0.85}>
                        <Text style={styles.removeText}>Delete pressure log</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.detailText}>No pressure incidents saved yet. Log them in Live dealership mode and this history will start building automatically.</Text>
                )}
              </View>
            </Card>
          </>
        )}
        </ScrollView>

        {screen !== 'firstRunWalkthrough' ? (
        <View
          style={[
            styles.bottomTabBar,
            {
              paddingBottom: bottomTabPadding,
              minHeight: bottomTabBarHeight,
            },
          ]}
        >
          {BOTTOM_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.bottomTabButton, bottomTab === tab.key && styles.bottomTabButtonActive]}
              onPress={() => setBottomTab(tab.key)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={tab.icon}
                size={18}
                color={bottomTab === tab.key ? SHIELD_THEME.gold : SHIELD_THEME.textMuted}
              />
              <Text style={[styles.bottomTabLabel, bottomTab === tab.key && styles.bottomTabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        ) : null}
      </View>
    </View>
  );
}

const theme = SHIELD_THEME;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  appShell: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.surface,
    paddingHorizontal: 8,
    paddingTop: 10,
    gap: 6,
  },
  bottomTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    gap: 4,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 4,
  },
  bottomTabButtonActive: {
    backgroundColor: theme.surface,
    borderColor: theme.gold,
  },
  bottomTabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
    textAlign: 'center',
  },
  bottomTabLabelActive: {
    color: theme.gold,
    fontWeight: '800',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: theme.text,
  },
  heroText: {
    color: theme.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  heroWarningBox: {
    backgroundColor: theme.goldSoft,
    borderRadius: theme.radius,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  heroWarningTitle: {
    color: theme.text,
    fontWeight: '800',
    fontSize: 15,
  },
  heroWarningText: {
    color: theme.textMuted,
    fontSize: 14,
  },
  proofRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  proofPill: {
    flexGrow: 1,
    minWidth: 96,
    ...SHIELD_SURFACE.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  proofPillValue: {
    color: theme.text,
    fontWeight: '800',
    fontSize: 13,
  },
  proofPillLabel: {
    color: theme.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  stackGap: {
    gap: 12,
  },
  stackGapSmall: {
    gap: 8,
  },
  analyzerSection: {
    gap: 12,
  },
  analyzerSectionTitle: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  auditDashboardShell: {
    borderRadius: theme.radius,
    borderWidth: 2,
    borderColor: theme.gold,
    shadowColor: theme.gold,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  auditDashboardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  auditDashboardTitle: {
    flex: 1,
    color: theme.gold,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
    lineHeight: 20,
    paddingRight: 12,
  },
  auditDashboardSubtitle: {
    color: theme.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  auditDashboardItem: {
    ...SHIELD_SURFACE.inset,
    padding: 14,
    gap: 6,
    borderColor: theme.gold,
  },
  auditDashboardItemLabel: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    paddingRight: 8,
  },
  auditDashboardItemCost: {
    color: theme.gold,
    fontSize: 15,
    fontWeight: '800',
  },
  auditDashboardItemExplanation: {
    color: theme.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  auditDashboardItemTip: {
    color: theme.text,
    fontSize: 14,
    lineHeight: 20,
  },
  proPreviewCard: {
    position: 'relative',
  },
  proLockedButtonWrap: {
    position: 'relative',
  },
  proPreviewBadgeCorner: SHIELD_SURFACE.badgeCorner,
  proFeatureHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  menuTitleWithProBadge: {
    paddingRight: 108,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
  },
  menuTitleActive: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.gold,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
    flex: 1,
    flexShrink: 1,
  },
  linkText: {
    color: theme.gold,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textMuted,
  },
  questionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.text,
  },
  questionSubtitle: {
    color: theme.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  optionButton: {
    ...SHIELD_SURFACE.card,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionButtonActive: {
    backgroundColor: theme.goldSoft,
    borderColor: theme.gold,
  },
  optionText: {
    color: theme.text,
    fontWeight: '700',
  },
  optionTextActive: {
    color: theme.gold,
    fontWeight: '700',
  },
  doubleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deskSectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deskSectionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceInset,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  deskSectionChipSelected: {
    backgroundColor: theme.goldSoft,
    borderColor: theme.gold,
  },
  deskSectionChipText: {
    color: theme.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  deskSectionChipTextSelected: {
    color: theme.gold,
  },
  flexOne: {
    flex: 1,
  },
  infoBox: {
    ...SHIELD_SURFACE.inset,
    padding: 14,
    gap: 4,
  },
  infoBoxText: {
    color: theme.textMuted,
    lineHeight: 20,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    marginTop: 4,
  },
  warningRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  warningBullet: {
    color: theme.dangerText,
    fontWeight: '800',
    lineHeight: 20,
  },
  warningText: {
    flex: 1,
    color: theme.dangerText,
    lineHeight: 20,
  },
  detailText: {
    color: theme.textMuted,
    lineHeight: 21,
  },
  fieldHint: {
    color: theme.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: -4,
    marginBottom: 8,
  },
  detailTextActive: {
    color: theme.text,
    lineHeight: 21,
  },
  bold: {
    fontWeight: '800',
    color: theme.text,
  },
  scriptBox: {
    ...SHIELD_SURFACE.inset,
    padding: 14,
  },
  checkItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    ...SHIELD_SURFACE.inset,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  checkItemActive: {
    backgroundColor: theme.successSoft,
    borderColor: theme.successText,
  },
  checkMark: {
    color: theme.textMuted,
    fontWeight: '800',
  },
  checkMarkActive: {
    color: theme.successText,
    fontWeight: '800',
  },
  checkText: {
    flex: 1,
    color: theme.textMuted,
  },
  checkTextActive: {
    flex: 1,
    color: theme.successText,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  statCard: {
    flexGrow: 1,
    minWidth: 100,
    ...SHIELD_SURFACE.inset,
    padding: 14,
    gap: 4,
  },
  statLabel: {
    color: theme.textMuted,
    fontWeight: '700',
    fontSize: 12,
  },
  statValue: {
    color: theme.text,
    fontWeight: '800',
    fontSize: 18,
  },
  flagCard: {
    ...SHIELD_SURFACE.inset,
    padding: 14,
    gap: 6,
  },
  flagCardActive: {
    backgroundColor: theme.goldSoft,
    borderColor: theme.gold,
  },
  inputWrap: {
    gap: 6,
  },
  lineItemCard: {
    ...SHIELD_SURFACE.inset,
    padding: 12,
    gap: 8,
  },
  inputLabel: {
    color: theme.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  input: {
    minHeight: 50,
    borderRadius: theme.radius,
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
    color: theme.text,
  },
  inputMultiline: {
    minHeight: 110,
    paddingTop: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 6,
  },
  dotGood: {
    backgroundColor: '#16a34a',
  },
  dotWarn: {
    backgroundColor: '#d97706',
  },
  dotBad: {
    backgroundColor: '#dc2626',
  },
  breakdownTitle: {
    color: theme.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  stateChipRow: {
    gap: 8,
    paddingVertical: 2,
  },
  stateChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...SHIELD_SURFACE.card,
  },
  stateChipActive: {
    backgroundColor: theme.goldSoft,
    borderColor: theme.gold,
  },
  stateChipText: {
    color: theme.text,
    fontWeight: '700',
  },
  stateChipTextActive: {
    color: theme.gold,
    fontWeight: '700',
  },
  gradePanel: {
    ...SHIELD_SURFACE.inset,
    padding: 14,
    gap: 4,
  },
  comparePickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comparePickName: {
    fontWeight: '700',
    color: theme.text,
  },
  comparePickWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  comparePickButton: {
    ...SHIELD_SURFACE.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  comparePickButtonActive: {
    backgroundColor: theme.goldSoft,
    borderColor: theme.gold,
  },
  comparePickButtonText: {
    color: theme.text,
    fontWeight: '700',
  },
  comparePickButtonTextActive: {
    color: theme.gold,
    fontWeight: '700',
  },
  headToHeadHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  headToHeadDealName: {
    flex: 1,
    fontWeight: '800',
    color: theme.text,
  },
  compareRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingVertical: 6,
  },
  compareLabel: {
    flex: 1.1,
    color: theme.textMuted,
    fontWeight: '700',
  },
  compareValue: {
    flex: 1,
    color: theme.text,
    fontWeight: '700',
  },
  scriptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...SHIELD_SURFACE.inset,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notesInput: {
    minHeight: 180,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.bg,
    padding: 16,
    color: theme.text,
  },
  quotePreview: {
    width: '100%',
    height: 220,
    borderRadius: theme.radius,
    backgroundColor: theme.surfaceInset,
  },
  removeText: {
    color: theme.dangerText,
    fontWeight: '700',
  },
});
