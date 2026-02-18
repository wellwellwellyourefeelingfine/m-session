/**
 * DosageCalculator Component
 * Intake question with inline body-weight dosage calculator
 * and link to the full Dosage Assistant in Tools tab.
 */

import { useState } from 'react';
import { useAppStore } from '../../../stores/useAppStore';
import { useToolsStore } from '../../../stores/useToolsStore';

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

export default function DosageCalculator({ question }) {
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('lb');

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
      <p style={{ color: 'var(--text-primary)' }}>{question.label}</p>

      <div className="flex justify-center"><div className="circle-spacer" /></div>

      <p style={{ color: 'var(--text-primary)' }}>
        The standard therapeutic dose used in clinical settings is 80–120mg. We recommend staying within this range.
      </p>

      <div className="flex justify-center"><div className="circle-spacer" /></div>

      {/* Weight-based calculator */}
      <div className="space-y-3">
        <label className="block text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
          Enter your weight for a personalized suggestion
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            inputMode="numeric"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={unit === 'kg' ? '70' : '150'}
            className="w-20 bg-transparent border-b py-3 text-lg focus:outline-none transition-colors duration-200"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          />
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
            <p className="text-3xl font-light" style={{ color: 'var(--text-primary)' }}>
              {range.low} – {range.high} mg
            </p>
          </div>
          <p className="text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
            Lower doses often produce profound experiences with easier comedowns. More isn't necessarily better.
          </p>
        </div>
      )}

      <div className="flex justify-center"><div className="circle-spacer" /></div>

      <p style={{ color: 'var(--text-tertiary)' }}>
        If your MDMA is in crystal form, you will need a milligram-sensitive scale (often called a jewelry scale, accurate to 0.001g) to measure properly. Standard kitchen scales are not precise enough.
      </p>

      {/* Link to full Dosage Assistant */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleOpenDosageTool}
          className="uppercase tracking-wider text-xs underline"
          style={{ color: 'var(--accent)' }}
        >
          Open Dosage Assistant
        </button>
      </div>
    </div>
  );
}
