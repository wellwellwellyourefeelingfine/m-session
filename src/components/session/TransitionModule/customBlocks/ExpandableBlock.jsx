/**
 * ExpandableBlock — Collapsible section with smooth expand/collapse.
 *
 * Two content modes:
 *   - `lines: [...]` (default) — free-text lines via renderContentLines,
 *     supporting `§` spacers and `{accent}` terms.
 *   - `items: [{ name, description }]` — boxed list. Each item renders as a
 *     bordered card with the name in uppercase mono on top and the
 *     description below in muted body text. Optional `footnote` italic.
 *
 * Config:
 *   {
 *     type: 'expandable',
 *     showLabel: 'See examples',
 *     hideLabel: 'Hide examples',       // optional — defaults to showLabel
 *                                         //   (pair with `icon: 'circle-plus'`
 *                                         //   so the affordance is the icon,
 *                                         //   not the label copy)
 *     icon: 'circle-plus',               // optional — 'circle-plus' renders
 *                                         //   a plus-in-circle before the
 *                                         //   label, swaps to circle-minus
 *                                         //   when expanded
 *     alignment: 'center',               // 'left' | 'center'
 *     lineStyle: 'italic',               // 'normal' | 'italic' | 'subdued'
 *     lines: [...],                      // OR
 *     items: [{ name, description }],    // boxed-list mode
 *     footnote: 'These are starting...', // optional, only used with `items`
 *   }
 */

import { useState } from 'react';
import renderContentLines from '../../../active/modules/MasterModule/utils/renderContentLines';
import { CirclePlusIcon, CircleSkipIcon } from '../../../shared/Icons';

export default function ExpandableBlock({ block, context }) {
  const [visible, setVisible] = useState(false);
  const accentTerms = context?.accentTerms || {};

  const showLabel = block.showLabel || 'Show';
  // Default `hideLabel` to the same copy as `showLabel` — authors can now rely
  // on the icon swap (plus → minus) as the visual toggle cue.
  const hideLabel = block.hideLabel || showLabel;
  const alignment = block.alignment || 'center';
  const lineStyle = block.lineStyle || 'normal';
  const icon = block.icon;

  const alignmentClass = alignment === 'left' ? 'justify-start' : 'justify-center';
  const contentClass =
    lineStyle === 'italic' ? 'italic text-[var(--color-text-tertiary)]'
    : lineStyle === 'subdued' ? 'text-[var(--color-text-tertiary)]'
    : '';

  const IconComp = icon === 'circle-plus'
    ? (visible ? CircleSkipIcon : CirclePlusIcon)
    : null;

  return (
    <div className="w-full">
      {/* Toggle button — icon sits AFTER the label (right side) for
          consistency with the rest of the app's expandable affordances. */}
      <div className={`flex items-center ${alignmentClass}`}>
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]
            hover:text-[var(--color-text-secondary)] transition-colors
            inline-flex items-center gap-2"
        >
          {visible ? hideLabel : showLabel}
          {IconComp && <IconComp size={14} className="text-[var(--color-text-tertiary)]" />}
        </button>
      </div>

      {/* Slide-down content. maxHeight is generous (2000px) — the slide
          animation only needs an upper bound; long lists like the protector
          examples (10 cards + footnote) won't get clipped. */}
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: visible ? '2000px' : '0',
          opacity: visible ? 1 : 0,
        }}
      >
        <div className={`pt-3 ${contentClass}`}>
          {Array.isArray(block.items) ? (
            // Boxed-list mode — bordered cards with uppercase mono name on
            // top and a muted description below. Mirrors the legacy IFS
            // examples-list styling so it can be reused for any future
            // "labeled options" list.
            <div className="space-y-1.5 animate-fadeIn">
              {block.items.map((item, i) => (
                <div key={i} className="border border-[var(--color-border)] px-3 py-1.5">
                  <p className="text-[var(--color-text-primary)] text-xs uppercase tracking-wider">
                    {item.name}
                  </p>
                  <p className="text-[var(--color-text-tertiary)] text-[11px] normal-case tracking-normal">
                    {item.description}
                  </p>
                </div>
              ))}
              {block.footnote && (
                <p className="text-[var(--color-text-tertiary)] text-[11px] italic mt-2">
                  {block.footnote}
                </p>
              )}
            </div>
          ) : (
            renderContentLines(block.lines, accentTerms)
          )}
        </div>
      </div>
    </div>
  );
}
