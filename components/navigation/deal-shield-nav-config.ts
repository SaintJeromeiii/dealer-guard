import type { Href } from 'expo-router';

import type { BottomTab } from '@/contexts/deal-shield-bridge';
import type { MainTab, Screen } from '@/utils/types';

export type DealShieldDrawerItem = {
  id: string;
  label: string;
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  kind: 'bottomTab' | 'screen' | 'route';
  bottomTab?: BottomTab;
  screen?: Screen;
  tab?: MainTab;
  href?: Href;
  section?: 'primary' | 'tools' | 'account';
};

export const DEALSHIELD_DRAWER_ITEMS: DealShieldDrawerItem[] = [
  {
    id: 'shield',
    label: 'The Shield',
    icon: 'shield-checkmark-outline',
    kind: 'screen',
    screen: 'scanHub',
    tab: 'scan',
    section: 'primary',
  },
  {
    id: 'calculator',
    label: 'Deal Calculator',
    icon: 'calculator-outline',
    kind: 'bottomTab',
    bottomTab: 'calculator',
    screen: 'analyzerHub',
    tab: 'analyzer',
    section: 'primary',
  },
  {
    id: 'lot-coach',
    label: 'AI Lot Coach',
    icon: 'chatbubble-ellipses-outline',
    kind: 'bottomTab',
    bottomTab: 'lotCoach',
    screen: 'liveMode',
    tab: 'tactics',
    section: 'primary',
  },
  {
    id: 'contract-blocks',
    label: 'Contract Blocks',
    icon: 'document-text-outline',
    kind: 'screen',
    screen: 'dealReview',
    tab: 'analyzer',
    section: 'tools',
  },
  {
    id: 'incident-logs',
    label: 'Incident Logs',
    icon: 'alert-circle-outline',
    kind: 'screen',
    screen: 'notes',
    tab: 'settings',
    section: 'tools',
  },
  {
    id: 'compare-offers',
    label: 'Compare Offers',
    icon: 'git-compare-outline',
    kind: 'screen',
    screen: 'compareDeals',
    tab: 'analyzer',
    section: 'tools',
  },
  {
    id: 'what-if-lab',
    label: 'What-if Lab',
    icon: 'flask-outline',
    kind: 'screen',
    screen: 'whatIfLab',
    tab: 'analyzer',
    section: 'tools',
  },
  {
    id: 'finance-defense',
    label: 'Finance Office Defense',
    icon: 'lock-closed-outline',
    kind: 'screen',
    screen: 'financeDefense',
    tab: 'analyzer',
    section: 'tools',
  },
  {
    id: 'trap-library',
    label: 'Trap Library',
    icon: 'warning-outline',
    kind: 'screen',
    screen: 'traps',
    tab: 'tactics',
    section: 'tools',
  },
  {
    id: 'buyer-checklist',
    label: 'Buyer Checklist',
    icon: 'checkbox-outline',
    kind: 'screen',
    screen: 'checklist',
    tab: 'tactics',
    section: 'tools',
  },
  {
    id: 'tactic-decoder',
    label: 'Tactic Decoder',
    icon: 'search-outline',
    kind: 'screen',
    screen: 'tacticDecoder',
    tab: 'tactics',
    section: 'tools',
  },
  {
    id: 'feature-matrix',
    label: 'Features Matrix',
    icon: 'grid-outline',
    kind: 'screen',
    screen: 'upgradeHub',
    tab: 'settings',
    section: 'account',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings-outline',
    kind: 'screen',
    screen: 'settingsHub',
    tab: 'settings',
    section: 'account',
  },
  {
    id: 'about-legal',
    label: 'About & Legal',
    icon: 'information-circle-outline',
    kind: 'route',
    href: '/(main)/about-legal',
    section: 'account',
  },
];

export function handleDrawerItemPress(
  item: DealShieldDrawerItem,
  actions: {
    closeDrawer: () => void;
    goHome: () => void;
    setBottomTab: (tab: BottomTab) => void;
    navigate: (screen: Screen, tab?: MainTab) => void;
    onRoute: (href: Href) => void;
  }
) {
  actions.closeDrawer();

  if (item.kind === 'route' && item.href) {
    actions.onRoute(item.href);
    return;
  }

  actions.goHome();

  if (item.bottomTab) {
    actions.setBottomTab(item.bottomTab);
  }

  if (item.screen) {
    actions.navigate(item.screen, item.tab);
  }
}
