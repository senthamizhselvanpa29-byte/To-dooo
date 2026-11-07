'use client';

// ============================================================
// ₹ AMOUNT BOX with a small calculator
//   type 120+45+30 (or tap + − × ÷) → shows "= ₹195"
// The number itself is worked out with calcAmount (src/lib/moneyParse.js)
// ============================================================

import { useRef } from 'react';
import { formatMoney } from '@/lib/money';
import { calcAmount, hasMath } from '@/lib/moneyParse';
import { usePreferences } from '../Preferences';

const KEYS = ['+', '−', '×', '÷'];

export default function AmountInput({ id, value, onChange, autoFocus, invalid }) {
  const { t, lang } = usePreferences();
  const inputRef = useRef(null);
  const result = calcAmount(value);

  function press(key) {
    onChange(`${value}${key}`);
    inputRef.current?.focus();
  }

  return (
    <div className="amount-box">
      <div className={`amount-input${invalid ? ' missing' : ''}`}>
        <span className="amount-rupee" aria-hidden="true">
          ₹
        </span>
        <input
          ref={inputRef}
          id={id}
          inputMode="decimal"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder="0"
          aria-label={t('amountLabel')}
          maxLength={60}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {hasMath(value) && (
          <span className="amount-result" aria-live="polite">
            = {result === null ? '?' : formatMoney(result, lang)}
          </span>
        )}
      </div>
      <div className="calc-keys" aria-label={t('calculator')}>
        {KEYS.map((key) => (
          <button key={key} type="button" className="chip" onClick={() => press(key)}>
            {key}
          </button>
        ))}
        <button type="button" className="chip" aria-label={t('clearAmount')} onClick={() => onChange('')}>
          C
        </button>
      </div>
    </div>
  );
}
