export interface ParsedReceipt {
  amount: number | null;
  date: number | null;
  vendor: string | null;
  rawText: string;
}

const TOTAL_KEYWORDS = /\b(total|amount\s*due|grand\s*total|balance\s*due|balance)\b/i;
const MONEY_RE = /(\d{1,3}(?:[ ,.]\d{3})*|\d+)[.,](\d{2})\b/g;

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

const parseMoney = (whole: string, frac: string): number => {
  const cleanedWhole = whole.replace(/[ ,.]/g, '');
  const n = parseFloat(`${cleanedWhole}.${frac}`);
  return Number.isFinite(n) ? n : NaN;
};

const extractAmount = (lines: string[]): number | null => {
  for (const line of lines) {
    if (!TOTAL_KEYWORDS.test(line)) continue;
    const matches = [...line.matchAll(MONEY_RE)];
    if (matches.length === 0) continue;
    const last = matches[matches.length - 1];
    const n = parseMoney(last[1], last[2]);
    if (Number.isFinite(n) && n > 0) return n;
  }

  const start = Math.floor(lines.length / 2);
  let best = NaN;
  for (let i = start; i < lines.length; i++) {
    for (const m of lines[i].matchAll(MONEY_RE)) {
      const n = parseMoney(m[1], m[2]);
      if (Number.isFinite(n) && (Number.isNaN(best) || n > best)) best = n;
    }
  }
  return Number.isFinite(best) ? best : null;
};

const clampDate = (ms: number): number | null => {
  const now = Date.now();
  const fiveYears = 5 * 365 * 24 * 60 * 60 * 1000;
  if (ms > now + 24 * 60 * 60 * 1000) return null;
  if (ms < now - fiveYears) return null;
  return ms;
};

const tryNumericDate = (s: string): number | null => {
  const m = s.match(/(\d{1,4})([./-])(\d{1,2})\2(\d{1,4})/);
  if (!m) return null;
  const a = parseInt(m[1], 10);
  const b = parseInt(m[3], 10);
  const c = parseInt(m[4], 10);
  let y: number, mo: number, d: number;
  if (m[1].length === 4) {
    y = a; mo = b - 1; d = c;
  } else if (m[4].length === 4) {
    d = a; mo = b - 1; y = c;
    if (a > 12 && b <= 12) { d = a; mo = b - 1; }
    else if (b > 12 && a <= 12) { mo = a - 1; d = b; }
  } else {
    d = a; mo = b - 1; y = c < 100 ? 2000 + c : c;
  }
  if (mo < 0 || mo > 11 || d < 1 || d > 31) return null;
  const ms = new Date(y, mo, d).getTime();
  return clampDate(ms);
};

const tryMonthNameDate = (s: string): number | null => {
  const m = s.match(/([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{2,4})/);
  if (!m) return null;
  const mo = MONTHS[m[1].slice(0, 3).toLowerCase()];
  if (mo === undefined) return null;
  const d = parseInt(m[2], 10);
  let y = parseInt(m[3], 10);
  if (y < 100) y += 2000;
  if (d < 1 || d > 31) return null;
  return clampDate(new Date(y, mo, d).getTime());
};

const extractDate = (lines: string[]): number | null => {
  for (const line of lines) {
    const n = tryNumericDate(line) ?? tryMonthNameDate(line);
    if (n !== null) return n;
  }
  return null;
};

const extractVendor = (lines: string[]): string | null => {
  for (const raw of lines) {
    const line = raw.trim();
    if (line.length < 2) continue;
    if (!/[a-zA-Z]/.test(line)) continue;
    if (/^(receipt|invoice|tel|phone|fax|address)/i.test(line)) continue;
    const words = line.split(/\s+/).slice(0, 5);
    return words
      .map((w) => (w.length > 1 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(' ');
  }
  return null;
};

export const parseReceiptText = (text: string): ParsedReceipt => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return {
    amount: extractAmount(lines),
    date: extractDate(lines),
    vendor: extractVendor(lines),
    rawText: text,
  };
};
