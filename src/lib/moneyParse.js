// ============================================================
// MONEY: calculator, smart add and "is this a bill task?"
//
//   calcAmount('120+45+30')         → 195
//   parseMoneyText('petrol 500 upi') → { kind: 'expense', category: 'travel',
//                                        item: 'petrol', amount: 500, payMode: 'upi' }
//   billFromTitle('Pay electricity bill') → { category: 'bills', item: 'electricity', … }
//
// The words it understands are in src/data/money.js (5 languages).
// ============================================================

import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAY_MODES } from '@/data/money';

// Biggest amount we accept (₹10 crore)
export const MAX_AMOUNT = 100000000;

// Tamil, Malayalam, Telugu and Hindi digits → 0-9
const DIGIT_SETS = ['०१२३४५६७८९', '௦௧௨௩௪௫௬௭௮௯', '൦൧൨൩൪൫൬൭൮൯', '౦౧౨౩౪౫౬౭౮౯'];
export function toAsciiDigits(text) {
  let out = String(text ?? '');
  for (const set of DIGIT_SETS) {
    for (let d = 0; d < 10; d++) out = out.split(set[d]).join(String(d));
  }
  return out;
}

// ------------------------------------------------------------
// Calculator: "120+45+30", "3×40", "1,20,000" → number (or null)
// Allowed: digits, . , + − × ÷ * / x
// ------------------------------------------------------------
export function calcAmount(text) {
  const s = toAsciiDigits(text)
    .replace(/[\s,₹]/g, '')
    .replace(/[x×]/gi, '*')
    .replace(/÷/g, '/')
    .replace(/[−–]/g, '-');
  if (!s || !/^[\d.+\-*/]+$/.test(s)) return null;

  const tokens = s.match(/\d+(?:\.\d+)?|\d*\.\d+|[+\-*/]/g);
  if (!tokens || tokens.join('') !== s) return null;

  let i = 0;
  const number = () => {
    const token = tokens[i++];
    if (token === undefined || /^[+\-*/]$/.test(token)) throw new Error('bad');
    return parseFloat(token);
  };

  try {
    // × and ÷ first, then + and −
    let total = 0;
    let sign = 1;
    let term = number();
    while (i < tokens.length) {
      const op = tokens[i++];
      const n = number();
      if (op === '*') term *= n;
      else if (op === '/') {
        if (n === 0) return null;
        term /= n;
      } else {
        total += sign * term;
        sign = op === '+' ? 1 : -1;
        term = n;
      }
    }
    total += sign * term;
    const rounded = Math.round(total * 100) / 100;
    return Number.isFinite(rounded) && rounded > 0 && rounded <= MAX_AMOUNT ? rounded : null;
  } catch {
    return null;
  }
}

// Does the text have + − × ÷ in it? (then we show "= ₹195")
export const hasMath = (text) => /\d\s*[+\-*/x×÷−]\s*\d/i.test(toAsciiDigits(text));

// ------------------------------------------------------------
// Word matching (English: whole word · other languages: anywhere)
// ------------------------------------------------------------
const LATIN = /^[a-z0-9 ]+$/;
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function matcher(word) {
  const w = word.toLowerCase();
  if (LATIN.test(w)) {
    const pattern = new RegExp(`(^|[^a-z0-9])(${escape(w)})(?![a-z0-9])`);
    return (text) => {
      const m = pattern.exec(text);
      return m ? { index: m.index + m[1].length, length: w.length } : null;
    };
  }
  return (text) => {
    const index = text.indexOf(w);
    return index >= 0 ? { index, length: w.length } : null;
  };
}

// Everything smart add can recognise, most specific first
// (quick choices → income types → expense categories)
const CANDIDATES = [
  ...EXPENSE_CATEGORIES.flatMap((c) =>
    c.items.map((item) => ({ kind: 'expense', category: c.key, item: item.key, words: item.words }))
  ),
  ...INCOME_CATEGORIES.map((c) => ({ kind: 'income', category: c.key, item: null, words: c.words })),
  ...EXPENSE_CATEGORIES.map((c) => ({ kind: 'expense', category: c.key, item: null, words: c.words })),
].map((c) => ({ ...c, tests: [...new Set(c.words)].map(matcher) }));

const MODE_TESTS = PAY_MODES.map((m) => ({ key: m.key, tests: [...new Set(m.words)].map(matcher) }));
// Payment app names (GPay, PhonePe, Paytm…) — read before anything else
const APP_TESTS = MODE_TESTS.filter((m) => m.key === 'upi');

// Longest matching word wins; on a tie, the earlier entry wins
function bestMatch(text, list) {
  let best = null;
  for (const entry of list) {
    for (const test of entry.tests) {
      const hit = test(text);
      if (hit && (!best || hit.length > best.hit.length)) best = { entry, hit };
    }
  }
  return best;
}

