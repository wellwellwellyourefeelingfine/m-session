/**
 * ExpandableBlock — Collapsible text section with smooth expand/collapse.
 *
 * Mirrors the music module's RecommendationsWidget pattern. Static `lines`
 * array; no randomization. Supports `§` spacers and `{accent}` terms via
 * the shared renderContentLines utility.
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
 *     lines: [...],
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
      {/* Toggle button */}
      <div className={`flex items-center ${alignmentClass}`}>
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]
            hover:text-[var(--color-text-secondary)] transition-colors
            inline-flex items-center gap-2"
        >
          {IconComp && <IconComp size={14} className="text-[var(--color-text-tertiary)]" />}
          {visible ? hideLabel : showLabel}
        </button>
      </div>

      {/* Slide-down content */}
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: visible ? '800px' : '0',
          opacity: visible ? 1 : 0,
        }}
      >
        <div className={`pt-3 ${contentClass}`}>
          {renderContentLines(block.lines, accentTerms)}
        </div>
      </div>
    </div>
  );
}
