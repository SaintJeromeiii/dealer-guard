export type Screen =
  | 'home'
  | 'questions'
  | 'result'
  | 'traps'
  | 'checklist'
  | 'liveMode'
  | 'dealReview'
  | 'notes';

export type MainTab = 'home' | 'checklist' | 'traps' | 'dealReview' | 'notes';

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

export type DealState = {
  vehiclePrice: string;
  dealerFees: string;
  addOns: string;
  downPayment: string;
  tradeIn: string;
  apr: string;
  months: string;
};