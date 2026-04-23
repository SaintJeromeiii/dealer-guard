import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import MainTabButton from '@/components/MainTabButton';
import ProgressBar from '@/components/ProgressBar';
import StatusBadge from '@/components/StatusBadge';
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
import { createInitialAppData } from '@/utils/app-state';
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
  buildOfferTimeline,
  buildPaperworkAudit,
  buildPaperworkAuditSummary,
  buildPressureSummary,
  buildPromiseSummary,
  buildQuickStartGuide,
  buildReferralLoop,
  buildSavingsOpportunity,
  buildSecondOpinionShare,
  buildSessionPlaybook,
  buildTradeInAssessment,
  buildVisitCaseSummary,
  compareSavedDeals,
  currency,
  getAddOnTotal,
  getFeeTotal,
  getReadinessLabel,
  getStateName,
  importQuoteText,
  scoreAnswers,
} from '@/utils/deals';
import { initializeBilling, purchaseProEntitlement, restoreProEntitlement } from '@/utils/billing';
import { loadAppData, resetStoredAppData, saveAppData } from '@/utils/storage';
import type { DealLineItem, ExperienceMode, MainTab, NegotiationFlag, PremiumTier, PromiseRecord, QuoteImportResult, SavedDeal, Screen, SelectedComparePair, Tone, VisitTimelineEntry, VisitTimelineEventType } from '@/utils/types';

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

