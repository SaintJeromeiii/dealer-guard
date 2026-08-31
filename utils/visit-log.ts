import type { PromiseRecord, VisitTimelineEntry } from './types.ts';

export function isDuplicateVisitNote(timeline: VisitTimelineEntry[], detail: string) {
  const text = detail.trim();
  if (!text) return false;
  const latest = timeline.find((entry) => entry.type === 'noteAdded');
  return latest?.detail.trim() === text;
}

export function isDuplicatePromise(promises: PromiseRecord[], text: string) {
  const value = text.trim();
  if (!value) return false;
  return promises.some((promise) => promise.text.trim() === value);
}
