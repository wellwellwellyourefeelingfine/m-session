/**
 * DosageTool Component
 *
 * A simple, harm-reduction focused dosage guidance tool.
 * Lives in the Tools tab. Weight-based ranges with optional booster info.
 */

import { useState } from 'react';
import TestingTool from './TestingTool';

// Therapeutic range: 1.0 - 1.5 mg/kg with floor/ceiling
const calculateRange = (weightKg) => {
  const lowMgKg = 1.0;
  const highMgKg = 1.5;

  let low = Math.round(weightKg * lowMgKg);
  let high = Math.round(weightKg * highMgKg);

  // Floor of 75mg, ceiling of 150mg
  low = Math.max(75, Math.min(low, 120));
  high = Math.max(100, Math.min(high, 150));

  // Round to nearest 5
  low = Math.round(low / 5) * 5;
  high = Math.round(high / 5) * 5;

  return { low, high };
};

export default function DosageTool() {
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('lb'); // 'kg' or 'lb'
  const [showBooster, setShowBooster] = useState(false);
  const [showTesting, setShowTesting] = useState(false);

  const weightKg = unit === 'kg'
    ? parseFloat(weight)
    : parseFloat(weight) * 0.453592;

  const hasValidWeight = !isNaN(weightKg) && weightKg > 30 && weightKg < 200;
  const range = hasValidWeight ? calculateRange(weightKg) : null;

  // Booster is typically 50% of initial, capped reasonably
  const boosterRange = range ? {
    low: Math.round(range.low * 0.5 / 5) * 5,
    high: Math.round(range.high * 0.5 / 5) * 5,
  } : null;

  return (
    <div className="py-6 px-6 max-w-xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="uppercase tracking-wider text-xs text-app-gray-600 dark:text-app-gray-400">
          Dosage Guidance
        </h3>
        <p className="text-sm text-app-gray-500 dark:text-app-gray-400">
          General guidance based on harm reduction research. Not medical advice.
        </p>
      </div>

      {/* Weight Input */}
      <div className="space-y-3">
        <label className="block text-xs uppercase tracking-wider text-app-gray-500">
          Your weight
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            inputMode="numeric"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={unit === 'kg' ? '70' : '150'}
            className="w-20 bg-transparent border-b border-app-gray-300 dark:border-app-gray-700
                       py-3 text-lg focus:outline-none focus:border-app-black dark:focus:border-app-white
                       transition-colors duration-200"
          />
          <div className="flex text-sm">
            <button
              onClick={() => setUnit('lb')}
              className={`px-3 py-1 border border-[var(--color-border)] border-r-0 transition-colors
                ${unit === 'lb'
                  ? 'bg-[var(--color-text-primary)] text-[var(--color-bg)]'
                  : 'bg-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}`}
            >
              lb
            </button>
            <button
              onClick={() => setUnit('kg')}
              className={`px-3 py-1 border border-[var(--color-border)] transition-colors
                ${unit === 'kg'
                  ? 'bg-[var(--color-text-primary)] text-[var(--color-bg)]'
                  : 'bg-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}`}
            >
              kg
            </button>
          </div>
        </div>
      </div>

      {/* Result */}
      {range && (
        <div className="space-y-4 pt-6 border-t border-app-gray-200 dark:border-app-gray-800">
          <div className="text-center space-y-1">
            <p className="text-xs uppercase tracking-wider text-app-gray-500">
              Suggested range
            </p>
            <p className="text-3xl font-light">
              {range.low} – {range.high} mg
            </p>
          </div>

          <p className="text-sm text-app-gray-600 dark:text-app-gray-400 text-center">
            Lower doses often produce profound experiences with easier comedowns.
            More isn't necessarily better.
          </p>
        </div>
      )}

      {/* Booster Toggle */}
      {range && (
        <div className="space-y-4">
          <button
            onClick={() => setShowBooster(!showBooster)}
            className="w-full text-left py-3 border-t border-b border-app-gray-200 dark:border-app-gray-800
                       text-sm flex justify-between items-center hover:opacity-70 transition-opacity"
          >
            <span>Planning to use a booster?</span>
            <span className="text-app-gray-400">{showBooster ? '−' : '+'}</span>
          </button>

          {showBooster && (
            <div className="space-y-4 text-sm text-app-gray-600 dark:text-app-gray-400">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider text-app-gray-500 mb-1">
                  Booster dose
                </p>
                <p className="text-xl font-light text-app-black dark:text-app-white">
                  {boosterRange.low} – {boosterRange.high} mg
                </p>
                <p className="text-xs text-app-gray-500 mt-1">
                  (half your initial dose)
                </p>
              </div>

              <div className="space-y-3">
                <p>
                  <span className="text-app-black dark:text-app-white">Timing:</span>{' '}
                  60–90 minutes after ingestion, or 30 minutes after feeling fully arrived.
                  Later than 2 hours mostly extends the comedown.
                </p>
                <p>
                  <span className="text-app-black dark:text-app-white">Total ceiling:</span>{' '}
                  Most harm reduction guidance suggests staying under 180–200mg total.
                </p>
                <p>
                  <span className="text-app-black dark:text-app-white">Tradeoff:</span>{' '}
                  Extends the experience but can intensify next-day effects. Many find a
                  single dose sufficient.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Safety Notes */}
      <div className="space-y-3 pt-4 border-t border-app-gray-200 dark:border-app-gray-800">
        <p className="text-xs uppercase tracking-wider text-app-gray-500">
          Important
        </p>
        <ul className="space-y-3 text-sm text-app-gray-600 dark:text-app-gray-400">
          <li>
            <span className="text-app-black dark:text-app-white">Test your substance</span>{' '}
            if possible. Reagent kits identify dangerous adulterants.{' '}
            <a
              href="https://dancesafe.org/testing-kit-instructions/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-70 transition-opacity"
            >
              More info
            </a>
          </li>
          <li>
            <span className="text-app-black dark:text-app-white">Medications matter.</span>{' '}
            SSRIs, MAOIs, and lithium have dangerous interactions.
          </li>
          <li>
            <span className="text-app-black dark:text-app-white">New batch?</span>{' '}
            Start at the lower end. Purity varies.
          </li>
          <li>
            <span className="text-app-black dark:text-app-white">Individual response varies.</span>{' '}
            These are starting points, not prescriptions.
          </li>
        </ul>
      </div>

      {/* Substance Testing - collapsible */}
      <div className="pt-4 border-t border-app-gray-200 dark:border-app-gray-800">
        <button
          onClick={() => setShowTesting(!showTesting)}
          className="w-full text-left py-3 text-sm flex justify-between items-center hover:opacity-70 transition-opacity"
        >
          <span>Substance Testing</span>
          <span className="text-app-gray-400">{showTesting ? '−' : '+'}</span>
        </button>

        {showTesting && (
          <div className="[&>div]:py-0 [&>div]:px-0">
            <TestingTool />
          </div>
        )}
      </div>
    </div>
  );
}
