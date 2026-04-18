import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Screen =
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
  | 'notes';

type MainTab = 'home' | 'checklist' | 'traps' | 'dealReview' | 'financeDefense' | 'notes';

type NegotiationFlag =
  | 'paymentShift'
  | 'todayOnly'
  | 'managerTrip'
  | 'bundleAddOn'
  | 'wontPrint'
  | 'tradeMix';

type Answers = Record<string, string>;
type CheckedItems = Record<string, boolean>;

type Question = {
  id: string;
  title: string;
  subtitle: string;
  options: string[];
};

type TrapCard = {
  title: string;
  danger: string;
  why: string;
  response: string;
};

type ChecklistSection = {
  title: string;
  items: string[];
};

type DealState = {
  dealershipName: string;
  vehiclePrice: string;
  dealerFees: string;
  feeNames: string;
  addOns: string;
  downPayment: string;
  tradeIn: string;
  apr: string;
  months: string;
};

type SavedDeal = DealState & {
  id: string;
  savedAt: string;
};

type SelectedComparePair = {
  firstId: string | null;
  secondId: string | null;
};

type DealAnalysis = {
  flaggedFees: Array<(typeof suspiciousFeeRules)[number]>;
  amountFinanced: number;
  monthlyPayment: number;
  totalPaid: number;
  dealWarnings: string[];
  dangerScore: number;
  dealVerdict: 'Fair Deal' | 'Review Carefully' | 'Bad Deal' | 'Walk Away';
  dealGradeTone: 'good' | 'warn' | 'bad';
  dealGuidance: string;
};

type RankedDeal = {
  deal: SavedDeal;
  analysis: DealAnalysis;
  rankScore: number;
};

type DealComparisonResult = {
  winner: RankedDeal;
  runnerUp: RankedDeal | null;
  ranked: RankedDeal[];
  reasons: string[];
};

const STORAGE_KEYS = {
  answers: 'dealerGuard_answers',
  checkedItems: 'dealerGuard_checkedItems',
  notes: 'dealerGuard_notes',
  deal: 'dealerGuard_deal',
  savedDeals: 'dealerGuard_savedDeals',
  negotiationFlags: 'dealerGuard_negotiationFlags',
};

const questions: Question[] = [
  {
    id: 'budget',
    title: 'What monthly payment feels safe for you?',
    subtitle: 'Pick a payment that still leaves room in your budget.',
    options: ['Under $300', '$300-$450', '$450-$600', '$600+', "I don't know yet"],
  },
  {
    id: 'downPayment',
    title: 'Do you have money saved for a down payment?',
    subtitle: 'Even a small down payment can reduce risk.',
    options: ['Yes', 'No', 'Not sure'],
  },
  {
    id: 'credit',
    title: 'Do you know your credit score range?',
    subtitle: 'Knowing your score range helps you judge whether the APR is fair.',
    options: ['Excellent', 'Good', 'Fair', 'Poor', "I don't know"],
  },
  {
    id: 'preapproved',
    title: 'Have you been pre-approved by a bank or credit union?',
    subtitle: 'Outside financing gives you leverage.',
    options: ['Yes', 'No', 'Working on it'],
  },
  {
    id: 'targetPrice',
    title: 'Do you know the fair market price of the car you want?',
    subtitle: 'Walking in blind makes it easier to overpay.',
    options: ['Yes', 'Somewhat', 'No'],
  },
  {
    id: 'tradeIn',
    title: 'Do you have a trade-in and know its value?',
    subtitle: 'Trade-in confusion can hide a bad deal.',
    options: ['No trade-in', 'Yes, and I know its value', "Yes, but I don't know its value"],
  },
  {
    id: 'walkAway',
    title: 'Do you know your maximum out-the-door price?',
    subtitle: 'This is your walk-away number.',
    options: ['Yes', 'No', 'I need help with that'],
  },
];

const trapCards: TrapCard[] = [
  {
    title: 'Monthly payment trap',
    danger: 'They focus on your monthly payment instead of total price.',
    why: 'A lower payment can hide a longer loan, higher interest, or extra fees.',
    response: 'I want the full out-the-door price first, not just the monthly payment.',
  },
  {
    title: 'Today-only pressure',
    danger: 'They say the deal is only good right now.',
    why: 'Urgency is often used to stop comparison shopping and clear thinking.',
    response: 'If the deal is fair, I can review it carefully and come back.',
  },
  {
    title: 'Add-on packing',
    danger: 'They slip in warranties, protection packages, or accessories.',
    why: 'Add-ons can add thousands in markup.',
    response: 'Please itemize every add-on and remove anything optional.',
  },
  {
    title: 'Trade-in confusion',
    danger: 'They mix your trade-in, vehicle price, and financing together.',
    why: 'That makes it harder to see whether you are actually getting a fair deal.',
    response: "Let's separate the vehicle price, trade-in, and financing one at a time.",
  },
  {
    title: 'Rate markup',
    danger: 'They present financing as if it is your only option.',
    why: 'A marked-up APR can cost a lot over time.',
    response: 'I know my outside financing options. Show me your best rate in writing.',
  },
  {
    title: 'Wear-down tactic',
    danger: 'They keep you there for hours to wear you down.',
    why: 'Tired buyers make weaker decisions.',
    response: "I'm leaving for now. I only make financial decisions when I have time to review them.",
  },
];

const checklistSections: ChecklistSection[] = [
  {
    title: 'Before you go',
    items: [
      'Know your credit score range',
      'Get pre-approved by a bank or credit union',
      'Set your max out-the-door budget',
      'Research fair market value',
      'Estimate trade-in value',
      'Get an insurance quote',
    ],
  },
  {
    title: 'Bring with you',
    items: [
      "Driver's license",
      'Proof of income',
      'Proof of residence',
      'Insurance information',
      'Down payment funds',
      'Trade-in title or payoff information',
    ],
  },
  {
    title: 'At the dealership',
    items: [
      'Ask for the out-the-door price',
      'Do not negotiate only on monthly payment',
      'Review all dealer fees',
      'Decline unwanted add-ons',
      'Check loan term and APR',
      'Get everything in writing',
      'Leave if you feel pressured',
    ],
  },
  {
    title: 'Used car checks',
    items: [
      'Ask for vehicle history report',
      'Confirm mileage',
      'Ask about accidents',
      'Review warranty details',
      'Check maintenance history',
      'Consider independent inspection',
    ],
  },
];

const quickScripts = [
  'What is the full out-the-door price?',
  'Please remove all optional add-ons.',
  'I am not discussing monthly payment until I see the full price.',
  'Show me the APR, total amount financed, and loan term in writing.',
  "Let's discuss the trade-in separately from the vehicle price.",
  "I'm not signing anything today.",
  'I need time to compare this offer with others.',
];

const financeOfficeItems = [
  {
    title: 'Extended warranty',
    danger: 'It may be pitched as essential protection or rolled quietly into the payment.',
    watch: 'Ask for the total price, coverage length, deductible, and whether it is cancellable.',
    script: 'Do not add any warranty until I see the full contract terms and total cost in writing.',
  },
  {
    title: 'GAP insurance markup',
    danger: 'GAP can be useful in some deals, but dealerships may heavily mark it up.',
    watch: 'Compare the dealership price with your insurer or lender before agreeing.',
    script: 'What is the exact GAP price, and how does it compare with outside options?',
  },
  {
    title: 'Paint or fabric protection',
    danger: 'These packages are often high-margin add-ons sold as if they are necessary.',
    watch: 'Ask what is actually applied, what it covers, and whether it is optional.',
    script: 'Please remove paint and fabric protection unless I specifically approve it.',
  },
  {
    title: 'Nitrogen tires and etching',
    danger: 'Small-value items can be bundled into a much larger package.',
    watch: 'If it is optional, remove it. If it is already installed, ask for proof and itemized cost.',
    script: 'I do not want nitrogen, etching, or accessory add-ons included in this deal.',
  },
  {
    title: 'APR distraction',
    danger: 'They may keep moving back to payment size instead of rate, total financed, and term.',
    watch: 'Always review APR, amount financed, total of payments, and term together.',
    script: 'Show me the APR, amount financed, and total of payments before we discuss anything else.',
  },
];

