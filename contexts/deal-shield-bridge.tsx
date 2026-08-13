import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import type { BillingDiagnostics } from '@/utils/billing';
import type { MainTab, Screen } from '@/utils/types';

export type BottomTab = 'calculator' | 'lotCoach';

export type DealShieldNavigationApi = {
  openScreen: (screen: Screen, tab?: MainTab) => void;
  goToHub: (tab?: MainTab) => void;
  setBottomTab: (tab: BottomTab) => void;
  getHeaderTitle: () => string;
  refreshBillingDiagnostics: () => Promise<void>;
  getBillingDiagnostics: () => BillingDiagnostics | null;
  getBillingDiagnosticsBusy: () => boolean;
  startPaywallPurchase: () => Promise<void>;
  restorePurchase: () => Promise<void>;
  isPro: () => boolean;
  isPremiumPreview: () => boolean;
  billingStoreUnavailable: () => boolean;
  promptPremiumPreview: (onEnabled?: () => void) => void;
};

type DealShieldBridgeContextValue = {
  registerNavigation: (api: DealShieldNavigationApi | null) => void;
  navigate: (screen: Screen, tab?: MainTab) => void;
  goToHub: (tab?: MainTab) => void;
  setBottomTab: (tab: BottomTab) => void;
  headerTitle: string;
  setHeaderTitle: (title: string) => void;
  billingDiagnostics: BillingDiagnostics | null;
  setBillingDiagnostics: (value: BillingDiagnostics | null) => void;
  billingDiagnosticsBusy: boolean;
  setBillingDiagnosticsBusy: (value: boolean) => void;
  refreshBillingDiagnostics: () => Promise<void>;
  startPaywallPurchase: () => Promise<void>;
  restorePurchase: () => Promise<void>;
  isPro: boolean;
  setIsPro: (value: boolean) => void;
  isPremiumPreview: boolean;
  setIsPremiumPreview: (value: boolean) => void;
  billingStoreUnavailable: boolean;
  setBillingStoreUnavailable: (value: boolean) => void;
  promptPremiumPreview: (onEnabled?: () => void) => void;
  setPromptPremiumPreview: (fn: (onEnabled?: () => void) => void) => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const DealShieldBridgeContext = createContext<DealShieldBridgeContextValue | null>(null);

export function DealShieldBridgeProvider({ children }: { children: React.ReactNode }) {
  const navigationRef = useRef<DealShieldNavigationApi | null>(null);
  const promptPremiumPreviewRef = useRef<(onEnabled?: () => void) => void>(() => undefined);

  const [headerTitle, setHeaderTitle] = useState('DealShield');
  const [billingDiagnostics, setBillingDiagnostics] = useState<BillingDiagnostics | null>(null);
  const [billingDiagnosticsBusy, setBillingDiagnosticsBusy] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isPremiumPreview, setIsPremiumPreview] = useState(false);
  const [billingStoreUnavailable, setBillingStoreUnavailable] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const registerNavigation = useCallback((api: DealShieldNavigationApi | null) => {
    navigationRef.current = api;
    if (api) {
      setHeaderTitle(api.getHeaderTitle());
      setBillingDiagnostics(api.getBillingDiagnostics());
      setBillingDiagnosticsBusy(api.getBillingDiagnosticsBusy());
      setIsPro(api.isPro());
      setIsPremiumPreview(api.isPremiumPreview());
      setBillingStoreUnavailable(api.billingStoreUnavailable());
      promptPremiumPreviewRef.current = api.promptPremiumPreview;
    }
  }, []);

  const navigate = useCallback((screen: Screen, tab?: MainTab) => {
    navigationRef.current?.openScreen(screen, tab);
  }, []);

  const goToHub = useCallback((tab?: MainTab) => {
    navigationRef.current?.goToHub(tab);
  }, []);

  const setBottomTab = useCallback((tab: BottomTab) => {
    navigationRef.current?.setBottomTab(tab);
  }, []);

  const refreshBillingDiagnostics = useCallback(async () => {
    await navigationRef.current?.refreshBillingDiagnostics();
    const api = navigationRef.current;
    if (api) {
      setBillingDiagnostics(api.getBillingDiagnostics());
      setBillingDiagnosticsBusy(api.getBillingDiagnosticsBusy());
      setIsPro(api.isPro());
      setIsPremiumPreview(api.isPremiumPreview());
      setBillingStoreUnavailable(api.billingStoreUnavailable());
    }
  }, []);

  const startPaywallPurchase = useCallback(async () => {
    await navigationRef.current?.startPaywallPurchase();
    const api = navigationRef.current;
    if (api) {
      setIsPro(api.isPro());
      setIsPremiumPreview(api.isPremiumPreview());
      setBillingStoreUnavailable(api.billingStoreUnavailable());
      setBillingDiagnostics(api.getBillingDiagnostics());
    }
  }, []);

  const restorePurchase = useCallback(async () => {
    await navigationRef.current?.restorePurchase();
    const api = navigationRef.current;
    if (api) {
      setIsPro(api.isPro());
      setIsPremiumPreview(api.isPremiumPreview());
      setBillingStoreUnavailable(api.billingStoreUnavailable());
      setBillingDiagnostics(api.getBillingDiagnostics());
    }
  }, []);

  const promptPremiumPreview = useCallback((onEnabled?: () => void) => {
    promptPremiumPreviewRef.current(onEnabled);
  }, []);

  const setPromptPremiumPreview = useCallback((fn: (onEnabled?: () => void) => void) => {
    promptPremiumPreviewRef.current = fn;
  }, []);

  const value = useMemo(
    () => ({
      registerNavigation,
      navigate,
      goToHub,
      setBottomTab,
      headerTitle,
      setHeaderTitle,
      billingDiagnostics,
      setBillingDiagnostics,
      billingDiagnosticsBusy,
      setBillingDiagnosticsBusy,
      refreshBillingDiagnostics,
      startPaywallPurchase,
      restorePurchase,
      isPro,
      setIsPro,
      isPremiumPreview,
      setIsPremiumPreview,
      billingStoreUnavailable,
      setBillingStoreUnavailable,
      promptPremiumPreview,
      setPromptPremiumPreview,
      drawerOpen,
      openDrawer,
      closeDrawer,
    }),
    [
      registerNavigation,
      navigate,
      goToHub,
      setBottomTab,
      headerTitle,
      billingDiagnostics,
      billingDiagnosticsBusy,
      refreshBillingDiagnostics,
      startPaywallPurchase,
      restorePurchase,
      isPro,
      isPremiumPreview,
      billingStoreUnavailable,
      promptPremiumPreview,
      setPromptPremiumPreview,
      drawerOpen,
      openDrawer,
      closeDrawer,
    ]
  );

  return <DealShieldBridgeContext.Provider value={value}>{children}</DealShieldBridgeContext.Provider>;
}

export function useDealShieldBridge() {
  const context = useContext(DealShieldBridgeContext);
  if (!context) {
    throw new Error('useDealShieldBridge must be used within DealShieldBridgeProvider');
  }
  return context;
}
