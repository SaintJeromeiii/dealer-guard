export type Screen =
  | 'home'
  | 'questions'
  | 'result'
  | 'traps'
  | 'checklist'
  | 'liveMode'
  | 'dealReview'
  | 'financeDefense'
  | 'tacticDecoder'
  | 'compareDeals'
  | 'upgradeHub'
  | 'notes';

export type MainTab = 'home' | 'checklist' | 'traps' | 'dealReview' | 'financeDefense' | 'notes';
export type Tone = 'good' | 'warn' | 'bad';
export type PremiumTier = 'free' | 'pro';
export type ExperienceMode = 'standard' | 'firstTimeBuyer';
export type BillingProvider = 'mock' | 'revenuecat';
export type ReadinessLabel = 'Strong' | 'Almost Ready' | 'Not Ready';
export type DealVerdict = 'Fair Deal' | 'Review Carefully' | 'Bad Deal' | 'Walk Away';
export type NegotiationFlag = 'paymentShift' | 'todayOnly' | 'managerTrip' | 'bundleAddOn' | 'wontPrint' | 'tradeMix';
export type PromiseStatus = 'open' | 'kept' | 'broken';
export type PressureIncident = {
  id: string;
  flag: NegotiationFlag;
  dealershipName: string;
  notedAt: string;
};

export type VisitTimelineEventType =
  | 'quoteImported'
  | 'offerSaved'
  | 'pressureLogged'
  | 'promiseLogged'
  | 'promiseUpdated'
  | 'reportShared'
  | 'referralShared'
  | 'paperworkChecked'
  | 'noteAdded';

export type VisitTimelineEntry = {
  id: string;
  dealershipName: string;
  type: VisitTimelineEventType;
  title: string;
  detail: string;
  createdAt: string;
};
export type PromiseRecord = {
  id: string;
  dealershipName: string;
  text: string;
  status: PromiseStatus;
  notedAt: string;
  resolvedAt: string | null;
};

export type Answers = Record<string, string>;
export type CheckedItems = Record<string, boolean>;

export type Question = {
  id: string;
  title: string;
  subtitle: string;
  options: string[];
};

export type TrapCard = {
  title: string;
  danger: string;
  why: string;
  response: string;
};

export type ChecklistSection = {
  title: string;
  items: string[];
};

export type DealLineItem = {
  id: string;
  label: string;
  amount: string;
};

export type DealState = {
  buyerStateCode: string;
  dealershipName: string;
  offerNotes: string;
  importedQuoteText: string;
  importedPhotoUri: string;
  importReviewNotes: string[];
  vehiclePrice: string;
  marketVehiclePrice: string;
  marketComparablePricesText: string;
  outsideLenderApr: string;
  outsideLenderTerm: string;
  targetTotalPaid: string;
  tradeReferenceValue: string;
  tradePayoff: string;
  contractImportedPhotoUri: string;
  contractImportReviewNotes: string[];
  contractVehiclePrice: string;
  contractFees: string;
  contractAddOns: string;
  contractDownPayment: string;
  contractTradeIn: string;
  contractApr: string;
  contractMonths: string;
  dealerFees: string;
  feeNames: string;
  feeItems: DealLineItem[];
  addOns: string;
  addOnItems: DealLineItem[];
  downPayment: string;
  tradeIn: string;
  apr: string;
  months: string;
};

export type SavedDeal = DealState & {
  id: string;
  savedAt: string;
  seriesId: string;
  revisionNumber: number;
  basedOnDealId: string | null;
};

export type SelectedComparePair = {
  firstId: string | null;
  secondId: string | null;
};

export type SuspiciousFeeRule = {
  key: string;
  label: string;
  reason: string;
};

export type DealAnalysisBreakdownItem = {
  label: string;
  effect: number;
  reason: string;
  tone: Tone;
};

export type DealAnalysis = {
  flaggedFees: SuspiciousFeeRule[];
  amountFinanced: number;
  monthlyPayment: number;
  totalPaid: number;
  dealWarnings: string[];
  dangerScore: number;
  dealVerdict: DealVerdict;
  dealGradeTone: Tone;
  dealGuidance: string;
  scoreBreakdown: DealAnalysisBreakdownItem[];
  explanation: string[];
  stateContext: string;
};

export type DealConfidence = {
  score: number;
  label: 'High confidence' | 'Medium confidence' | 'Low confidence';
  tone: Tone;
  presentFields: string[];
  missingFields: string[];
  detail: string;
};

export type DealInputQuestion = {
  label: string;
  question: string;
  reason: string;
};

export type DealInputGuidance = {
  headline: string;
  detail: string;
  tone: Tone;
  questions: DealInputQuestion[];
};

export type PromiseSummary = {
  headline: string;
  openCount: number;
  keptCount: number;
  brokenCount: number;
  recent: PromiseRecord[];
};

export type DealerScorecard = {
  dealershipName: string;
  tone: Tone;
  headline: string;
  revisionCount: number;
  pressureCount: number;
  brokenPromiseCount: number;
  keptPromiseCount: number;
  latestVerdict: DealVerdict | 'No saved offer yet';
  latestTotalPaid: number | null;
};

export type DealerReputationReport = {
  dealershipName: string;
  trustScore: number;
  tone: Tone;
  headline: string;
  highlights: string[];
};

export type RankedDeal = {
  deal: SavedDeal;
  analysis: DealAnalysis;
  rankScore: number;
};

export type DealComparisonResult = {
  winner: RankedDeal;
  runnerUp: RankedDeal | null;
  ranked: RankedDeal[];
  reasons: string[];
};

