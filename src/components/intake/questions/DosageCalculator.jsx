/**
 * DosageCalculator Component
 * Intake question with inline body-weight dosage calculator
 * and link to the full Dosage Assistant in Tools tab.
 */

import { useState } from 'react';
import { useAppStore } from '../../../stores/useAppStore';
import { useToolsStore } from '../../../stores/useToolsStore';
import { ArrowUpRightIcon } from '../../shared/Icons';

// Therapeutic range: 1.0 - 1.5 mg/kg with floor/ceiling
const calculateRange = (weightKg) => {
  let low = Math.round(weightKg * 1.0);
  let high = Math.round(weightKg * 1.5);

  low = Math.max(75, Math.min(low, 120));
  high = Math.max(100, Math.min(high, 150));

  low = Math.round(low / 5) * 5;
  high = Math.round(high / 5) * 5;

  return { low, high };
};

export default function DosageCalculator({ question, onContinue }) {
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('lb');
  const [pressed, setPressed] = useState(false);

  const weightKg = unit === 'kg'
    ? parseFloat(weight)
    : parseFloat(weight) * 0.453592;

  const hasValidWeight = !isNaN(weightKg) && weightKg > 30 && weightKg < 200;
  const range = hasValidWeight ? calculateRange(weightKg) : null;

  const handleOpenDosageTool = () => {
    const { openTools, toggleTool } = useToolsStore.getState();
    if (!openTools.includes('dosage')) {
      toggleTool('dosage');
    }
    useAppStore.getState().setCurrentTab('tools');
  };

  return (
    <div className="space-y-3">
      <p
        className="text-lg"
        style={{
          fontFamily: "'DM Serif Text', serif",
          textTransform: 'none',
          color: 'var(--text-primary)',
        }}
      >
        {question.label}
      </p>

      <div aria-hidden="true" style={{ height: '6px' }} />

      <p style={{ color: 'var(--text-primary)' }}>
        The standard therapeutic dose used in clinical settings is 80–120mg. We recommend staying within this range or setting your dosage based on your weight.
      </p>

      <div aria-hidden="true" style={{ height: '6px' }} />

      {/* Weight-based calculator */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={weight}
            onChange={(e) => setWeight(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder={unit === 'kg' ? '70' : '150'}
            className="w-20 bg-transparent border-b py-3 text-lg focus:outline-none transition-colors duration-200"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          />
          <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            {unit === 'lb' ? 'pounds' : 'kilograms'}
          </span>
          <button
            type="button"
            onClick={() => document.activeElement?.blur()}
            className="px-3 py-1.5 text-xs uppercase tracking-wider transition-opacity hover:opacity-70"
            style={{
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-primary)',
            }}
          >
            enter
          </button>
          <div className="flex text-sm">
            <button
              type="button"
              onClick={() => setUnit('lb')}
              className="px-3 py-1 border transition-colors"
              style={{
                borderColor: 'var(--border)',
                borderRight: 'none',
                backgroundColor: unit === 'lb' ? 'var(--text-primary)' : 'transparent',
                color: unit === 'lb' ? 'var(--bg-primary)' : 'var(--text-tertiary)',
              }}
            >
              lb
            </button>
            <button
              type="button"
              onClick={() => setUnit('kg')}
              className="px-3 py-1 border transition-colors"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: unit === 'kg' ? 'var(--text-primary)' : 'transparent',
                color: unit === 'kg' ? 'var(--bg-primary)' : 'var(--text-tertiary)',
              }}
            >
              kg
            </button>
          </div>
        </div>
      </div>

      {/* Result */}
      {range && (
        <div className="space-y-2 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="text-center space-y-1">
            <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Suggested range
            </p>
            <p
              className="text-3xl"
              style={{
                fontFamily: "'DM Serif Text', serif",
                textTransform: 'none',
                fontWeight: 400,
                color: 'var(--text-primary)',
              }}
            >
              {range.low} – {range.high} mg
            </p>
          </div>
          <p className="text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
            Lower doses often produce profound experiences with easier comedowns. More isn't necessarily better.
          </p>
        </div>
      )}

      <div aria-hidden="true" style={{ height: '6px' }} />

      {/* Link to full Dosage Assistant */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleOpenDosageTool}
          className="inline-flex items-center gap-1 uppercase tracking-wider text-xs"
          style={{ color: 'var(--accent)' }}
        >
          <span>Dosage Assistant</span>
          <ArrowUpRightIcon size={12} />
        </button>
      </div>

      {/* Inline Continue button — rendered here (instead of in IntakeFlow's
          nav row) so it sits flush beneath the Dosage Assistant link
          without the nav row's larger top margin pushing it down. mt-0
          collapses the gap to match pages 8 and 9, where the answer
          buttons sit directly beneath their accent-color link without
          the parent's space-y-3 inserting extra margin. */}
      {onContinue && (
        <button
          type="button"
          onClick={() => { setPressed(true); onContinue(); }}
          className="w-full py-4 uppercase tracking-wider border transition-colors duration-300 mt-0"
          style={{
            backgroundColor: pressed ? 'var(--text-secondary)' : 'var(--text-primary)',
            color: 'var(--bg-primary)',
            borderColor: pressed ? 'var(--text-secondary)' : 'var(--text-primary)',
          }}
        >
          Continue
        </button>
      )}
    </div>
  );
}
