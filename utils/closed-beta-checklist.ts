import AsyncStorage from '@react-native-async-storage/async-storage';

export const CLOSED_BETA_CHECKLIST_KEY = 'closed_beta_checklist_v1';

export type ClosedBetaChecklistStep = 'sampleDealLoaded' | 'lotCoachAsked' | 'pressureLogged';

export type ClosedBetaChecklist = {
  sampleDealLoaded: boolean;
  lotCoachAsked: boolean;
  pressureLogged: boolean;
  dismissed: boolean;
};

export const EMPTY_CLOSED_BETA_CHECKLIST: ClosedBetaChecklist = {
  sampleDealLoaded: false,
  lotCoachAsked: false,
  pressureLogged: false,
  dismissed: false,
};

export function normalizeClosedBetaChecklist(raw: string | null): ClosedBetaChecklist {
  if (!raw) return { ...EMPTY_CLOSED_BETA_CHECKLIST };

  try {
    const parsed = JSON.parse(raw) as Partial<ClosedBetaChecklist>;
    return {
      sampleDealLoaded: !!parsed.sampleDealLoaded,
      lotCoachAsked: !!parsed.lotCoachAsked,
      pressureLogged: !!parsed.pressureLogged,
      dismissed: !!parsed.dismissed,
    };
  } catch {
    return { ...EMPTY_CLOSED_BETA_CHECKLIST };
  }
}

export function isClosedBetaChecklistComplete(checklist: ClosedBetaChecklist) {
  return checklist.sampleDealLoaded && checklist.lotCoachAsked && checklist.pressureLogged;
}

export function shouldShowClosedBetaWelcome(checklist: ClosedBetaChecklist) {
  return !checklist.dismissed && !isClosedBetaChecklistComplete(checklist);
}

export function getClosedBetaChecklistProgress(checklist: ClosedBetaChecklist) {
  const completed = [checklist.sampleDealLoaded, checklist.lotCoachAsked, checklist.pressureLogged].filter(Boolean).length;
  return { completed, total: 3 };
}

export async function readClosedBetaChecklist(): Promise<ClosedBetaChecklist> {
  const raw = await AsyncStorage.getItem(CLOSED_BETA_CHECKLIST_KEY);
  return normalizeClosedBetaChecklist(raw);
}

export async function saveClosedBetaChecklist(checklist: ClosedBetaChecklist) {
  await AsyncStorage.setItem(CLOSED_BETA_CHECKLIST_KEY, JSON.stringify(checklist));
}

export async function markClosedBetaStep(step: ClosedBetaChecklistStep) {
  const current = await readClosedBetaChecklist();
  if (current[step]) return current;

  const next = { ...current, [step]: true };
  await saveClosedBetaChecklist(next);
  return next;
}

export async function dismissClosedBetaWelcome() {
  const current = await readClosedBetaChecklist();
  const next = { ...current, dismissed: true };
  await saveClosedBetaChecklist(next);
  return next;
}
