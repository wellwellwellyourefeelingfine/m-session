/**
 * ProtectorFieldBlock — Free-text input that mirrors directly to
 * sessionProfile.protector.<field>.
 *
 * Used in Part 1 of the Dialogue with a Protector to capture the four
 * durable identity fields (name, description, bodyLocation, message). The
 * block writes via updateProtector(field, value) so the values are
 * available as runtime tokens ({protectorName}, {bodyLocation}) and so
 * Part 2's reconnect screen can read them.
 *
 * Supports `requireForContinue: true` to gate the section's primary
 * button until the user has entered something — used on the protector
 * name input, where having a name is a prerequisite for everything that
 * follows.
 *
 * Config:
 *   {
 *     type: 'protector-field',
 *     field: 'name' | 'description' | 'bodyLocation' | 'message',
 *     prompt: 'Where in your body did you feel it?',
 *     placeholder: 'e.g., tightness in my chest',
 *     multiline: false,            // textarea instead of input
 *     rows: 4,                     // for multiline
 *     centerInput: true,           // center text in input (single-line only)
 *     requireForContinue: false,
 *     journalLabel: 'Body location',
 *   }
 */

import { useEffect } from 'react';
import { useSessionStore } from '../../../../../stores/useSessionStore';
import { renderLineWithMarkup, substituteTokensPlain } from '../utils/renderContentLines';

export default function ProtectorFieldBlock({ block, context }) {
  const { field } = block;
  const value = useSessionStore((s) => s.sessionProfile?.protector?.[field]) || '';
  const updateProtector = useSessionStore((s) => s.updateProtector);
  const accentTerms = context?.accentTerms || {};

  const BLOCK_KEY = `protector-field-${field}`;

  // Continue gate (only when requireForContinue is set).
  useEffect(() => {
    if (!block.requireForContinue) return;
    context.reportReady?.(BLOCK_KEY, value.trim().length > 0);
  }, [block.requireForContinue, value, BLOCK_KEY, context]);

  const handleChange = (next) => {
    updateProtector(field, next);
  };

  const resolvedPlaceholder = substituteTokensPlain(
    block.placeholder || '',
    accentTerms
  );

  const inputClass = `w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
    focus:outline-none focus:border-[var(--accent)]
    text-[var(--color-text-primary)] text-sm
    placeholder:text-[var(--color-text-tertiary)]
    ${block.centerInput && !block.multiline ? 'text-center' : ''}`;

  return (
    <div className="space-y-3">
      {block.context && (
        <p className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider leading-relaxed">
          {renderLineWithMarkup(block.context, accentTerms)}
        </p>
      )}

      {block.prompt && (
        <p
          className="text-base text-[var(--color-text-primary)]"
          style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
        >
          {renderLineWithMarkup(block.prompt, accentTerms)}
        </p>
      )}

      {block.multiline ? (
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={resolvedPlaceholder}
          rows={block.rows || 4}
          maxLength={block.maxLength}
          className={`${inputClass} leading-relaxed resize-none`}
          style={{ textTransform: 'none' }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={resolvedPlaceholder}
          maxLength={block.maxLength}
          className={inputClass}
          style={{ textTransform: 'none' }}
        />
      )}
    </div>
  );
}