export type ComparisonInsight = {
  label: string;
  winner: 'left' | 'right' | 'tie';
  detail: string;
};

export type CounterOfferMove = {
  title: string;
  detail: string;
};

export type LiveCoachingPlan = {
  headline: string;
  immediateScript: string;
  nextQuestions: string[];
  walkAwayTriggers: string[];
};

export type LiveResponseOption = {
  label: string;
  script: string;
  reason: string;
};

export type LiveResponsePack = {
  headline: string;
  responses: LiveResponseOption[];
};

export type SessionPlaybookStep = {
  title: string;
  detail: string;
  tone: Tone;
};

export type SessionPlaybook = {
  headline: string;
  steps: SessionPlaybookStep[];
};

export type DealImprovementScenario = {
  title: string;
  detail: string;
  monthlyChange: number;
  totalChange: number;
  script: string;
  tradeoff?: string;
};

export type NegotiationPlan = {
  headline: string;
  strongestMove: string;
  scenarios: DealImprovementScenario[];
};

export type OfferRevisionInsight = {
  label: string;
  tone: Tone;
  detail: string;
};

export type OfferTimelineEntry = {
  deal: SavedDeal;
  analysis: DealAnalysis;
  insights: OfferRevisionInsight[];
};

export type DealActionRecommendation = {
  action: 'Buy' | 'Counter' | 'Leave';
  tone: Tone;
  headline: string;
  detail: string;
  targetTotalPaid?: number;
  targetMonthlyPayment?: number;
};

export type TradeInAssessment = {
  offeredValue: number;
  benchmarkValue: number;
  payoffBalance: number;
  equity: number;
  valueGap: number;
  tone: Tone;
  headline: string;
  detail: string;
  negotiationScript: string;
};

export type PaperworkAuditItem = {
  label: string;
  expectedValue: string;
  contractValue: string;
  tone: Tone;
  detail: string;
};

export type PaperworkAudit = {
  headline: string;
  summaryTone: Tone;
  readyToSign: boolean;
  items: PaperworkAuditItem[];
};

export type MarketBenchmarkAssessment = {
  headline: string;
  tone: Tone;
  vehiclePriceGap: number;
  totalPaidGap: number;
  detail: string;
  negotiationScript: string;
};

export type MarketCompSnapshot = {
  averageComparablePrice: number;
  comparableCount: number;
  lenderApr: number;
  lenderTerm: number;
  lenderSavingsEstimate: number;
  headline: string;
  detail: string;
};

export type QuoteImportResult = {
  parsedDeal: Partial<DealState>;
  reviewNotes: string[];
  matchedFields: string[];
  missingFields: string[];
  fieldReviews: ImportFieldReview[];
  feeItemReviews: ImportLineItemReview[];
  addOnItemReviews: ImportLineItemReview[];
};

export type ImportFieldReview = {
  field: string;
  value: string;
  confidence: 'high' | 'medium';
  note: string;
};

export type ImportLineItemReview = {
  id: string;
  label: string;
  amount: string;
  confidence: 'high' | 'medium';
  note: string;
};

export type FinanceOfficeItem = {
  title: string;
  danger: string;
  watch: string;
  script: string;
};

export type SalesTacticItem = {
  line: string;
  tactic: string;
  why: string;
  risk: string;
  script: string;
};

export type NegotiationFlagItem = {
  id: NegotiationFlag;
  label: string;
  meaning: string;
  response: string;
};

export type StateOption = {
  code: string;
  name: string;
};

export type HonestyScorePart = {
  label: string;
  delta: number;
  reason: string;
};

export type HonestyScore = {
  score: number;
  label: string;
  tone: Tone;
  notes: string[];
  breakdown: HonestyScorePart[];
};

export type SubscriptionUsage = {
  ocrImports: number;
  reportsShared: number;
  dealsSaved: number;
  tacticsLogged: number;
  referralShares: number;
};

export type SubscriptionState = {
  tier: PremiumTier;
  upgradedAt: string | null;
  usage: SubscriptionUsage;
};

export type BillingState = {
  provider: BillingProvider;
  isConfigured: boolean;
  offeringsLoaded: boolean;
  packageLabel: string;
  lastSyncAt: string | null;
};

export type MonetizationFeatureCard = {
  title: string;
  detail: string;
  badge: string;
  unlocked: boolean;
};

export type MonetizationSummary = {
  headline: string;
  detail: string;
  monthlyPriceLabel: string;
  annualPriceLabel: string;
  reasons: string[];
  featureCards: MonetizationFeatureCard[];
};

export type SavingsOpportunity = {
  headline: string;
  detail: string;
  estimatedSavings: number;
  strongestLever: string;
  tone: Tone;
};

export type QuickStartGuide = {
  headline: string;
  steps: string[];
};

export type NegotiationSimulationTurn = {
  title: string;
  salespersonLine: string;
  bestResponse: string;
  ifYouFold: string;
  ifYouHold: string;
};

export type ReferralLoop = {
  headline: string;
  detail: string;
  inviteMessage: string;
  followUpMessage: string;
};

export type AppPreferences = {
  experienceMode: ExperienceMode;
};

export type DealerGuardAppData = {
  answers: Answers;
  checkedItems: CheckedItems;
  notes: string;
  negotiationFlags: NegotiationFlag[];
  pressureIncidents: PressureIncident[];
  promises: PromiseRecord[];
  visitTimeline: VisitTimelineEntry[];
  savedDeals: SavedDeal[];
  deal: DealState;
  subscription: SubscriptionState;
  billing: BillingState;
  preferences: AppPreferences;
};
