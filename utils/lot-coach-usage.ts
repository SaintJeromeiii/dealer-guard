export const LOT_COACH_DAILY_LIMIT = 20;

export type LotCoachUsageRecord = {
  date: string;
  count: number;
};

export function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getRemainingLotCoachQuestions(usage: LotCoachUsageRecord) {
  return Math.max(0, LOT_COACH_DAILY_LIMIT - usage.count);
}

export function canAskLotCoach(usage: LotCoachUsageRecord) {
  return getRemainingLotCoachQuestions(usage) > 0;
}

export function normalizeLotCoachUsage(raw: string | null, now = new Date()): LotCoachUsageRecord {
  const today = getTodayKey(now);

  if (!raw) {
    return { date: today, count: 0 };
  }

  try {
    const parsed = JSON.parse(raw) as LotCoachUsageRecord;
    if (parsed.date !== today) {
      return { date: today, count: 0 };
    }

    return {
      date: today,
      count: Number.isFinite(parsed.count) ? parsed.count : 0,
    };
  } catch {
    return { date: today, count: 0 };
  }
}

export function incrementLotCoachUsage(usage: LotCoachUsageRecord, now = new Date()): LotCoachUsageRecord {
  return {
    date: getTodayKey(now),
    count: usage.count + 1,
  };
}