// Replace a part of the text with spaces (same length, so positions stay)
const blank = (text, { index, length }) => text.slice(0, index) + ' '.repeat(length) + text.slice(index + length);

// Amounts like "500", "₹1,20,000", "120+45", "35k", "3x40"
const AMOUNT = /(?:₹\s*)?\d[\d,]*(?:\.\d+)?(?:\s*k(?![a-z]))?(?:\s*[+\-*x×/÷]\s*\d[\d,]*(?:\.\d+)?(?:\s*k(?![a-z]))?)*/gi;
const NOISE = /(?:^|\s)(?:rs\.?|inr|rupees?|ரூபாய்|ரூ\.?|രൂപ|రూపాయలు|రూ\.?|रुपये|रुपए|रु\.?)(?=\s|$)|\/-/gi;

function readAmount(raw) {
  const text = raw.replace(/₹/g, '').replace(/(\d[\d.,]*)\s*k\b/gi, (_, n) => `${n.replace(/,/g, '')}*1000`);
  return calcAmount(text);
}

// ------------------------------------------------------------
// Smart add: one line → a money entry
// Returns { kind, category, item, amount, payMode, note } (amount may be null)
// ------------------------------------------------------------
export function parseMoneyText(input) {
  const original = toAsciiDigits(input).slice(0, 300);
  let text = original.toLowerCase();

  // 1. Amount: the biggest number in the line ("2 tea 40" → 40)
  let amount = null;
  let amountSpan = null;
  for (const m of text.matchAll(AMOUNT)) {
    const value = readAmount(m[0]);
    if (value !== null && (amount === null || value > amount)) {
      amount = value;
      amountSpan = { index: m.index, length: m[0].length };
    }
  }
  if (amountSpan) text = blank(text, amountSpan);
  text = text.replace(NOISE, (m) => ' '.repeat(m.length));

  // 2. Payment app names first ("phone pe" is not a phone!)
  let payMode = null;
  const app = bestMatch(text, APP_TESTS);
  if (app) {
    payMode = 'upi';
    text = blank(text, app.hit);
  }

  // 3. What was it?
  let found = bestMatch(text, CANDIDATES);
  if (found) {
    text = blank(text, found.hit);
    // A category word matched ("LIC premium") — is there an exact item too? (→ Life insurance)
    if (!found.entry.item) {
      const items = CANDIDATES.filter((c) => c.item && c.category === found.entry.category && c.kind === found.entry.kind);
      const exact = bestMatch(text, items);
      if (exact) {
        text = blank(text, exact.hit);
        found = exact;
      }
    }
  }

  // 4. Short payment words ("cash", "upi", "card")
  if (!payMode) {
    const mode = bestMatch(text, MODE_TESTS);
    if (mode) {
      payMode = mode.entry.key;
      text = blank(text, mode.hit);
    }
  }

  // 5. Anything left over becomes the note ("lunch with Ravi 300" → "with Ravi")
  let note = '';
  for (let i = 0; i < original.length; i++) note += text[i] === ' ' && original[i] !== ' ' ? ' ' : original[i];
  note = note.replace(/[\s,.:;\-+]+/g, ' ').trim();
  if (!/[\p{L}]/u.test(note)) note = '';

  return {
    kind: found?.entry.kind || 'expense',
    category: found?.entry.category || 'others',
    item: found?.entry.item || null,
    amount,
    payMode,
    note: note || null,
    understood: Boolean(found),
  };
}

// ------------------------------------------------------------
// Bill tasks: when one is ticked, VdoU asks "How much did you pay?"
// ------------------------------------------------------------
const BILL_CATEGORIES = new Set(['bills', 'emi', 'insurance']);
const BILL_ITEMS = new Set(['rent', 'maintenance', 'schoolfees', 'collegefees', 'tuition', 'chit', 'subscriptions', 'helper']);
const PAY_WORDS = ['pay', 'paid', 'கட்ட', 'செலுத்து', 'അടയ്ക്ക', 'അടച്ചു', 'చెల్లించు', 'కట్టు', 'भुगतान', 'भरना', 'भरो', 'जमा'].map(matcher);

// Task name → { category, item, amount } when it looks like a bill, else null
export function billFromTitle(title) {
  const parsed = parseMoneyText(title);
  if (!parsed.understood || parsed.kind !== 'expense') return null;
  const lower = toAsciiDigits(title).toLowerCase();
  const payWord = PAY_WORDS.some((test) => test(lower));
  if (BILL_CATEGORIES.has(parsed.category) || BILL_ITEMS.has(parsed.item) || payWord) {
    return { category: parsed.category, item: parsed.item, amount: parsed.amount };
  }
  return null;
}
