// ============================================================
// BENEFITS — finds the benefit line for a task name
// The library (words + sentences) is in src/data/benefits.js
// ============================================================

import { BENEFITS } from '@/data/benefits';

// English words must match a whole word ("read" ≠ "ready");
// Tamil, Malayalam, Telugu and Hindi words match anywhere.
const LATIN = /^[a-z0-9 ]+$/;
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const MATCHERS = BENEFITS.map((benefit) => ({
  benefit,
  tests: benefit.words.map((word) => {
    const w = word.toLowerCase();
    if (!LATIN.test(w)) return (title) => title.includes(w);
    const pattern = new RegExp(`(^|[^a-z])${escape(w)}($|[^a-z])`);
    return (title) => pattern.test(title);
  }),
}));

// "Drink 3 litres water" → { emoji: '💧', text: 'Keeps your energy up…' } or null
export function findBenefit(title, lang) {
  const name = String(title || '').toLowerCase();
  if (!name.trim()) return null;
  const found = MATCHERS.find(({ tests }) => tests.some((test) => test(name)));
  if (!found) return null;
  const { benefit } = found;
  return { key: benefit.key, emoji: benefit.emoji, text: benefit.text[lang] || benefit.text.en };
}
