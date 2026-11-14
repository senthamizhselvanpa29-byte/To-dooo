'use client';

// ============================================================
// ✏️ UPDATE VALUES — all at once (takes 2 minutes a month)
//   Mutual fund / shares with units → today's price per unit (NAV)
//   Others (land, LIC, chit…)       → value now
//   Gold / silver                   → today's rate per gram
// FD / RD / PPF grow by themselves, so they are not listed.
// ============================================================

import { useEffect, useState } from 'react';
import { toDateInput } from '@/lib/dates';
import { calcAmount } from '@/lib/moneyParse';
import { usePreferences } from '../Preferences';
import { XIcon } from '../Icons';

export default function UpdateValuesPanel({ investments, settings, actions, onClose }) {
  const { t } = usePreferences();
  const rows = investments.filter((s) => s.type.mode === 'units' || s.type.mode === 'manual');
  const hasGold = investments.some((s) => s.inv.type === 'gold');
  const hasSilver = investments.some((s) => s.inv.type === 'silver');
  const startText = (s) => {
    const v = s.type.mode === 'units' && s.inv.units ? s.inv.price : s.inv.value;
    return v === null || v === undefined ? '' : String(Number(v));
  };
  const [values, setValues] = useState(() => Object.fromEntries(rows.map((s) => [s.inv.id, startText(s)])));
  const [gold, setGold] = useState(settings?.gold_rate ? String(Number(settings.gold_rate)) : '');
  const [silver, setSilver] = useState(settings?.silver_rate ? String(Number(settings.silver_rate)) : '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function saveAll() {
    setBusy(true);
    const today = toDateInput(new Date());
    // Rates first (one rate for all gold / silver)
    const goldRate = gold.trim() ? calcAmount(gold) : null;
    const silverRate = silver.trim() ? calcAmount(silver) : null;
    if ((hasGold && goldRate !== Number(settings?.gold_rate)) || (hasSilver && silverRate !== Number(settings?.silver_rate))) {
      await actions.saveRates({ gold_rate: hasGold ? goldRate : settings?.gold_rate ?? null, silver_rate: hasSilver ? silverRate : settings?.silver_rate ?? null });
    }
    for (const s of rows) {
      const n = calcAmount(values[s.inv.id] || '');
      if (n === null || values[s.inv.id] === startText(s)) continue;
      const byPrice = s.type.mode === 'units' && s.inv.units;
      await actions.addInvestmentTxn(s.inv, { kind: 'value', amount: byPrice ? 0 : n, price: byPrice ? n : undefined, on_date: today });
    }
    setBusy(false);
    onClose();
  }

  return (
    <div className="panel-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="edit-panel money-panel" role="dialog" aria-modal="true" aria-labelledby="update-values-title">
        <div className="edit-panel-head">
          <h2 id="update-values-title">✏️ {t('updateValues')}</h2>
          <button type="button" className="icon-round" aria-label={t('close')} onClick={onClose}>
            <XIcon />
          </button>
        </div>
        <p className="steps-hint">{t('updateValuesHint')}</p>

        {hasGold && (
          <label className="pf-update-row">
            <span>🪙 {t('goldRatePerGram')}</span>
            <input className="chip-input" inputMode="decimal" value={gold} onChange={(e) => setGold(e.target.value)} />
          </label>
        )}
        {hasSilver && (
          <label className="pf-update-row">
            <span>🥈 {t('silverRatePerGram')}</span>
            <input className="chip-input" inputMode="decimal" value={silver} onChange={(e) => setSilver(e.target.value)} />
          </label>
        )}
        {rows.map((s) => (
          <label key={s.inv.id} className="pf-update-row">
            <span>
              {s.type.emoji} {s.inv.name}
              <small>{s.type.mode === 'units' && s.inv.units ? t('pricePerUnit') : t('valueNow')}</small>
            </span>
            <input
              className="chip-input"
              inputMode="decimal"
              value={values[s.inv.id]}
              onChange={(e) => setValues((v) => ({ ...v, [s.inv.id]: e.target.value }))}
            />
          </label>
        ))}

        <div className="edit-panel-actions">
          <span className="spacer" />
          <button type="button" className="ghost-btn" onClick={onClose}>
            {t('cancel')}
          </button>
          <button type="button" className="save-btn" onClick={saveAll} disabled={busy}>
            {t('saveTask')}
          </button>
        </div>
      </div>
    </div>
  );
}