const salesTacticItems = [
  {
    line: 'What monthly payment are you trying to stay under?',
    tactic: 'Payment anchoring',
    why: 'It shifts your focus away from total price and total cost.',
    risk: 'You may agree to a longer loan, higher APR, or padded extras without noticing.',
    script: 'I want to discuss the full out-the-door price first, then financing.',
  },
  {
    line: 'This deal is only good today.',
    tactic: 'Urgency pressure',
    why: 'Urgency is used to stop comparison shopping and reduce careful thinking.',
    risk: 'You may sign before reviewing numbers, fees, and financing clearly.',
    script: 'If the deal is fair, I can review it carefully and come back.',
  },
  {
    line: 'Someone else is interested in this car.',
    tactic: 'Scarcity pressure',
    why: 'Scarcity makes buyers feel they must act fast to avoid losing the car.',
    risk: 'You may ignore red flags because you feel rushed.',
    script: 'I understand, but I only move forward after reviewing the numbers carefully.',
  },
  {
    line: 'This protection package is already included.',
    tactic: 'Bundled add-on pressure',
    why: 'Optional products are framed like they cannot be removed.',
    risk: 'You may pay for extras you do not want or need.',
    script: 'Please itemize that package and remove any optional products.',
  },
  {
    line: 'Let me talk to my manager.',
    tactic: 'Authority relay',
    why: 'This can be used to slow you down, wear you down, or make the offer feel final.',
    risk: 'You may feel pressured to accept a number that still has room to change.',
    script: 'That is fine. When you come back, please bring the full breakdown in writing.',
  },
  {
    line: 'It only changes the payment by a little bit.',
    tactic: 'Small-payment framing',
    why: 'A small monthly change can hide a large increase in total cost.',
    risk: 'You may agree to expensive extras because they seem small in monthly terms.',
    script: 'Do not show me the monthly difference. Show me the full cost of that item.',
  },
];

const financeOfficeChecklist = [
  'Ask for every finance product separately itemized',
  'Confirm which items are optional',
  'Review APR, amount financed, and total of payments',
  'Compare GAP with outside pricing',
  'Review warranty contract before agreeing',
  'Remove any product you do not clearly want',
  'Do not sign because you feel tired or rushed',
];

const negotiationFlagItems: {
  id: NegotiationFlag;
  label: string;
  meaning: string;
  response: string;
}[] = [
  {
    id: 'paymentShift',
    label: 'They shifted back to monthly payment',
    meaning: 'This often means they want to hide total price, term length, or add-ons.',
    response: 'I want the out-the-door price first, then financing.',
  },
  {
    id: 'todayOnly',
    label: 'They said the deal is only good today',
    meaning: 'Urgency pressure is used to stop comparison shopping and careful review.',
    response: 'If the deal is fair, I can review it and come back.',
  },
  {
    id: 'managerTrip',
    label: 'They went to talk to the manager again',
    meaning: 'This can be a wear-down tactic to make you accept a number faster.',
    response: 'Bring the full printed breakdown when you return.',
  },
  {
    id: 'bundleAddOn',
    label: 'They bundled in add-ons',
    meaning: 'Optional products may be getting framed like they are required.',
    response: 'Itemize each add-on and remove anything optional.',
  },
  {
    id: 'wontPrint',
    label: 'They will not print the breakdown',
    meaning: 'Weak transparency is a major warning sign.',
    response: 'I do not move forward without the numbers in writing.',
  },
  {
    id: 'tradeMix',
    label: 'They mixed trade-in with the deal',
    meaning: 'Combining price, trade, and financing makes it harder to see the real deal.',
    response: 'Let’s separate vehicle price, trade-in, and financing one at a time.',
  },
];

const suspiciousFeeRules = [
  { key: 'doc', label: 'Doc fee', reason: 'Documentation fees can vary and should be reviewed closely.' },
  { key: 'documentation', label: 'Documentation fee', reason: 'Ask whether the documentation fee is standard and non-negotiable in your state.' },
  { key: 'dealer prep', label: 'Dealer prep', reason: 'Dealer prep is often vague and may duplicate normal dealer responsibilities.' },
  { key: 'prep', label: 'Prep fee', reason: 'Prep-related fees should be clearly explained and itemized.' },
  { key: 'appearance', label: 'Appearance package', reason: 'Appearance packages often bundle low-value items at a high price.' },
  { key: 'etch', label: 'Etching', reason: 'VIN etching is commonly marked up and may not provide enough value.' },
  { key: 'nitrogen', label: 'Nitrogen tires', reason: 'Nitrogen tire packages are often unnecessary and overpriced.' },
  { key: 'market adjustment', label: 'Market adjustment', reason: 'Market adjustments increase price without adding vehicle value.' },
  { key: 'adm', label: 'ADM', reason: 'Additional dealer markup should be challenged directly.' },
  { key: 'protection', label: 'Protection package', reason: 'Protection packages are often optional extras sold as if they are required.' },
  { key: 'paint', label: 'Paint protection', reason: 'Paint protection is often high margin and should be reviewed carefully.' },
  { key: 'fabric', label: 'Fabric protection', reason: 'Fabric protection may be optional and overpriced at the dealership.' },
] as const;

function detectSuspiciousFees(rawFeeNames: string) {
  const text = (rawFeeNames || '').toLowerCase();
  if (!text.trim()) return [];
  return suspiciousFeeRules.filter((rule) => text.includes(rule.key));
}

function scoreAnswers(answers: Answers) {
  let score = 0;
  const missing: string[] = [];

  if (answers.budget && answers.budget !== "I don't know yet") score += 1;
  else missing.push('Set a safe monthly payment range.');

  if (answers.downPayment === 'Yes') score += 1;
  else missing.push('Decide how much you can put down.');

  if (answers.credit && answers.credit !== "I don't know") score += 1;
  else missing.push('Check your credit score range before visiting.');

  if (answers.preapproved === 'Yes') score += 2;
  else missing.push('Get pre-approved to compare financing offers.');

  if (answers.targetPrice === 'Yes' || answers.targetPrice === 'Somewhat') score += 1;
  else missing.push('Research the fair market value of the vehicle.');

  if (answers.tradeIn === 'No trade-in' || answers.tradeIn === 'Yes, and I know its value') score += 1;
  else missing.push('Estimate your trade-in value before the visit.');

  if (answers.walkAway === 'Yes') score += 2;
  else missing.push('Set a maximum out-the-door price.');

  return { score, missing, max: 9 };
}

function getReadinessLabel(score: number) {
  if (score >= 8) return 'Strong';
  if (score >= 5) return 'Almost Ready';
  return 'Not Ready';
}