function createSeriesId() {
  return `series-${makeId()}`;
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

function PremiumPreviewCard({
  title,
  detail,
  onPress,
}: {
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Card>
      <StatusBadge label="Dealer Guard Pro" tone="warn" />
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.detailText}>{detail}</Text>
      <AppButton label="Open Pro preview" onPress={onPress} />
    </Card>
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

export default function App() {
  const [mainTab, setMainTab] = useState<MainTab>('home');
  const [screen, setScreen] = useState<Screen>('home');
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
  const [promiseDraft, setPromiseDraft] = useState('');
  const [billingBusy, setBillingBusy] = useState(false);
  const [showProActivatedBanner, setShowProActivatedBanner] = useState(false);
  const [simulatorIndex, setSimulatorIndex] = useState(0);

  useEffect(() => {
    let active = true;

    loadAppData()
      .then((data) => {
        if (active) setAppData(data);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveAppData(appData).catch(() => {
      console.log('Save error');
    });
  }, [appData, loaded]);

  useEffect(() => {
    let active = true;

    initializeBilling(appData.subscription.tier)
      .then((billing) => {
        if (!active) return;
        setAppData((prev) => ({
          ...prev,
          billing,
        }));
      })
      .catch(() => {
        console.log('Billing init error');
      });

    return () => {
      active = false;
    };
  }, [appData.subscription.tier]);

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
  const tradeInAssessment = useMemo(() => buildTradeInAssessment(appData.deal), [appData.deal]);
  const marketBenchmarkAssessment = useMemo(
    () => buildMarketBenchmarkAssessment(appData.deal, dealAnalysis),
    [appData.deal, dealAnalysis]
  );
  const marketCompSnapshot = useMemo(() => buildMarketCompSnapshot(appData.deal, dealAnalysis), [appData.deal, dealAnalysis]);
  const paperworkAudit = useMemo(() => buildPaperworkAudit(appData.deal), [appData.deal]);
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
  const quickStartGuide = useMemo(() => buildQuickStartGuide(), []);
  const activeSeriesId = useMemo(() => {
    if (loadedDealId) {
      return appData.savedDeals.find((deal) => deal.id === loadedDealId)?.seriesId ?? null;
    }

    const normalizedDealer = appData.deal.dealershipName.trim().toLowerCase();
    if (!normalizedDealer) return null;
    return appData.savedDeals.find((deal) => deal.dealershipName.trim().toLowerCase() === normalizedDealer)?.seriesId ?? null;
  }, [appData.deal.dealershipName, appData.savedDeals, loadedDealId]);
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
  const isPro = appData.subscription.tier === 'pro';
  const experienceMode = appData.preferences.experienceMode;
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
    setEditableImportFields(
      Object.fromEntries(result.fieldReviews.map((item) => [item.field, item.value]))
    );
    setEditableFeeItems(result.feeItemReviews.map((item) => ({ id: item.id, label: item.label, amount: item.amount })));
    setEditableAddOnItems(result.addOnItemReviews.map((item) => ({ id: item.id, label: item.label, amount: item.amount })));
    appendTimelineEntry('quoteImported', 'Imported quote for review', `Matched ${result.matchedFields.length} field(s) from ${sourceLabel}.`);

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
    setPendingImport(null);
    setEditableImportFields({});
    setEditableFeeItems([]);
    setEditableAddOnItems([]);
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

  function setPremiumTier(tier: PremiumTier) {
    setAppData((prev) => ({
      ...prev,
      subscription: {
        ...prev.subscription,
        tier,
        upgradedAt: tier === 'pro' ? prev.subscription.upgradedAt ?? new Date().toISOString() : null,
      },
    }));
  }

  function enableLocalPreview() {
    setPremiumTier('pro');
    setMainTab('dealReview');
    setScreen('dealReview');
    setShowProActivatedBanner(true);
    Alert.alert('Dealer Guard Pro preview', 'Pro preview is now active on this device. Pro-only tools are unlocked locally for testing.');
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

  async function startPaywallPurchase() {
    setBillingBusy(true);

    try {
      const result = await purchaseProEntitlement();
      setPremiumTier(result.tier);
      Alert.alert('Dealer Guard Pro', result.note);
    } finally {
      setBillingBusy(false);
    }
  }

  async function restorePurchase() {
    setBillingBusy(true);

    try {
      const result = await restoreProEntitlement(appData.subscription.tier);
      setPremiumTier(result.tier);
      Alert.alert('Restore purchase', result.note);
    } finally {
      setBillingBusy(false);
    }
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
      console.log(error);
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
      console.log(error);
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

  async function exportBuyerCasePdf() {
    try {
      const Print = await import('expo-print');
      const Sharing = await import('expo-sharing');
      const html = `
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px;">
            <h1>Dealer Guard Buyer Case File</h1>
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
      console.log(error);
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

  function goHomeTab(tab: MainTab) {
    setMainTab(tab);
    setScreen(tab === 'home' ? 'home' : tab);
  }

  function startQuestionFlow() {
    setQuestionIndex(0);
    setMainTab('home');
    setScreen('questions');
  }

  function startQuickQuoteCheck() {
    setMainTab('dealReview');
    setScreen('dealReview');
  }

  function selectAnswer(value: string) {
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
    setAppData((prev) => ({
      ...prev,
      negotiationFlags: prev.negotiationFlags.includes(flag)
        ? prev.negotiationFlags.filter((item) => item !== flag)
        : [...prev.negotiationFlags, flag],
      pressureIncidents: prev.negotiationFlags.includes(flag)
        ? prev.pressureIncidents
        : [
            {
              id: makeId(),
              flag,
              dealershipName: prev.deal.dealershipName.trim() || 'Unnamed dealership',
              notedAt: new Date().toISOString(),
            },
            ...prev.pressureIncidents,
          ].slice(0, 50),
    }));
    if (!appData.negotiationFlags.includes(flag)) {
      incrementUsage('tacticsLogged');
      appendTimelineEntry('pressureLogged', 'Pressure tactic logged', `${flag} was marked during the dealership session.`);
    }
  }

  function addPromiseRecord() {
    const text = promiseDraft.trim();
    if (!text) {
      Alert.alert('Add a promise first', 'Type the salesperson promise before saving it.');
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
    setScreen('result');
  }

  function goBack() {
    if (questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
      return;
    }
    setScreen('home');
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
    }));
    incrementUsage('dealsSaved');
    appendTimelineEntry('offerSaved', 'Offer saved to timeline', `Saved revision ${revisionNumber} for ${newDeal.dealershipName}.`, newDeal.dealershipName);
    setLoadedDealId(newDeal.id);

    Alert.alert(
      'Deal saved',
      revisionNumber > 1 ? `Saved as revision ${revisionNumber} for this dealership timeline.` : 'This offer is now available in Compare dealership offers.'
    );
  }

  function loadSavedDeal(id: string) {
    const found = appData.savedDeals.find((item) => item.id === id);
    if (!found) return;

    const { id: _id, savedAt: _savedAt, seriesId: _seriesId, revisionNumber: _revisionNumber, basedOnDealId: _basedOnDealId, ...rest } = found;
    setAppData((prev) => ({
      ...prev,
      deal: rest,
    }));
    setLoadedDealId(id);
    setMainTab('dealReview');
    setScreen('dealReview');
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
            setAppData(createInitialAppData());
            setMainTab('home');
            setScreen('home');
            setQuestionIndex(0);
            setLoadedDealId(null);
            setSelectedComparePair({ firstId: null, secondId: null });
          },
        },
      ]
    );
  }

  if (!loaded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.heroText}>Loading your saved dealership prep data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentDealSummary = buildCurrentDealSummary(appData.deal, dealAnalysis);
  const negotiationPlanSummary = buildNegotiationPlanSummary(appData.deal, dealAnalysis, negotiationPlan);
  const paperworkAuditSummary = paperworkAudit ? buildPaperworkAuditSummary(appData.deal, paperworkAudit) : '';
  const dealInputGuidance = buildDealInputGuidance(appData.deal, dealConfidence);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.flexOne}>
            <Text style={styles.eyebrow}>DEALER GUARD</Text>
            <Text style={styles.headerTitle}>Car buyer protection</Text>
            <Text style={styles.headerSubtitle}>Prep, review, compare, and keep pressure tactics from steering the deal.</Text>
          </View>
          <TouchableOpacity onPress={confirmReset} style={styles.resetPill} activeOpacity={0.85}>
            <Text style={styles.resetPillText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          <View style={styles.tabSlot}>
            <MainTabButton label="Home" active={mainTab === 'home'} onPress={() => goHomeTab('home')} />
          </View>
          <View style={styles.tabSlot}>
            <MainTabButton label="Checklist" active={mainTab === 'checklist'} onPress={() => goHomeTab('checklist')} />
          </View>
          <View style={styles.tabSlot}>
            <MainTabButton label="Traps" active={mainTab === 'traps'} onPress={() => goHomeTab('traps')} />
          </View>
          <View style={styles.tabSlot}>
            <MainTabButton label="Deal" active={mainTab === 'dealReview'} onPress={() => goHomeTab('dealReview')} />
          </View>
          <View style={styles.tabSlot}>
            <MainTabButton label="Finance" active={mainTab === 'financeDefense'} onPress={() => goHomeTab('financeDefense')} />
          </View>
          <View style={styles.tabSlot}>
            <MainTabButton label="Notes" active={mainTab === 'notes'} onPress={() => goHomeTab('notes')} />
          </View>
        </ScrollView>

        {screen === 'home' && (
          <>
            <Card>
              <StatusBadge
                label={readinessLabel === 'Strong' ? 'Ready to negotiate' : readinessLabel === 'Almost Ready' ? 'Some weak spots' : 'At risk'}
                tone={readinessLabel === 'Strong' ? 'good' : readinessLabel === 'Almost Ready' ? 'warn' : 'bad'}
              />
              <Text style={styles.heroTitle}>Don&apos;t get played at the dealership</Text>
              <Text style={styles.heroText}>
                {experienceMode === 'firstTimeBuyer'
                  ? 'Start with the quote, let the app flag the biggest risks, and get help deciding what to ask before you sign anything.'
                  : 'Prepare before you walk in, spot pressure tactics, and review whether a deal actually makes sense.'}
              </Text>

              <View style={styles.proofRow}>
                <View style={styles.proofPill}>
                  <Text style={styles.proofPillValue}>Quote check</Text>
                  <Text style={styles.proofPillLabel}>Find the real structure fast</Text>
                </View>
                <View style={styles.proofPill}>
                  <Text style={styles.proofPillValue}>Savings hook</Text>
                  <Text style={styles.proofPillLabel}>See the clearest leverage first</Text>
                </View>
                <View style={styles.proofPill}>
                  <Text style={styles.proofPillValue}>Second opinion</Text>
                  <Text style={styles.proofPillLabel}>Share before you sign</Text>
                </View>
              </View>

              <View style={styles.heroWarningBox}>
                <Text style={styles.heroWarningTitle}>What you can do in the first 2 minutes</Text>
                {quickStartGuide.steps.map((step) => (
                  <Text key={step} style={styles.heroWarningText}>• {step}</Text>
                ))}
              </View>

              <View style={styles.stackGap}>
                <AppButton label="Quick quote check" onPress={startQuickQuoteCheck} />
                <AppButton
                  label={experienceMode === 'firstTimeBuyer' ? 'Start first-time buyer setup' : 'Start readiness check'}
                  variant="secondary"
                  onPress={startQuestionFlow}
                />
                <AppButton label="Open live dealership mode" variant="secondary" onPress={() => setScreen('liveMode')} />
              </View>
            </Card>

            <Card>
              <Text style={styles.menuTitle}>Start here</Text>
              <Text style={styles.detailText}>This version is tuned to get a useful answer quickly, even if the buyer only has a screenshot or a rushed quote in front of them.</Text>
              <View style={styles.onboardingGrid}>
                <View style={styles.onboardingStepCard}>
                  <Text style={styles.onboardingStepNumber}>1</Text>
                  <Text style={styles.bold}>Import the quote</Text>
                  <Text style={styles.infoBoxText}>Paste the worksheet or run photo OCR to extract price, APR, term, and fee lines.</Text>
                </View>
                <View style={styles.onboardingStepCard}>
                  <Text style={styles.onboardingStepNumber}>2</Text>
                  <Text style={styles.bold}>Read the verdict</Text>
                  <Text style={styles.infoBoxText}>Dealer Guard highlights the biggest risks, the cleanest counter move, and the likely savings lever.</Text>
                </View>
                <View style={styles.onboardingStepCard}>
                  <Text style={styles.onboardingStepNumber}>3</Text>
                  <Text style={styles.bold}>Share before signing</Text>
                  <Text style={styles.infoBoxText}>Use the second-opinion share so another person can sanity-check the deal with you.</Text>
                </View>
              </View>
            </Card>

            <Card>
              <Text style={styles.menuTitle}>Important note</Text>
              <Text style={styles.detailText}>
                Dealer Guard is a buyer-protection tool that helps you review numbers, pressure tactics, and paperwork. It is not legal, tax, credit, or financial advice, so use it as a second set of eyes before you decide what to sign.
              </Text>
            </Card>

            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.menuTitle}>First-time buyer mode</Text>
                <StatusBadge label={experienceMode === 'firstTimeBuyer' ? 'On' : 'Standard'} tone={experienceMode === 'firstTimeBuyer' ? 'good' : 'warn'} />
              </View>
              <Text style={styles.detailText}>
                {experienceMode === 'firstTimeBuyer'
                  ? 'The app is now emphasizing the fastest path: quote review first, simpler guidance, and fewer assumptions that you already know dealership jargon.'
                  : 'Turn this on to make the app feel more guided and beginner-friendly for newer buyers.'}
              </Text>
              <View style={styles.doubleButtons}>
                <View style={styles.flexOne}>
                  <AppButton label="Standard mode" variant="secondary" onPress={() => setExperienceMode('standard')} />
                </View>
                <View style={styles.flexOne}>
                  <AppButton label="First-time mode" onPress={() => setExperienceMode('firstTimeBuyer')} />
                </View>
              </View>
            </Card>

            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.menuTitle}>Potential savings</Text>
                <StatusBadge
                  label={savingsOpportunity.estimatedSavings > 0 ? currency(savingsOpportunity.estimatedSavings) : savingsOpportunity.strongestLever}
                  tone={savingsOpportunity.tone}
                />
              </View>
              <Text style={styles.detailText}>{savingsOpportunity.headline}</Text>
              <Text style={styles.detailText}>{savingsOpportunity.detail}</Text>
              <Text style={styles.detailText}>
                <Text style={styles.bold}>Strongest lever: </Text>
                {savingsOpportunity.strongestLever}
              </Text>
            </Card>

            <Card>
              <Text style={styles.menuTitle}>Why buyers trust this screen</Text>
              <View style={styles.stackGapSmall}>
                <View style={styles.infoBox}>
                  <Text style={styles.bold}>It stays on the written numbers</Text>
                  <Text style={styles.infoBoxText}>The app is built around vehicle price, fees, add-ons, APR, term, trade, and contract mismatches instead of dealership sales language.</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.bold}>It catches structure, not just price</Text>
                  <Text style={styles.infoBoxText}>A deal can look affordable monthly while still being bad overall. Dealer Guard surfaces payment-stretching, padded extras, and weak trade handling.</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.bold}>It helps you slow the moment down</Text>
                  <Text style={styles.infoBoxText}>Use the second-opinion share, paperwork audit, and live coaching prompts to avoid rushed decisions on the lot.</Text>
                </View>
              </View>
            </Card>

            <View style={styles.stackGap}>
              <TouchableOpacity style={styles.menuCard} onPress={() => setScreen('upgradeHub')} activeOpacity={0.85}>
                <Text style={styles.menuTitle}>Dealer Guard Pro</Text>
                <Text style={styles.menuDesc}>
                  {isPro
                    ? 'Pro preview is active. Open your upgrade hub to review premium positioning and pricing.'
                    : 'Shape a premium tier around buyer reports, dealer scorecards, and live session playbooks.'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuCard} onPress={() => setScreen('traps')} activeOpacity={0.85}>
                <Text style={styles.menuTitle}>Trap library</Text>
                <Text style={styles.menuDesc}>Learn common dealership tactics and what to say back.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuCard} onPress={() => setScreen('checklist')} activeOpacity={0.85}>
                <Text style={styles.menuTitle}>Checklist</Text>
                <Text style={styles.menuDesc}>Know what to bring and what to check before signing.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuCard} onPress={() => setScreen('dealReview')} activeOpacity={0.85}>
                <Text style={styles.menuTitle}>Deal review</Text>
                <Text style={styles.menuDesc}>Break down vehicle price, fees, APR, add-ons, notes, and local state context.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuCard} onPress={() => setScreen('financeDefense')} activeOpacity={0.85}>
                <Text style={styles.menuTitle}>Finance office defense</Text>
                <Text style={styles.menuDesc}>Protect yourself from warranty, GAP, and add-on pressure in the finance office.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuCard} onPress={() => setScreen('tacticDecoder')} activeOpacity={0.85}>
                <Text style={styles.menuTitle}>Sales tactic decoder</Text>
                <Text style={styles.menuDesc}>Tap what the salesperson said and get instant coaching on what it means and how to respond.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuCard} onPress={() => setScreen('compareDeals')} activeOpacity={0.85}>
                <Text style={styles.menuTitle}>Compare dealership offers</Text>
                <Text style={styles.menuDesc}>Save multiple offers and compare total cost, monthly payment, notes, and risk side by side.</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {screen === 'questions' && (
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
        )}

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

            <View style={styles.stackGap}>
              <AppButton label="Checklist" onPress={() => setScreen('checklist')} />
              <AppButton label="Deal review" variant="secondary" onPress={() => setScreen('dealReview')} />
              <AppButton label="Home" variant="secondary" onPress={() => setScreen('home')} />
            </View>
          </>
        )}

        {screen === 'traps' && (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.screenTitle}>Trap library</Text>
              <TouchableOpacity onPress={() => setScreen('home')}>
                <Text style={styles.linkText}>Home</Text>
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
              <TouchableOpacity onPress={() => setScreen('home')}>
                <Text style={styles.linkText}>Home</Text>
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

        {screen === 'liveMode' && (
          <Card>
            <View style={styles.rowBetween}>
              <Text style={styles.screenTitle}>Live dealership mode</Text>
              <StatusBadge label={dealAnalysis.dealVerdict} tone={dealAnalysis.dealGradeTone} />
            </View>
            <Text style={styles.heroText}>Keep your guard up while you&apos;re sitting at the lot.</Text>

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
                  <Text style={styles.detailText}>No incidents logged yet. Tap the tactics below when they happen and the session record will build automatically.</Text>
                )}
              </View>
            </Card>

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
                    <View style={styles.stackGap}>
                      <AppButton label={`Copy ${item.label.toLowerCase()}`} variant="secondary" onPress={() => void copyText(item.label, item.script)} />
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            {isPro ? (
              <Card>
                <Text style={styles.menuTitle}>Session playbook</Text>
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
                title="Session playbook is a premium coaching feature"
                detail="This is one of the clearest upgrade moments in the app because it converts scattered analysis into the exact order the buyer should use in the dealership conversation."
                onPress={() => setScreen('upgradeHub')}
              />
            )}

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
          </Card>
        )}

        {screen === 'dealReview' && (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.screenTitle}>Deal review</Text>
              <TouchableOpacity onPress={() => setScreen('home')}>
                <Text style={styles.linkText}>Home</Text>
              </TouchableOpacity>
            </View>

            {showProActivatedBanner ? (
              <Card>
                <View style={styles.rowBetween}>
                  <Text style={styles.menuTitle}>Pro preview active</Text>
                  <StatusBadge label="Unlocked" tone="good" />
                </View>
                <Text style={styles.detailText}>Dealer Guard Pro tools are now unlocked locally on this device for testing.</Text>
                <AppButton label="Continue" variant="secondary" onPress={() => setShowProActivatedBanner(false)} />
              </Card>
            ) : null}

            <Card>
              <Text style={styles.menuTitle}>Paste quote text</Text>
              <Text style={styles.heroText}>
                {experienceMode === 'firstTimeBuyer'
                  ? 'Start here if you just want the app to check whether the quote feels clean or risky. Paste a worksheet, text message, or email quote and Dealer Guard will pull out the important numbers.'
                  : 'Paste a worksheet, text message, or email quote. Dealer Guard will try to pull out price, APR, term, trade, and fee/add-on lines.'}
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
                label="Target total paid"
                value={appData.deal.targetTotalPaid}
                onChangeText={(text) => updateDeal('targetTotalPaid', text)}
                placeholder="28500"
              />
              <DealInput label="Dealer fees total (fallback)" value={appData.deal.dealerFees} onChangeText={(text) => updateDeal('dealerFees', text)} placeholder="995" />
              <DealInput label="Fee labels or line items" value={appData.deal.feeNames} onChangeText={(text) => updateDeal('feeNames', text)} placeholder="Doc fee, dealer prep, etching" numeric={false} />
              <LineItemEditor
                title="Fee line"
                items={appData.deal.feeItems}
                onChange={(id, key, value) => updateDealLineItem('feeItems', id, key, value)}
                onAdd={() => addDealLineItem('feeItems')}
                onRemove={(id) => removeDealLineItem('feeItems', id)}
              />
              <Text style={styles.detailText}>Structured fee total: {currency(getFeeTotal(appData.deal))}</Text>
              <DealInput label="Add-ons total (fallback)" value={appData.deal.addOns} onChangeText={(text) => updateDeal('addOns', text)} placeholder="0" />
              <LineItemEditor
                title="Add-on line"
                items={appData.deal.addOnItems}
                onChange={(id, key, value) => updateDealLineItem('addOnItems', id, key, value)}
                onAdd={() => addDealLineItem('addOnItems')}
                onRemove={(id) => removeDealLineItem('addOnItems', id)}
              />
              <Text style={styles.detailText}>Structured add-on total: {currency(getAddOnTotal(appData.deal))}</Text>
              <DealInput label="Down payment" value={appData.deal.downPayment} onChangeText={(text) => updateDeal('downPayment', text)} placeholder="3000" />
              <DealInput label="Trade-in value" value={appData.deal.tradeIn} onChangeText={(text) => updateDeal('tradeIn', text)} placeholder="4000" />
              <DealInput
                label="Outside trade benchmark"
                value={appData.deal.tradeReferenceValue}
                onChangeText={(text) => updateDeal('tradeReferenceValue', text)}
                placeholder="6500"
              />
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
              <Text style={styles.detailText}>Choose a buyer&apos;s order or contract photo and let Dealer Guard prefill the paperwork audit from OCR before you sign.</Text>
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

            <Card>
              <Text style={styles.menuTitle}>Final paperwork audit</Text>
              <Text style={styles.detailText}>Before signing, enter the numbers from the buyer&apos;s order or finance contract here. Dealer Guard will compare them against the reviewed offer and flag late changes.</Text>
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
                    <StatusBadge label={paperworkAudit.readyToSign ? 'Matches offer' : 'Review contract'} tone={paperworkAudit.summaryTone} />
                  </View>
                  <Text style={styles.detailText}>{paperworkAudit.headline}</Text>
                  <View style={styles.stackGapSmall}>
                    {paperworkAudit.items.map((item) => (
                      <View key={item.label} style={styles.infoBox}>
                        <Text style={styles.bold}>{item.label}</Text>
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
                        void shareText('Dealer Guard paperwork audit', paperworkAuditSummary);
                      }}
                    />
                  </View>
                </>
              ) : (
                <Text style={styles.detailText}>Enter any contract numbers above to start the audit.</Text>
              )}
            </Card>

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
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Total paid</Text>
                  <Text style={styles.statValue}>{currency(dealAnalysis.totalPaid)}</Text>
                </View>
              </View>

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
                <AppButton label="Save this offer" onPress={saveCurrentDeal} />
                <AppButton label="Copy offer summary" variant="secondary" onPress={() => void copyText('Offer summary', currentDealSummary)} />
                <AppButton label="Share offer summary" variant="secondary" onPress={() => void shareText('Dealer Guard offer review', currentDealSummary)} />
              </View>
            </Card>

            {isPro ? (
              <Card>
                <Text style={styles.menuTitle}>Shareable buyer report</Text>
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
                      void shareText('Dealer Guard buyer report', buyerReport);
                    }}
                  />
                  <AppButton label="Export buyer case file PDF" variant="secondary" onPress={() => void exportBuyerCasePdf()} />
                </View>
              </Card>
            ) : (
              <PremiumPreviewCard
                title="Buyer report belongs in Pro"
                detail="It is an easy premium sell because buyers want a clean second-opinion summary they can text to someone they trust before signing."
                onPress={() => setScreen('upgradeHub')}
              />
            )}

            <Card>
              <Text style={styles.menuTitle}>Second-opinion share</Text>
              <Text style={styles.detailText}>Turn this deal into a fast message you can text to a spouse, friend, or advisor before you sign. This is free on purpose so the app can travel person-to-person.</Text>
              <View style={styles.stackGap}>
                <AppButton
                  label="Copy second-opinion text"
                  variant="secondary"
                  onPress={() => {
                    incrementUsage('referralShares');
                    appendTimelineEntry('referralShared', 'Second-opinion summary copied', 'Copied the fast second-opinion text for outside review.');
                    void copyText('Second-opinion text', secondOpinionShare);
                  }}
                />
                <AppButton
                  label="Share second-opinion text"
                  onPress={() => {
                    incrementUsage('referralShares');
                    appendTimelineEntry('referralShared', 'Second-opinion summary shared', 'Shared the fast second-opinion message with someone else.');
                    void shareText('Help me review this deal', secondOpinionShare);
                  }}
                />
              </View>
            </Card>

            <Card>
              <Text style={styles.menuTitle}>Invite someone else into Dealer Guard</Text>
              <Text style={styles.detailText}>{referralLoop.headline}</Text>
              <Text style={styles.detailText}>{referralLoop.detail}</Text>
              <View style={styles.stackGap}>
                <AppButton
                  label="Share invite message"
                  variant="secondary"
                  onPress={() => {
                    incrementUsage('referralShares');
                    appendTimelineEntry('referralShared', 'Invite message shared', 'Shared a Dealer Guard invite after the second-opinion flow.');
                    void shareText('Try Dealer Guard', referralLoop.inviteMessage);
                  }}
                />
                <AppButton
                  label="Copy follow-up invite"
                  onPress={() => {
                    incrementUsage('referralShares');
                    appendTimelineEntry('referralShared', 'Follow-up invite copied', 'Copied a follow-up invite message for a friend or advisor.');
                    void copyText('Follow-up invite', referralLoop.followUpMessage);
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
                    <Text style={styles.statLabel}>Target total</Text>
                    <Text style={styles.statValue}>{currency(actionRecommendation.targetTotalPaid)}</Text>
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

            {tradeInAssessment && (
              <Card>
                <View style={styles.rowBetween}>
                  <Text style={styles.menuTitle}>Trade-in fairness</Text>
                  <StatusBadge label={tradeInAssessment.tone === 'good' ? 'Fair trade' : tradeInAssessment.tone === 'bad' ? 'Trade risk' : 'Review trade'} tone={tradeInAssessment.tone} />
                </View>
                <Text style={styles.detailText}>{tradeInAssessment.detail}</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Dealer trade</Text>
                    <Text style={styles.statValue}>{currency(tradeInAssessment.offeredValue)}</Text>
                  </View>
                  {tradeInAssessment.benchmarkValue > 0 ? (
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>Benchmark</Text>
                      <Text style={styles.statValue}>{currency(tradeInAssessment.benchmarkValue)}</Text>
                    </View>
                  ) : null}
                  {tradeInAssessment.payoffBalance > 0 ? (
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>Payoff</Text>
                      <Text style={styles.statValue}>{currency(tradeInAssessment.payoffBalance)}</Text>
                    </View>
                  ) : null}
                </View>
                {tradeInAssessment.payoffBalance > 0 ? (
                  <Text style={styles.detailText}>
                    Current equity position: {tradeInAssessment.equity >= 0 ? currency(tradeInAssessment.equity) : `-${currency(Math.abs(tradeInAssessment.equity))}`}
                  </Text>
                ) : null}
                <View style={styles.scriptBox}>
                  <Text style={styles.detailText}>
                    <Text style={styles.bold}>Say this: </Text>
                    {tradeInAssessment.negotiationScript}
                  </Text>
                </View>
              </Card>
            )}

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
                <AppButton label="Share negotiation blueprint" onPress={() => void shareText('Dealer Guard negotiation blueprint', negotiationPlanSummary)} />
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
          </>
        )}

        {screen === 'financeDefense' && (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.screenTitle}>Finance office defense</Text>
              <TouchableOpacity onPress={() => setScreen('home')}>
                <Text style={styles.linkText}>Home</Text>
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

        {screen === 'tacticDecoder' && (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.screenTitle}>Sales tactic decoder</Text>
              <TouchableOpacity onPress={() => setScreen('home')}>
                <Text style={styles.linkText}>Home</Text>
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
            </Card>

            <Card>
              <Text style={styles.menuTitle}>Quick scripts</Text>
              <View style={styles.stackGapSmall}>
                {quickScripts.map((script) => (
                  <TouchableOpacity key={script} style={styles.scriptRow} activeOpacity={0.85} onPress={() => void copyText('Script', script)}>
                    <Text style={styles.flexOne}>{script}</Text>
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

        {screen === 'compareDeals' && (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.screenTitle}>Compare dealership offers</Text>
              <TouchableOpacity onPress={() => setScreen('home')}>
                <Text style={styles.linkText}>Home</Text>
              </TouchableOpacity>
            </View>

            {appData.savedDeals.length === 0 ? (
              <Card>
                <Text style={styles.heroText}>No saved deals yet. Start in Deal review, enter or import one quote, then save it here so you can compare dealerships side by side.</Text>
                <View style={styles.stackGap}>
                  <AppButton label="Go to Deal review" onPress={() => setScreen('dealReview')} />
                </View>
              </Card>
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
                  (isPro ? (
                    <Card>
                      <Text style={styles.menuTitle}>Dealer scorecards</Text>
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
                      title="Dealer scorecards are a premium trust layer"
                      detail="This is the kind of historical accountability view buyers cannot easily build on their own, which makes it strong subscription material."
                      onPress={() => setScreen('upgradeHub')}
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
                    {comparison.reasons.length > 0 && (
                      <View style={styles.gradePanel}>
                        <Text style={styles.bold}>Why it currently wins</Text>
                        {comparison.reasons.map((reason) => (
                          <Text key={reason} style={styles.detailText}>
                            • {reason}
                          </Text>
                        ))}
                      </View>
                    )}
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
                              'Dealer Guard comparison summary',
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
              <Text style={styles.screenTitle}>Dealer Guard Pro</Text>
              <TouchableOpacity onPress={() => setScreen('home')}>
                <Text style={styles.linkText}>Home</Text>
              </TouchableOpacity>
            </View>

            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.menuTitle}>Current plan</Text>
                <StatusBadge label={isPro ? 'Pro preview' : 'Free plan'} tone={isPro ? 'good' : 'warn'} />
              </View>
              <Text style={styles.detailText}>{monetizationSummary.headline}</Text>
              <Text style={styles.detailText}>{monetizationSummary.detail}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Monthly</Text>
                  <Text style={styles.statValue}>{monetizationSummary.monthlyPriceLabel}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Annual</Text>
                  <Text style={styles.statValue}>{monetizationSummary.annualPriceLabel}</Text>
                </View>
              </View>
              <View style={styles.doubleButtons}>
                <View style={styles.flexOne}>
                  <AppButton label="Use free plan" variant="secondary" onPress={() => setPremiumTier('free')} />
                </View>
                <View style={styles.flexOne}>
                  <AppButton label={billingBusy ? 'Processing...' : 'Unlock Dealer Guard Pro'} onPress={() => void startPaywallPurchase()} disabled={billingBusy} />
                </View>
              </View>
              <View style={styles.doubleButtons}>
                <View style={styles.flexOne}>
                  <AppButton label="Restore purchase" variant="secondary" onPress={() => void restorePurchase()} disabled={billingBusy} />
                </View>
                <View style={styles.flexOne}>
                  <AppButton
                    label={isPro ? 'Local preview active' : 'Use local preview'}
                    variant="secondary"
                    onPress={enableLocalPreview}
                    disabled={isPro}
                  />
                </View>
              </View>
              <Text style={styles.detailText}>
                Billing provider: {appData.billing.provider === 'revenuecat' ? 'RevenueCat-ready configuration detected' : 'Local mock paywall active'}.
              </Text>
              <Text style={styles.detailText}>
                Offerings synced: {appData.billing.offeringsLoaded ? 'Yes' : 'No'}{appData.billing.lastSyncAt ? ` • Last sync ${new Date(appData.billing.lastSyncAt).toLocaleString()}` : ''}
              </Text>
            </Card>

            <Card>
              <Text style={styles.menuTitle}>Why this app can charge</Text>
              <View style={styles.stackGapSmall}>
                {monetizationSummary.reasons.map((reason) => (
                  <Text key={reason} style={styles.detailText}>
                    • {reason}
                  </Text>
                ))}
              </View>
            </Card>

            <Card>
              <Text style={styles.menuTitle}>Premium feature stack</Text>
              <View style={styles.stackGapSmall}>
                {monetizationSummary.featureCards.map((card) => (
                  <View key={card.title} style={styles.infoBox}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.bold}>{card.title}</Text>
                      <StatusBadge label={card.badge} tone={card.unlocked ? 'good' : 'warn'} />
                    </View>
                    <Text style={styles.infoBoxText}>{card.detail}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card>
              <Text style={styles.menuTitle}>Usage signals</Text>
              <Text style={styles.detailText}>These are the moments most likely to support conversion once you connect real billing.</Text>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>OCR imports</Text>
                  <Text style={styles.statValue}>{appData.subscription.usage.ocrImports}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Buyer reports</Text>
                  <Text style={styles.statValue}>{appData.subscription.usage.reportsShared}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Deals saved</Text>
                  <Text style={styles.statValue}>{appData.subscription.usage.dealsSaved}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Tactics logged</Text>
                  <Text style={styles.statValue}>{appData.subscription.usage.tacticsLogged}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Referral shares</Text>
                  <Text style={styles.statValue}>{appData.subscription.usage.referralShares}</Text>
                </View>
              </View>
            </Card>
          </>
        )}

        {screen === 'notes' && (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.screenTitle}>Dealership notes</Text>
              <TouchableOpacity onPress={() => setScreen('home')}>
                <Text style={styles.linkText}>Home</Text>
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
              <AppButton
                label="Save visit note to timeline"
                variant="secondary"
                onPress={() => {
                  const text = appData.notes.trim();
                  if (!text) {
                    Alert.alert('Add a note first', 'Type a dealership note before saving it to the visit timeline.');
                    return;
                  }
                  appendTimelineEntry('noteAdded', 'Visit note saved', text);
                }}
              />
            </Card>
            <Card>
              <Text style={styles.menuTitle}>Dealership visit timeline</Text>
              <Text style={styles.detailText}>This turns the current dealership interaction into a reusable case file you can review later or share with someone else.</Text>
              <View style={styles.stackGap}>
                <AppButton label="Copy visit case file" variant="secondary" onPress={() => void copyText('Visit case file', visitCaseSummary)} />
              </View>
              <View style={styles.stackGapSmall}>
                {appData.visitTimeline.length > 0 ? (
                  appData.visitTimeline.slice(0, 10).map((entry) => (
                    <View key={entry.id} style={styles.infoBox}>
                      <Text style={styles.bold}>{entry.title}</Text>
                      <Text style={styles.infoBoxText}>{entry.detail}</Text>
                      <Text style={styles.infoBoxText}>{entry.dealershipName}</Text>
                      <Text style={styles.infoBoxText}>{new Date(entry.createdAt).toLocaleString()}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerSubtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  resetPill: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resetPillText: {
    color: '#334155',
    fontWeight: '600',
  },
  tabBar: {
    gap: 8,
    paddingVertical: 4,
  },
  tabSlot: {
    width: 108,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: '#0f172a',
  },
  heroText: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  heroWarningBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  heroWarningTitle: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 15,
  },
  heroWarningText: {
    color: '#1e3a8a',
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  proofPillValue: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 13,
  },
  proofPillLabel: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 16,
  },
  stackGap: {
    gap: 12,
  },
  stackGapSmall: {
    gap: 8,
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 6,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  menuTitleActive: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  menuDesc: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  onboardingGrid: {
    gap: 10,
  },
  onboardingStepCard: {
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 6,
  },
  onboardingStepNumber: {
    color: '#2563eb',
    fontWeight: '800',
    fontSize: 22,
    lineHeight: 24,
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
    color: '#0f172a',
  },
  linkText: {
    color: '#2563eb',
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  questionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  questionSubtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  optionButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  optionButtonActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  optionText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  optionTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  doubleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  flexOne: {
    flex: 1,
  },
  infoBox: {
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 4,
  },
  infoBoxText: {
    color: '#334155',
    lineHeight: 20,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
  },
  warningRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  warningBullet: {
    color: '#b91c1c',
    fontWeight: '800',
    lineHeight: 20,
  },
  warningText: {
    flex: 1,
    color: '#7f1d1d',
    lineHeight: 20,
  },
  detailText: {
    color: '#334155',
    lineHeight: 21,
  },
  detailTextActive: {
    color: '#e2e8f0',
    lineHeight: 21,
  },
  bold: {
    fontWeight: '800',
    color: '#0f172a',
  },
  scriptBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 18,
    padding: 14,
  },
  checkItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  checkItemActive: {
    backgroundColor: '#dcfce7',
  },
  checkMark: {
    color: '#64748b',
    fontWeight: '800',
  },
  checkMarkActive: {
    color: '#166534',
    fontWeight: '800',
  },
  checkText: {
    flex: 1,
    color: '#334155',
  },
  checkTextActive: {
    flex: 1,
    color: '#166534',
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
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 4,
  },
  statLabel: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 12,
  },
  statValue: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 18,
  },
  flagCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 14,
    gap: 6,
  },
  flagCardActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  inputWrap: {
    gap: 6,
  },
  lineItemCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 12,
    gap: 8,
  },
  inputLabel: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
  input: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    color: '#0f172a',
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
    color: '#0f172a',
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
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  stateChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  stateChipText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  stateChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  gradePanel: {
    borderRadius: 18,
    backgroundColor: '#f8fafc',
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
    color: '#0f172a',
  },
  comparePickButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  comparePickButtonActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  comparePickButtonText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  comparePickButtonTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  headToHeadHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  headToHeadDealName: {
    flex: 1,
    fontWeight: '800',
    color: '#0f172a',
  },
  compareRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingVertical: 6,
  },
  compareLabel: {
    flex: 1.1,
    color: '#64748b',
    fontWeight: '700',
  },
  compareValue: {
    flex: 1,
    color: '#0f172a',
    fontWeight: '700',
  },
  scriptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notesInput: {
    minHeight: 180,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    padding: 16,
    color: '#0f172a',
  },
  quotePreview: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
  },
  removeText: {
    color: '#b91c1c',
    fontWeight: '700',
  },
});
