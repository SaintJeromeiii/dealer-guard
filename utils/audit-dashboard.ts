import { currency } from './finance.ts';
import type { DealShieldAuditDashboard, DealShieldAuditItem } from './types.ts';

type MarkupPattern = {
  id: string;
  label: string;
  patterns: RegExp[];
  explanation: string;
  removalTip: string;
};

const MARKUP_PATTERNS: MarkupPattern[] = [
  {
    id: 'etching',
    label: 'VIN Etching',
    patterns: [/\betch(?:ing)?\b/i, /\bvin\s*etch/i],
    explanation: 'A dealer-applied VIN etching fee is often bundled as theft protection even though etching is optional and sometimes already done at the factory.',
    removalTip: 'Ask them to remove the etching line item in writing and confirm your out-the-door total drops by that exact amount before you sign.',
  },
  {
    id: 'nitrogen',
    label: 'Nitrogen Tire Fill',
    patterns: [/\bnitrogen\b/i, /\bnitro(?:gen)?\s*(?:fill|tire)/i],
    explanation: 'Nitrogen tire inflation is marketed as a premium upgrade, but regular air maintenance is sufficient for most buyers and this fee is rarely mandatory.',
    removalTip: 'Tell the finance manager you will maintain tires with standard air and need the nitrogen charge deleted from the buyer\'s order before signing.',
  },
  {
    id: 'prep-fee',
    label: 'Prep Fee',
    patterns: [/\bprep(?:aration)?\s*fee\b/i, /\bdealer\s*prep\b/i, /\bpreparation\s*charge\b/i],
    explanation: 'Dealer prep fees cover basic delivery tasks that some stores double-charge on top of advertised price or bury in the final paperwork.',
    removalTip: 'Request an itemized breakdown and ask them to waive or reduce prep if it was not disclosed upfront in your original quote.',
  },
  {
    id: 'protection-plan',
    label: 'Protection Plan',
    patterns: [/\bprotection\s*plan\b/i, /\bprotection\s*package\b/i, /\bpaint\s*protection\b/i, /\bfabric\s*protection\b/i],
    explanation: 'Bundled protection plans are high-margin add-ons that may duplicate coverage you already have from insurance, manufacturer warranty, or your card benefits.',
    removalTip: 'Decline the protection bundle for now, ask for the contract reprinted without it, and compare the plan terms against your existing coverage at home.',
  },
  {
    id: 'service-contract',
    label: 'Service Contract',
    patterns: [/\bservice\s*contract\b/i, /\bextended\s*service\b/i, /\bvehicle\s*service\s*contract\b/i],
    explanation: 'An aftermarket service contract extends repair coverage beyond the factory warranty, but it is optional and often rolled into payment without a clear standalone price.',
    removalTip: 'Say you are not buying the service contract today, require it removed from the payment quote, and verify the monthly payment and total paid both decrease.',
  },
];

function parseMoneyAmount(raw: string): string | null {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return String(Math.round(value));
}

function extractAmountFromLine(line: string): string | null {
  const matches = [...line.matchAll(/\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.\d{2})?|[0-9]+(?:\.\d{2})?)/g)];
  if (!matches.length) return null;

  const amounts = matches
    .map((match) => parseMoneyAmount(match[1]))
    .filter((amount): amount is string => !!amount)
    .map((amount) => Number(amount))
    .filter((amount) => amount >= 25);

  if (!amounts.length) return null;
  return String(Math.max(...amounts));
}

function findAmountNearMatch(text: string, lineIndex: number): string | null {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const candidates = [lines[lineIndex], lines[lineIndex + 1], lines[lineIndex - 1]].filter(Boolean);

  for (const line of candidates) {
    const amount = extractAmountFromLine(line);
    if (amount) return amount;
  }

  return null;
}

function findAmountInWindow(text: string, matchIndex: number, matchLength: number): string | null {
  const windowStart = Math.max(0, matchIndex - 40);
  const windowEnd = Math.min(text.length, matchIndex + matchLength + 80);
  const snippet = text.slice(windowStart, windowEnd);
  return extractAmountFromLine(snippet);
}

export function buildDealShieldAuditDashboard(scannedText: string): DealShieldAuditDashboard {
  const text = scannedText.trim();
  if (!text) {
    return { flaggedCount: 0, items: [] };
  }

  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const items: DealShieldAuditItem[] = [];

  for (const pattern of MARKUP_PATTERNS) {
    let matched = false;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      if (!pattern.patterns.some((regex) => regex.test(line))) continue;

      matched = true;
      const amount = findAmountNearMatch(text, lineIndex);
      items.push({
        id: pattern.id,
        label: pattern.label,
        costLabel: amount ? currency(amount) : 'Amount not detected',
        amount,
        explanation: pattern.explanation,
        removalTip: pattern.removalTip,
        sourceLine: line,
      });
      break;
    }

    if (matched) continue;

    for (const regex of pattern.patterns) {
      const match = regex.exec(text);
      if (!match) continue;

      const amount = findAmountInWindow(text, match.index, match[0].length);
      items.push({
        id: pattern.id,
        label: pattern.label,
        costLabel: amount ? currency(amount) : 'Amount not detected',
        amount,
        explanation: pattern.explanation,
        removalTip: pattern.removalTip,
        sourceLine: text.slice(Math.max(0, match.index - 20), Math.min(text.length, match.index + 60)).trim(),
      });
      matched = true;
      break;
    }
  }

  return {
    flaggedCount: items.length,
    items,
  };
}