function currency(value: number | string) {
  const num = Number(value || 0);
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function estimateMonthlyPayment(amount: number, apr: number, months: number) {
  if (!amount || !months) return 0;
  const monthlyRate = apr / 100 / 12;
  if (!monthlyRate) return amount / months;
  return (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildDealAnalysis(deal: DealState, readinessLabel: string): DealAnalysis {
  const flaggedFees = detectSuspiciousFees(deal.feeNames);

  const amountFinanced = Math.max(
    0,
    Number(deal.vehiclePrice || 0) +
      Number(deal.dealerFees || 0) +
      Number(deal.addOns || 0) -
      Number(deal.downPayment || 0) -
      Number(deal.tradeIn || 0)
  );

  const monthlyPayment = estimateMonthlyPayment(amountFinanced, Number(deal.apr || 0), Number(deal.months || 0));
  const totalPaid = monthlyPayment * Number(deal.months || 0);

  const dealWarnings = [
    Number(deal.addOns || 0) > 1500 ? 'Add-ons look high. Review every extra item carefully.' : null,
    Number(deal.dealerFees || 0) > 1000 ? 'Dealer fees look high. Ask for a full itemized breakdown.' : null,
    Number(deal.months || 0) >= 72 ? 'Long loan term. This can hide the real cost of the deal.' : null,
    Number(deal.apr || 0) >= 8 ? 'APR may be high. Compare outside financing before agreeing.' : null,
    Number(deal.vehiclePrice || 0) > 0 && Number(deal.addOns || 0) / Math.max(Number(deal.vehiclePrice || 1), 1) > 0.08
      ? 'Add-ons are a large share of the vehicle price.'
      : null,
  ].filter(Boolean) as string[];

  const dangerScore = dealWarnings.length + flaggedFees.length + (readinessLabel === 'Not Ready' ? 1 : 0);
  const dealVerdict = dangerScore >= 6 ? 'Walk Away' : dangerScore >= 4 ? 'Bad Deal' : dangerScore >= 2 ? 'Review Carefully' : 'Fair Deal';
  const dealGradeTone: 'good' | 'warn' | 'bad' = dealVerdict === 'Fair Deal' ? 'good' : dealVerdict === 'Review Carefully' ? 'warn' : 'bad';

  const dealGuidance =
    dealVerdict === 'Fair Deal'
      ? 'The numbers do not show major warning signs yet. Still review every line item and compare outside financing before signing.'
      : dealVerdict === 'Review Carefully'
        ? 'There are enough warning signs to slow down and ask more questions. Review fees, add-ons, and financing terms one by one.'
        : dealVerdict === 'Bad Deal'
          ? 'This deal shows multiple signs of being overpriced or padded. Ask for a full printed breakdown and remove optional products before moving forward.'
          : 'This deal has enough red flags that walking away may be the smartest choice unless the numbers change significantly.';

  return {
    flaggedFees,
    amountFinanced,
    monthlyPayment,
    totalPaid,
    dealWarnings,
    dangerScore,
    dealVerdict,
    dealGradeTone,
    dealGuidance,
  };
}

function buildHonestyScore(analysis: DealAnalysis, readinessLabel: string, activeFlags: NegotiationFlag[]) {
  let score = 100;

  score -= analysis.flaggedFees.length * 6;
  score -= analysis.dealWarnings.length * 7;
  score -= activeFlags.length * 8;
  if (analysis.dealVerdict === 'Review Carefully') score -= 8;
  if (analysis.dealVerdict === 'Bad Deal') score -= 18;
  if (analysis.dealVerdict === 'Walk Away') score -= 28;
  if (readinessLabel === 'Not Ready') score -= 6;

  score = Math.max(0, Math.min(100, score));

  const label = score >= 80 ? 'Transparent' : score >= 60 ? 'Questionable' : score >= 40 ? 'Aggressive' : 'High Risk';
  const tone: 'good' | 'warn' | 'bad' = score >= 80 ? 'good' : score >= 60 ? 'warn' : 'bad';

  const notes: string[] = [];
  if (analysis.flaggedFees.length > 0) notes.push('Suspicious fee patterns detected.');
  if (analysis.dealWarnings.length > 0) notes.push('Deal structure shows warning signs.');
  if (activeFlags.length > 0) notes.push('Pressure tactics were reported during negotiation.');
  if (!notes.length) notes.push('No major transparency issues detected yet.');

  return { score, label, tone, notes };
}

function compareSavedDeals(deals: SavedDeal[], readinessLabel: string): DealComparisonResult | null {
  if (!deals.length) return null;

  const ranked: RankedDeal[] = deals
    .map((deal) => {
      const analysis = buildDealAnalysis(deal, readinessLabel);
      const rankScore = analysis.dangerScore * 100000 + analysis.totalPaid;
      return { deal, analysis, rankScore };
    })
    .sort((a, b) => a.rankScore - b.rankScore);

  const winner = ranked[0];
  const runnerUp = ranked[1] || null;
  const reasons: string[] = [];

  if (runnerUp) {
    if (winner.analysis.dangerScore < runnerUp.analysis.dangerScore) {
      reasons.push(`fewer warning signs (${winner.analysis.dangerScore} vs ${runnerUp.analysis.dangerScore})`);
    }
    if (winner.analysis.totalPaid < runnerUp.analysis.totalPaid) {
      reasons.push(`lower estimated total paid (${currency(winner.analysis.totalPaid)} vs ${currency(runnerUp.analysis.totalPaid)})`);
    }
    if (winner.analysis.monthlyPayment < runnerUp.analysis.monthlyPayment) {
      reasons.push(`lower estimated monthly payment (${currency(winner.analysis.monthlyPayment)} vs ${currency(runnerUp.analysis.monthlyPayment)})`);
    }
  }

  return { winner, runnerUp, ranked, reasons };
}

function ProgressBar({ value }: { value: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, value))}%` }]} />
    </View>
  );
}

function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text
        style={
          variant === 'primary'
            ? styles.buttonPrimaryText
            : variant === 'danger'
              ? styles.buttonDangerText
              : styles.buttonSecondaryText
        }
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function MainTabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <Text style={active ? styles.tabButtonTextActive : styles.tabButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: 'good' | 'warn' | 'bad' }) {
  return <Text style={[styles.statusBadge, tone === 'good' ? styles.badgeGood : tone === 'warn' ? styles.badgeWarn : styles.badgeBad]}>{label}</Text>;
}

function DealInput({
  label,
  value,
  onChangeText,
  placeholder,
  numeric = true,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  numeric?: boolean;
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={numeric ? 'numeric' : 'default'}
      />
    </View>
  );
}

export default function App() {
  const [mainTab, setMainTab] = useState<MainTab>('home');
  const [selectedComparePair, setSelectedComparePair] = useState<SelectedComparePair>({ firstId: null, secondId: null });
  const [selectedTacticIndex, setSelectedTacticIndex] = useState(0);
  const [screen, setScreen] = useState<Screen>('home');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [checkedItems, setCheckedItems] = useState<CheckedItems>({});
  const [notes, setNotes] = useState('');
  const [negotiationFlags, setNegotiationFlags] = useState<NegotiationFlag[]>([]);
  const [savedDeals, setSavedDeals] = useState<SavedDeal[]>([]);
  const [deal, setDeal] = useState<DealState>({
    dealershipName: '',
    vehiclePrice: '',
    dealerFees: '',
    feeNames: '',
    addOns: '',
    downPayment: '',
    tradeIn: '',
    apr: '',
    months: '60',
  });

  const currentQuestion = questions[questionIndex];
  const selectedTactic = salesTacticItems[selectedTacticIndex];
  const readiness = useMemo(() => scoreAnswers(answers), [answers]);
  const readinessLabel = getReadinessLabel(readiness.score);

  const checklistCount = checklistSections.flatMap((section) => section.items).length;
  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const checklistProgress = checklistCount ? Math.round((completedCount / checklistCount) * 100) : 0;

  const dealAnalysis = useMemo(() => buildDealAnalysis(deal, readinessLabel), [deal, readinessLabel]);
  const dealComparison = useMemo(() => compareSavedDeals(savedDeals, readinessLabel), [savedDeals, readinessLabel]);
  const honestyScore = useMemo(() => buildHonestyScore(dealAnalysis, readinessLabel, negotiationFlags), [dealAnalysis, readinessLabel, negotiationFlags]);

  const selectedDealsForCompare = useMemo(() => {
    const byId = new Map(savedDeals.map((d) => [d.id, d]));
    const first = selectedComparePair.firstId ? byId.get(selectedComparePair.firstId) || null : null;
    const second = selectedComparePair.secondId ? byId.get(selectedComparePair.secondId) || null : null;
    return { first, second };
  }, [savedDeals, selectedComparePair]);

  const manualCompareAnalyses = useMemo(() => {
    return {
      first: selectedDealsForCompare.first ? buildDealAnalysis(selectedDealsForCompare.first, readinessLabel) : null,
      second: selectedDealsForCompare.second ? buildDealAnalysis(selectedDealsForCompare.second, readinessLabel) : null,
    };
  }, [selectedDealsForCompare, readinessLabel]);

  const {
    flaggedFees,
    amountFinanced,
    monthlyPayment,
    totalPaid,
    dealWarnings,
    dealVerdict,
    dealGradeTone,
    dealGuidance,
  } = dealAnalysis;

  const winnerComparison = dealComparison?.winner ?? null;
  const comparisonReasons = dealComparison?.reasons ?? [];

  useEffect(() => {
    loadStoredData();
  }, []);

  useEffect(() => {
    saveData(STORAGE_KEYS.answers, answers);
  }, [answers]);

  useEffect(() => {
    saveData(STORAGE_KEYS.checkedItems, checkedItems);
  }, [checkedItems]);

  useEffect(() => {
    saveData(STORAGE_KEYS.notes, notes);
  }, [notes]);

  useEffect(() => {
    saveData(STORAGE_KEYS.deal, deal);
  }, [deal]);

  useEffect(() => {
    saveData(STORAGE_KEYS.savedDeals, savedDeals);
  }, [savedDeals]);

  useEffect(() => {
    saveData(STORAGE_KEYS.negotiationFlags, negotiationFlags);
  }, [negotiationFlags]);

  async function loadStoredData() {
    try {
      const [savedAnswers, savedCheckedItems, savedNotes, savedDeal, savedDealsRaw, savedNegotiationFlags] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.answers),
        AsyncStorage.getItem(STORAGE_KEYS.checkedItems),
        AsyncStorage.getItem(STORAGE_KEYS.notes),
        AsyncStorage.getItem(STORAGE_KEYS.deal),
        AsyncStorage.getItem(STORAGE_KEYS.savedDeals),
        AsyncStorage.getItem(STORAGE_KEYS.negotiationFlags),
      ]);

      if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
      if (savedCheckedItems) setCheckedItems(JSON.parse(savedCheckedItems));
      if (savedNotes) setNotes(JSON.parse(savedNotes));
      if (savedDeal) {
        const parsedDeal = JSON.parse(savedDeal);
        setDeal((prev) => ({ ...prev, ...parsedDeal, dealershipName: parsedDeal.dealershipName || '' }));
      }
      if (savedDealsRaw) setSavedDeals(JSON.parse(savedDealsRaw));
      if (savedNegotiationFlags) setNegotiationFlags(JSON.parse(savedNegotiationFlags));
    } catch (error) {
      console.log('Load error:', error);
    }
  }

  async function saveData(key: string, value: unknown) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.log('Save error:', error);
    }
  }

  async function resetApp() {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.answers),
        AsyncStorage.removeItem(STORAGE_KEYS.checkedItems),
        AsyncStorage.removeItem(STORAGE_KEYS.notes),
        AsyncStorage.removeItem(STORAGE_KEYS.deal),
        AsyncStorage.removeItem(STORAGE_KEYS.savedDeals),
        AsyncStorage.removeItem(STORAGE_KEYS.negotiationFlags),
      ]);
      setAnswers({});
      setCheckedItems({});
      setNotes('');
      setNegotiationFlags([]);
      setSavedDeals([]);
      setSelectedComparePair({ firstId: null, secondId: null });
      setDeal({
        dealershipName: '',
        vehiclePrice: '',
        dealerFees: '',
        feeNames: '',
        addOns: '',
        downPayment: '',
        tradeIn: '',
        apr: '',
        months: '60',
      });
      setQuestionIndex(0);
      setScreen('home');
      setMainTab('home');
    } catch (error) {
      console.log('Reset error:', error);
    }
  }

  function confirmReset() {
    Alert.alert('Reset app data?', 'This will clear answers, notes, checklist progress, deal numbers, saved comparisons, and negotiation flags.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetApp },
    ]);
  }

  function selectAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  }

  function goNext() {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      setScreen('result');
    }
  }

  function goBack() {
    if (questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
    } else {
      setScreen('home');
      setMainTab('home');
    }
  }

  function goHomeTab(tab: MainTab) {
    setMainTab(tab);
    setScreen(tab === 'home' ? 'home' : tab);
  }

  function toggleCheck(item: string) {
    setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
  }

  function toggleNegotiationFlag(flag: NegotiationFlag) {
    setNegotiationFlags((prev) => (prev.includes(flag) ? prev.filter((item) => item !== flag) : [...prev, flag]));
  }

  function saveCurrentDeal() {
    if (!deal.vehiclePrice && !deal.dealerFees && !deal.addOns && !deal.apr) {
      Alert.alert('Nothing to save', 'Enter deal details first, then save the offer for comparison.');
      return;
    }

    const newDeal: SavedDeal = {
      ...deal,
      id: makeId(),
      savedAt: new Date().toISOString(),
    };
    setSavedDeals((prev) => [newDeal, ...prev].slice(0, 6));
    Alert.alert('Deal saved', 'This offer is now available in Compare dealership offers.');
  }

  function loadSavedDeal(id: string) {
    const found = savedDeals.find((item) => item.id === id);
    if (!found) return;
    const { id: _id, savedAt: _savedAt, ...rest } = found;
    setDeal(rest);
    setMainTab('dealReview');
    setScreen('dealReview');
  }

  function deleteSavedDeal(id: string) {
    setSavedDeals((prev) => prev.filter((item) => item.id !== id));
    setSelectedComparePair((prev) => ({
      firstId: prev.firstId === id ? null : prev.firstId,
      secondId: prev.secondId === id ? null : prev.secondId,
    }));
  }

  function toggleComparePick(slot: 'firstId' | 'secondId', id: string) {
    setSelectedComparePair((prev) => {
      const currentValue = prev[slot];
      if (currentValue === id) {
        return { ...prev, [slot]: null };
      }

      const otherSlot = slot === 'firstId' ? 'secondId' : 'firstId';
      if (prev[otherSlot] === id) {
        return prev;
      }

      return { ...prev, [slot]: id };
    });
  }

  function buildComparisonSummary(): string {
    const firstDeal = selectedDealsForCompare.first;
    const secondDeal = selectedDealsForCompare.second;
    const firstAnalysis = manualCompareAnalyses.first;
    const secondAnalysis = manualCompareAnalyses.second;

    if (!firstDeal || !secondDeal || !firstAnalysis || !secondAnalysis) {
      return 'Select two saved offers in Compare dealership offers to generate a comparison summary.';
    }

    const winnerName =
      firstAnalysis.dangerScore < secondAnalysis.dangerScore
        ? firstDeal.dealershipName || 'Offer 1'
        : firstAnalysis.dangerScore > secondAnalysis.dangerScore
          ? secondDeal.dealershipName || 'Offer 2'
          : firstAnalysis.totalPaid <= secondAnalysis.totalPaid
            ? firstDeal.dealershipName || 'Offer 1'
            : secondDeal.dealershipName || 'Offer 2';

    return [
      'Dealer Guard comparison summary',
      '',
      `${firstDeal.dealershipName || 'Offer 1'}`,
      `- Verdict: ${firstAnalysis.dealVerdict}`,
      `- Amount financed: ${currency(firstAnalysis.amountFinanced)}`,
      `- Monthly payment: ${currency(firstAnalysis.monthlyPayment)}`,
      `- Total paid: ${currency(firstAnalysis.totalPaid)}`,
      `- Warning count: ${firstAnalysis.dealWarnings.length + firstAnalysis.flaggedFees.length}`,
      '',
      `${secondDeal.dealershipName || 'Offer 2'}`,
      `- Verdict: ${secondAnalysis.dealVerdict}`,
      `- Amount financed: ${currency(secondAnalysis.amountFinanced)}`,
      `- Monthly payment: ${currency(secondAnalysis.monthlyPayment)}`,
      `- Total paid: ${currency(secondAnalysis.totalPaid)}`,
      `- Warning count: ${secondAnalysis.dealWarnings.length + secondAnalysis.flaggedFees.length}`,
      '',
      `Current winner: ${winnerName}`,
    ].join('
');
  }

  async function copyComparisonSummary() {
    const firstDeal = selectedDealsForCompare.first;
    const secondDeal = selectedDealsForCompare.second;
    const firstAnalysis = manualCompareAnalyses.first;
    const secondAnalysis = manualCompareAnalyses.second;

    if (!firstDeal || !secondDeal || !firstAnalysis || !secondAnalysis) {
      Alert.alert('Select two offers', 'Choose one offer for Left and one offer for Right before copying the comparison summary.');
      return;
    }

    const summary = buildComparisonSummary();
    try {
      await Clipboard.setStringAsync(summary);
      Alert.alert('Copied', 'Comparison summary copied to your clipboard.');
    } catch (error) {
      Alert.alert('Copy failed', 'Could not copy the comparison summary right now.');
    }
  }

  async function shareComparisonSummary() {
    const firstDeal = selectedDealsForCompare.first;
    const secondDeal = selectedDealsForCompare.second;
    const firstAnalysis = manualCompareAnalyses.first;
    const secondAnalysis = manualCompareAnalyses.second;

    if (!firstDeal || !secondDeal || !firstAnalysis || !secondAnalysis) {
      Alert.alert('Select two offers', 'Choose one offer for Left and one offer for Right before sharing the comparison summary.');
      return;
    }

    const summary = buildComparisonSummary();
    try {
      await Share.share({
        message: summary,
        title: 'Dealer Guard comparison summary',
      });
    } catch (error) {
      Alert.alert('Share failed', 'Could not open the share sheet right now.');
    }
  }

  async function copyScript(script: string) {
    try {
      await Clipboard.setStringAsync(script);
      Alert.alert('Copied', 'Script copied to your clipboard.');
    } catch (error) {
      Alert.alert('Copy failed', 'Could not copy that script right now.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>DEALER GUARD</Text>
            <Text style={styles.headerTitle}>Car buyer protection</Text>
          </View>
          <TouchableOpacity onPress={confirmReset} style={styles.resetPill}>
            <Text style={styles.resetPillText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          <MainTabButton label="Home" active={mainTab === 'home'} onPress={() => goHomeTab('home')} />
          <MainTabButton label="Checklist" active={mainTab === 'checklist'} onPress={() => goHomeTab('checklist')} />
          <MainTabButton label="Traps" active={mainTab === 'traps'} onPress={() => goHomeTab('traps')} />
          <MainTabButton label="Deal" active={mainTab === 'dealReview'} onPress={() => goHomeTab('dealReview')} />
          <MainTabButton label="Finance" active={mainTab === 'financeDefense'} onPress={() => goHomeTab('financeDefense')} />
          <MainTabButton label="Notes" active={mainTab === 'notes'} onPress={() => goHomeTab('notes')} />
        </View>

        {screen === 'home' && (
          <>
            <Card>
              <StatusBadge
                label={readinessLabel === 'Strong' ? 'Ready to negotiate' : readinessLabel === 'Almost Ready' ? 'Some weak spots' : 'At risk'}
                tone={readinessLabel === 'Strong' ? 'good' : readinessLabel === 'Almost Ready' ? 'warn' : 'bad'}
              />
              <Text style={styles.heroTitle}>Don’t get played at the dealership</Text>
              <Text style={styles.heroText}>
                Prepare before you walk in, spot pressure tactics, and review whether a deal actually makes sense.
              </Text>

              <View style={styles.heroWarningBox}>
                <Text style={styles.heroWarningTitle}>What this app protects against</Text>
                <Text style={styles.heroWarningText}>• Monthly payment tricks</Text>
                <Text style={styles.heroWarningText}>• Hidden add-ons and padded fees</Text>
                <Text style={styles.heroWarningText}>• Trade-in confusion</Text>
                <Text style={styles.heroWarningText}>• Pressure to sign too fast</Text>
              </View>

              <View style={styles.stackGap}>
                <AppButton
                  label="Start readiness check"
                  onPress={() => {
                    setQuestionIndex(0);
                    setScreen('questions');
                    setMainTab('home');
                  }}
                />
                <AppButton label="Open live dealership mode" variant="secondary" onPress={() => setScreen('liveMode')} />
              </View>
            </Card>

            <View style={styles.stackGap}>
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
                <Text style={styles.menuDesc}>Break down vehicle price, fees, APR, and add-ons.</Text>
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
                <Text style={styles.menuDesc}>Save multiple offers and compare total cost, monthly payment, and risk side by side.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuCard} onPress={() => setScreen('notes')} activeOpacity={0.85}>
                <Text style={styles.menuTitle}>Notes</Text>
                <Text style={styles.menuDesc}>Track quotes, names, promises, and what felt off.</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {screen === 'questions' && (
          <Card>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionLabel}>Readiness check</Text>
              <Text style={styles.sectionLabel}>
                {questionIndex + 1} / {questions.length}
              </Text>
            </View>
            <ProgressBar value={((questionIndex + 1) / questions.length) * 100} />
            <Text style={styles.questionTitle}>{currentQuestion.title}</Text>
            <Text style={styles.questionSubtitle}>{currentQuestion.subtitle}</Text>

            <View style={styles.stackGap}>
              {currentQuestion.options.map((option) => {
                const active = answers[currentQuestion.id] === option;
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
                <AppButton
                  label={questionIndex === questions.length - 1 ? 'See result' : 'Next'}
                  onPress={goNext}
                  disabled={!answers[currentQuestion.id]}
                />
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

              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>
                  {readinessLabel === 'Strong' && 'You are in a good position to compare offers and catch bad tactics. Stay focused on total price, APR, and add-ons.'}
                  {readinessLabel === 'Almost Ready' && 'You are close, but you still have a few weak spots a salesperson can use against you. Tighten those up before you go.'}
                  {readinessLabel === 'Not Ready' && 'Right now you are more exposed to pressure tactics, confusing numbers, and overpriced financing. Prep first, then visit.'}
                </Text>
              </View>

              <Text style={styles.subheading}>What to fix first</Text>
              <View style={styles.stackGap}>
                {readiness.missing.map((item) => (
                  <View key={item} style={styles.warningRow}>
                    <Text style={styles.warningBullet}>⚠</Text>
                    <Text style={styles.warningText}>{item}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <View style={styles.stackGap}>
              <AppButton label="Checklist" onPress={() => setScreen('checklist')} />
              <AppButton label="Trap library" variant="secondary" onPress={() => setScreen('traps')} />
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
                      <Text style={styles.bold}>What to say: </Text>“{trap.response}”
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
                <Text style={styles.sectionLabel}>{completedCount} of {checklistCount} completed</Text>
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
                      const checked = !!checkedItems[item];
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
          <>
            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.screenTitle}>Live dealership mode</Text>
                <StatusBadge label={dealVerdict} tone={dealGradeTone} />
              </View>
              <Text style={styles.heroText}>Keep your guard up while you're sitting at the lot.</Text>

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
                    <Text key={note} style={styles.detailText}>• {note}</Text>
                  ))}
                </View>
              </Card>

              <View style={styles.dangerPanel}>
                <Text style={styles.dangerPanelTitle}>Dealership red flags</Text>
                <Text style={styles.dangerPanelText}>• They dodge the out-the-door price.</Text>
                <Text style={styles.dangerPanelText}>• They keep steering back to monthly payment.</Text>
                <Text style={styles.dangerPanelText}>• They say you must sign today.</Text>
                <Text style={styles.dangerPanelText}>• They refuse to separate trade-in and financing.</Text>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>• Do not negotiate from monthly payment alone.</Text>
                <Text style={styles.infoBoxText}>• Ask for the out-the-door price in writing.</Text>
                <Text style={styles.infoBoxText}>• Separate price, trade-in, and financing.</Text>
                <Text style={styles.infoBoxText}>• Leave if you feel rushed or confused.</Text>
              </View>

              <Card>
                <Text style={styles.menuTitle}>Negotiation red flag button</Text>
                <Text style={styles.detailText}>Tap what just happened. Dealer Guard will track pressure tactics and raise the honesty warning level.</Text>
                <View style={styles.stackGapSmall}>
                  {negotiationFlagItems.map((item) => {
                    const active = negotiationFlags.includes(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.85}
                        onPress={() => toggleNegotiationFlag(item.id)}
                        style={[styles.optionButton, active && styles.optionButtonActive]}
                      >
                        <Text style={active ? styles.optionTextActive : styles.optionText}>{item.label}</Text>
                        <Text style={active ? styles.optionTextActive : styles.detailText}>{item.meaning}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {negotiationFlags.length > 0 && (
                  <View style={styles.gradePanel}>
                    <Text style={styles.bold}>Suggested response</Text>
                    {negotiationFlagItems
                      .filter((item) => negotiationFlags.includes(item.id))
                      .map((item) => (
                        <TouchableOpacity key={item.id} onPress={() => copyScript(item.response)} activeOpacity={0.85} style={styles.scriptTile}>
                          <Text style={styles.detailText}>“{item.response}”</Text>
                          <Text style={styles.copyHint}>Tap to copy</Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                )}
              </Card>

              <Text style={styles.subheading}>Tap-to-copy scripts</Text>
              <View style={styles.stackGapSmall}>
                {quickScripts.map((script) => (
                  <TouchableOpacity key={script} activeOpacity={0.85} onPress={() => copyScript(script)} style={styles.scriptTile}>
                    <Text style={styles.detailText}>“{script}”</Text>
                    <Text style={styles.copyHint}>Tap to copy</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
            <AppButton label="Back home" variant="secondary" onPress={() => setScreen('home')} />
          </>
        )}

        {screen === 'dealReview' && (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.screenTitle}>Deal review</Text>
              <TouchableOpacity onPress={() => setScreen('home')}>
                <Text style={styles.linkText}>Home</Text>
              </TouchableOpacity>
            </View>

            <Card>
              <DealInput
                label="Dealership name"
                value={deal.dealershipName}
                onChangeText={(text) => setDeal((prev) => ({ ...prev, dealershipName: text }))}
                placeholder="Metro Honda"
                numeric={false}
              />
              <DealInput
                label="Vehicle price"
                value={deal.vehiclePrice}
                onChangeText={(text) => setDeal((prev) => ({ ...prev, vehiclePrice: text }))}
                placeholder="25000"
              />
              <DealInput
                label="Dealer fees"
                value={deal.dealerFees}
                onChangeText={(text) => setDeal((prev) => ({ ...prev, dealerFees: text }))}
                placeholder="1200"
              />
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Fee names or package names</Text>
                <TextInput
                  style={styles.input}
                  value={deal.feeNames}
                  onChangeText={(text) => setDeal((prev) => ({ ...prev, feeNames: text }))}
                  placeholder="doc fee, dealer prep, etching, appearance package"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <DealInput
                label="Add-ons"
                value={deal.addOns}
                onChangeText={(text) => setDeal((prev) => ({ ...prev, addOns: text }))}
                placeholder="1800"
              />
              <DealInput
                label="Down payment"
                value={deal.downPayment}
                onChangeText={(text) => setDeal((prev) => ({ ...prev, downPayment: text }))}
                placeholder="3000"
              />
              <DealInput
                label="Trade-in value"
                value={deal.tradeIn}
                onChangeText={(text) => setDeal((prev) => ({ ...prev, tradeIn: text }))}
                placeholder="5000"
              />
              <DealInput
                label="APR %"
                value={deal.apr}
                onChangeText={(text) => setDeal((prev) => ({ ...prev, apr: text }))}
                placeholder="7.9"
              />
              <DealInput
                label="Loan term (months)"
                value={deal.months}
                onChangeText={(text) => setDeal((prev) => ({ ...prev, months: text }))}
                placeholder="60"
              />
            </Card>

            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.menuTitle}>Deal snapshot</Text>
                <StatusBadge label={dealVerdict} tone={dealGradeTone} />
              </View>
              <Text style={styles.detailText}>{dealGuidance}</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.detailText}>Dealer honesty score</Text>
                <StatusBadge label={`${honestyScore.score}/100 ${honestyScore.label}`} tone={honestyScore.tone} />
              </View>
              <View style={styles.snapshotRow}>
                <Text style={styles.detailText}>Estimated amount financed</Text>
                <Text style={styles.bold}>{currency(amountFinanced)}</Text>
              </View>
              <View style={styles.snapshotRow}>
                <Text style={styles.detailText}>Estimated monthly payment</Text>
                <Text style={styles.bold}>{currency(monthlyPayment)}</Text>
              </View>
              <View style={styles.snapshotRow}>
                <Text style={styles.detailText}>Estimated total paid</Text>
                <Text style={styles.bold}>{currency(totalPaid)}</Text>
              </View>
            </Card>

            <View style={styles.stackGapSmall}>
              <AppButton label="Save this deal for comparison" variant="secondary" onPress={saveCurrentDeal} />

              <Card>
                <Text style={styles.menuTitle}>Deal grade</Text>
                <View style={styles.gradePanel}>
                  <Text style={styles.gradeTitle}>{dealVerdict}</Text>
                  <Text style={styles.detailText}>{dealGuidance}</Text>
                </View>
              </Card>

              {flaggedFees.length > 0 && (
                <Card>
                  <Text style={styles.menuTitle}>Suspicious fee detector</Text>
                  <View style={styles.stackGapSmall}>
                    {flaggedFees.map((fee) => (
                      <View key={fee.key} style={styles.warningRowCard}>
                        <Text style={styles.bold}>{fee.label}</Text>
                        <Text style={styles.warningText}>{fee.reason}</Text>
                      </View>
                    ))}
                  </View>
                </Card>
              )}

              {dealWarnings.length === 0 ? (
                <Card>
                  <Text style={styles.detailText}>
                    No major warning flags based on the numbers entered yet. Still compare this with outside offers and ask for every line item in writing.
                  </Text>
                </Card>
              ) : (
                dealWarnings.map((warning) => (
                  <View key={warning} style={styles.warningRowCard}>
                    <Text style={styles.warningText}>{warning}</Text>
                  </View>
                ))
              )}

              {(dealVerdict === 'Bad Deal' || dealVerdict === 'Walk Away') && (
                <Card>
                  <Text style={styles.highRiskTitle}>Slow down before signing</Text>
                  <Text style={styles.detailText}>
                    This deal has multiple warning signs. Ask for the full breakdown in writing, compare outside financing, and be willing to walk away.
                  </Text>
                  <View style={styles.stackGapSmall}>
                    <AppButton
                      label="Copy walk-away script"
                      variant="danger"
                      onPress={() =>
                        copyScript(
                          'I am not comfortable signing today. Please print the full breakdown and I will review it before making a decision.'
                        )
                      }
                    />
                  </View>
                </Card>
              )}
            </View>
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
              <StatusBadge label="High-pressure zone" tone="bad" />
              <Text style={styles.heroText}>
                The finance office is where many buyers get loaded up with expensive extras. Slow the process down and review each product one at a time.
              </Text>

              <View style={styles.dangerPanel}>
                <Text style={styles.dangerPanelTitle}>What to watch for</Text>
                <Text style={styles.dangerPanelText}>• Products bundled into one monthly payment</Text>
                <Text style={styles.dangerPanelText}>• “This only adds a little per month” language</Text>
                <Text style={styles.dangerPanelText}>• Optional products presented like required protection</Text>
                <Text style={styles.dangerPanelText}>• Pressure to sign before reading contracts</Text>
              </View>
            </Card>

            <Card>
              <Text style={styles.menuTitle}>Finance office checklist</Text>
              <View style={styles.stackGapSmall}>
                {financeOfficeChecklist.map((item) => (
                  <View key={item} style={styles.warningRow}>
                    <Text style={styles.warningBullet}>•</Text>
                    <Text style={styles.warningText}>{item}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <View style={styles.stackGap}>
              {financeOfficeItems.map((item) => (
                <Card key={item.title}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.bold}>Why to be careful: </Text>
                    {item.danger}
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.bold}>What to review: </Text>
                    {item.watch}
                  </Text>
                  <TouchableOpacity activeOpacity={0.85} onPress={() => copyScript(item.script)} style={styles.scriptTile}>
                    <Text style={styles.detailText}>“{item.script}”</Text>
                    <Text style={styles.copyHint}>Tap to copy</Text>
                  </TouchableOpacity>
                </Card>
              ))}
            </View>

            <Card>
              <Text style={styles.highRiskTitle}>Golden rule</Text>
              <Text style={styles.detailText}>
                Never agree to a finance product just because it changes the monthly payment a little. Judge every product by its full cost, actual benefit, and whether you can buy it elsewhere for less.
              </Text>
              <AppButton
                label="Copy finance office script"
                variant="danger"
                onPress={() =>
                  copyScript(
                    'Please stop and itemize each finance product separately. I want to review the cost, terms, and whether each item is optional before signing anything.'
                  )
                }
              />
            </Card>
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
              <StatusBadge label="In-the-moment coaching" tone="warn" />
              <Text style={styles.heroText}>
                Tap the line that sounds closest to what the salesperson just said. The app will explain the tactic and give you a response you can use immediately.
              </Text>
            </Card>

            <Card>
              <Text style={styles.menuTitle}>Common dealership lines</Text>
              <View style={styles.stackGapSmall}>
                {salesTacticItems.map((item, index) => {
                  const active = selectedTacticIndex === index;
                  return (
                    <TouchableOpacity
                      key={item.line}
                      activeOpacity={0.85}
                      onPress={() => setSelectedTacticIndex(index)}
                      style={[styles.optionButton, active && styles.optionButtonActive]}
                    >
                      <Text style={active ? styles.optionTextActive : styles.optionText}>{item.line}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>

            <Card>
              <Text style={styles.menuTitle}>What that usually means</Text>
              <Text style={styles.detailText}>
                <Text style={styles.bold}>Tactic: </Text>
                {selectedTactic.tactic}
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.bold}>Why it matters: </Text>
                {selectedTactic.why}
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.bold}>Risk to you: </Text>
                {selectedTactic.risk}
              </Text>
              <TouchableOpacity activeOpacity={0.85} onPress={() => copyScript(selectedTactic.script)} style={styles.scriptTile}>
                <Text style={styles.detailText}>“{selectedTactic.script}”</Text>
                <Text style={styles.copyHint}>Tap to copy response</Text>
              </TouchableOpacity>
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

            {savedDeals.length === 0 ? (
              <Card>
                <Text style={styles.heroText}>No saved deals yet. Save an offer from the Deal review screen to compare it here.</Text>
              </Card>
            ) : (
              <>
                {winnerComparison && (
                  <Card>
                    <StatusBadge label="Current best offer" tone="good" />
                    <Text style={styles.menuTitle}>{winnerComparison.deal.dealershipName || 'Unnamed dealership'}</Text>
                    <Text style={styles.detailText}>Verdict: {winnerComparison.analysis.dealVerdict}</Text>
                    <Text style={styles.detailText}>Estimated total paid: {currency(winnerComparison.analysis.totalPaid)}</Text>
                    <Text style={styles.detailText}>Estimated monthly payment: {currency(winnerComparison.analysis.monthlyPayment)}</Text>
                    <Text style={styles.detailText}>Warning count: {winnerComparison.analysis.dealWarnings.length + winnerComparison.analysis.flaggedFees.length}</Text>
                    {comparisonReasons.length > 0 && (
                      <View style={styles.gradePanel}>
                        <Text style={styles.bold}>Why it currently wins</Text>
                        {comparisonReasons.map((reason) => (
                          <Text key={reason} style={styles.detailText}>• {reason}</Text>
                        ))}
                      </View>
                    )}
                  </Card>
                )}

                {savedDeals.length >= 2 && (
                  <Card>
                    <Text style={styles.menuTitle}>Choose 2 offers to compare</Text>
                    <Text style={styles.detailText}>Pick one offer for the left column and one for the right column.</Text>
                    <View style={styles.stackGapSmall}>
                      {savedDeals.map((savedDeal) => {
                        const pickedLeft = selectedComparePair.firstId === savedDeal.id;
                        const pickedRight = selectedComparePair.secondId === savedDeal.id;
                        return (
                          <View key={`pick-${savedDeal.id}`} style={styles.comparePickRow}>
                            <Text style={styles.comparePickName}>{savedDeal.dealershipName || 'Unnamed dealership'}</Text>
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
                          onPress={copyComparisonSummary}
                          disabled={!selectedDealsForCompare.first || !selectedDealsForCompare.second}
                        />
                      </View>
                      <View style={styles.flexOne}>
                        <AppButton
                          label="Share summary"
                          onPress={shareComparisonSummary}
                          disabled={!selectedDealsForCompare.first || !selectedDealsForCompare.second}
                        />
                      </View>
                    </View>
                  </Card>
                )}

                {selectedDealsForCompare.first && selectedDealsForCompare.second && manualCompareAnalyses.first && manualCompareAnalyses.second ? (
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
                  </Card>
                ) : (
                  dealComparison?.winner && dealComparison?.runnerUp && (
                    <Card>
                      <Text style={styles.menuTitle}>Head-to-head comparison</Text>
                      <View style={styles.headToHeadHeader}>
                        <Text style={styles.headToHeadDealName}>{dealComparison.winner.deal.dealershipName || 'Offer 1'}</Text>
                        <Text style={styles.headToHeadDealName}>{dealComparison.runnerUp.deal.dealershipName || 'Offer 2'}</Text>
                      </View>

                      <View style={styles.compareRow}>
                        <Text style={styles.compareLabel}>Verdict</Text>
                        <Text style={styles.compareValue}>{dealComparison.winner.analysis.dealVerdict}</Text>
                        <Text style={styles.compareValue}>{dealComparison.runnerUp.analysis.dealVerdict}</Text>
                      </View>
                      <View style={styles.compareRow}>
                        <Text style={styles.compareLabel}>Amount financed</Text>
                        <Text style={styles.compareValue}>{currency(dealComparison.winner.analysis.amountFinanced)}</Text>
                        <Text style={styles.compareValue}>{currency(dealComparison.runnerUp.analysis.amountFinanced)}</Text>
                      </View>
                      <View style={styles.compareRow}>
                        <Text style={styles.compareLabel}>Monthly payment</Text>
                        <Text style={styles.compareValue}>{currency(dealComparison.winner.analysis.monthlyPayment)}</Text>
                        <Text style={styles.compareValue}>{currency(dealComparison.runnerUp.analysis.monthlyPayment)}</Text>
                      </View>
                      <View style={styles.compareRow}>
                        <Text style={styles.compareLabel}>Total paid</Text>
                        <Text style={styles.compareValue}>{currency(dealComparison.winner.analysis.totalPaid)}</Text>
                        <Text style={styles.compareValue}>{currency(dealComparison.runnerUp.analysis.totalPaid)}</Text>
                      </View>
                      <View style={styles.compareRow}>
                        <Text style={styles.compareLabel}>Warnings</Text>
                        <Text style={styles.compareValue}>{dealComparison.winner.analysis.dealWarnings.length + dealComparison.winner.analysis.flaggedFees.length}</Text>
                        <Text style={styles.compareValue}>{dealComparison.runnerUp.analysis.dealWarnings.length + dealComparison.runnerUp.analysis.flaggedFees.length}</Text>
                      </View>
                    </Card>
                  )
                )}

                <View style={styles.stackGap}>
                  {savedDeals.map((savedDeal) => {
                    const analysis = buildDealAnalysis(savedDeal, readinessLabel);
                    const comparisonTone: 'good' | 'warn' | 'bad' = analysis.dealVerdict === 'Fair Deal' ? 'good' : analysis.dealVerdict === 'Review Carefully' ? 'warn' : 'bad';
                    const isWinner = winnerComparison?.deal.id === savedDeal.id;

                    return (
                      <Card key={savedDeal.id}>
                        <View style={styles.rowBetween}>
                          <Text style={styles.menuTitle}>{savedDeal.dealershipName || 'Unnamed dealership'}</Text>
                          <StatusBadge label={isWinner ? 'Best' : analysis.dealVerdict} tone={isWinner ? 'good' : comparisonTone} />
                        </View>
                        <Text style={styles.detailText}>Estimated financed: {currency(analysis.amountFinanced)}</Text>
                        <Text style={styles.detailText}>Estimated monthly: {currency(analysis.monthlyPayment)}</Text>
                        <Text style={styles.detailText}>Estimated total paid: {currency(analysis.totalPaid)}</Text>
                        <Text style={styles.detailText}>Warning count: {analysis.dealWarnings.length + analysis.flaggedFees.length}</Text>
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

        {screen === 'notes' && (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.screenTitle}>Dealership notes</Text>
              <TouchableOpacity onPress={() => setScreen('home')}>
                <Text style={styles.linkText}>Home</Text>
              </TouchableOpacity>
            </View>
            <Card>
              <Text style={styles.heroText}>Save quotes, salesperson names, promises, add-ons they pushed, and anything that felt off.</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Example: Dealer quoted 8.9% APR, pushed paint protection, and would not show full out-the-door price until late in the conversation."
                placeholderTextColor="#94a3b8"
                multiline
                textAlignVertical="top"
              />
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
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    padding: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    borderRadius: 14,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
  },
  tabButtonText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
  },
  tabButtonTextActive: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
  },
  badgeGood: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  badgeWarn: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  badgeBad: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 12,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    marginRight: 12,
  },
  heroText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
  stackGap: {
    gap: 12,
  },
  stackGapSmall: {
    gap: 8,
  },
  button: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonPrimary: {
    backgroundColor: '#0f172a',
  },
  buttonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  buttonDanger: {
    backgroundColor: '#7f1d1d',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonPrimaryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonSecondaryText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonDangerText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  menuTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0f172a',
  },
  menuDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
  },
  sectionLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  questionTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 8,
  },
  questionSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#64748b',
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  optionButtonActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  optionText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  doubleButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  flexOne: {
    flex: 1,
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 999,
  },
  heroWarningBox: {
    backgroundColor: '#fff7ed',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fdba74',
    gap: 4,
  },
  heroWarningTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#9a3412',
    marginBottom: 2,
  },
  heroWarningText: {
    fontSize: 14,
    color: '#9a3412',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  infoBoxText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
  },
  warningRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  warningBullet: {
    fontSize: 16,
    color: '#b45309',
    fontWeight: '700',
  },
  warningText: {
    flex: 1,
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  linkText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 15,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#334155',
  },
  bold: {
    fontWeight: '700',
    color: '#0f172a',
  },
  scriptBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  checkItem: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  checkItemActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  checkMark: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '700',
  },
  checkMarkActive: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
  },
  checkText: {
    flex: 1,
    color: '#0f172a',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  checkTextActive: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  dangerPanel: {
    backgroundColor: '#7f1d1d',
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  dangerPanelTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 2,
  },
  dangerPanelText: {
    color: '#fecaca',
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    color: '#0f172a',
    fontWeight: '800',
  },
  copyHint: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  scriptTile: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  inputWrap: {
    gap: 6,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  input: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    color: '#0f172a',
    fontSize: 15,
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  gradePanel: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  gradeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  highRiskTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#7f1d1d',
  },
  warningRowCard: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  headToHeadHeader: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  headToHeadDealName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  compareLabel: {
    flex: 1.1,
    fontSize: 13,
    color: '#475569',
    fontWeight: '700',
  },
  compareValue: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  comparePickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comparePickName: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  comparePickButton: {
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  comparePickButtonActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  comparePickButtonText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 13,
  },
  comparePickButtonTextActive: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  notesInput: {
    minHeight: 240,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#0f172a',
    fontSize: 15,
    lineHeight: 22,
  },
});
