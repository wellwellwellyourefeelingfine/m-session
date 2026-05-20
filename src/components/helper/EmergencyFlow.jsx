/**
 * EmergencyFlow
 * Compact emergency support content rendered inline beneath the rating scale
 * when the user selects a rating of 9 or 10. Designed to fit within the
 * expanded modal alongside the CategoryHeader, prompt, and rating scale.
 *
 * Sections (top to bottom):
 *   1. Region selector row (auto-detected, user can override via native <select>)
 *   2. Reassurance text (agnostic, trusts the user's judgment)
 *   3. EmergencyContactCard — shared with EmergencyContactView, shows the
 *      user's saved contact with Name — Phone display and Call/Text buttons.
 *      Suppressed when `hideContactCard` is true (used by EmergencyContactView,
 *      which already shows the contact card at the top of its own page).
 *   4. Emergency services card — single Call button for the region's number
 *   5. Peer support cards — one bordered box per entry in region.peerSupport
 *
 * The optional `onAction` callback is fired BEFORE the browser navigates to
 * any tel:/sms: link, so the parent can write a journal entry capturing the
 * action. Signature: (label, actionType). `label` is a short human-readable
 * string (may contain the user's contact name — journal use only, NOT safe
 * for analytics). `actionType` is a stable categorical enum:
 *   'saved-contact-call' | 'saved-contact-text'
 *   'emergency-services-<REGION>'                 e.g. 'emergency-services-UK'
 *   'peer-support-<REGION>-<slug>-call' | '...-text'   e.g. 'peer-support-UK-samaritans-call'
 */

import { useState, useRef, useEffect } from 'react';
import EmergencyContactCard from './EmergencyContactCard';
import { useAppStore } from '../../stores/useAppStore';
import { REGIONS } from '../../content/regions';

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Tap-to-copy phone number with a subtle fade-swap-fade feedback.
 * Renders as a float-right span so it sits on the same line as the org name
 * without affecting the surrounding paragraph's line-box height.
 *
 * Animation cycle on tap (total ~1.6s):
 *   200ms fade-out number → swap text → 200ms fade-in "Copied" → 800ms hold
 *   → 200ms fade-out → swap text → 200ms fade-in number
 *
 * If the Clipboard API is unavailable or rejected, we silently no-op — users
 * can still long-press the number to invoke the OS text-selection menu.
 */
function CopyablePhone({ displayPhone }) {
  const [label, setLabel] = useState(displayPhone);
  const [visible, setVisible] = useState(true);
  const timeouts = useRef([]);

  useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayPhone);
    } catch {
      return;
    }
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    setVisible(false);
    timeouts.current.push(setTimeout(() => { setLabel('Copied'); setVisible(true); }, 200));
    timeouts.current.push(setTimeout(() => { setVisible(false); }, 1200));
    timeouts.current.push(setTimeout(() => { setLabel(displayPhone); setVisible(true); }, 1400));
  };

  const isCopied = label === 'Copied';

  return (
    <span
      onClick={handleCopy}
      role="button"
      tabIndex={0}
      aria-label={`Copy ${displayPhone}`}
      className={
        isCopied
          ? 'float-right ml-3 cursor-pointer uppercase tracking-wider text-[10px] transition-opacity duration-200'
          : 'float-right ml-3 cursor-pointer tabular-nums text-[12px] transition-opacity duration-200'
      }
      style={{
        color: 'var(--color-text-secondary)',
        opacity: visible ? 1 : 0,
      }}
    >
      {label}
    </span>
  );
}

/**
 * Confirmation modal shown before opening an external website. Renders
 * an actual <a target="_blank"> on the confirm action — this is the most
 * reliable way to open external links from a PWA (programmatic window.open
 * can be blocked by some installed-PWA contexts).
 */
function ExternalLinkConfirm({ pending, onClose }) {
  useEffect(() => {
    if (!pending) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [pending, onClose]);

  if (!pending) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="border rounded-md p-4 max-w-sm w-full space-y-3"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-bg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
          Open External Site
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
          Open the {pending.name} website? You'll leave m-session and continue in your browser.
        </p>
        <p className="text-[11px] break-all" style={{ color: 'var(--color-text-tertiary)' }}>
          {pending.url}
        </p>
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 border rounded-md text-[11px] uppercase tracking-wider transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}
          >
            Cancel
          </button>
          <a
            href={pending.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="no-underline flex-1 px-3 py-2 border rounded-md text-center text-[11px] uppercase tracking-wider transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', textDecoration: 'none' }}
          >
            Open
          </a>
        </div>
      </div>
    </div>
  );
}

export default function EmergencyFlow({ emergencyContact, onAction, hideContactCard = false }) {
  const regionCode = useAppStore((s) => s.preferences?.region) || 'INTL';
  const setPreference = useAppStore((s) => s.setPreference);
  const region = REGIONS[regionCode] || REGIONS.INTL;
  const [pendingLink, setPendingLink] = useState(null);

  const reportAction = (label, actionType) => {
    if (typeof onAction === 'function') onAction(label, actionType);
  };

  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Region selector — borderless low-emphasis row */}
      <div
        className="flex items-center justify-between text-[10px] uppercase tracking-wider"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        <span>Region: {region.label}</span>
        <label className="relative cursor-pointer underline">
          Change
          <select
            value={region.code}
            onChange={(e) => setPreference('region', e.target.value)}
            aria-label="Change region"
            className="absolute inset-0 opacity-0 cursor-pointer"
          >
            {Object.values(REGIONS).map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Reassurance — agnostic, direct */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        If something feels serious right now, trust that. The options below are here for you. Pick whichever feels most useful.
      </p>

      {/* User's saved emergency contact (shared card). Hidden by callers
          that already display the contact card elsewhere on the page. */}
      {!hideContactCard && (
        <EmergencyContactCard
          emergencyContact={emergencyContact}
          onContactAction={reportAction}
        />
      )}

      {/* Emergency services — single full-width button, region-aware */}
      <div className="border rounded-md p-3 space-y-2" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
          Emergency Services
        </p>
        <a
          href={`tel:${region.emergencyNumber}`}
          onClick={() => reportAction(`Call ${region.emergencyNumber} (${region.label})`, `emergency-services-${region.code}`)}
          className="no-underline block px-3 py-2 border rounded-md text-center text-[11px] uppercase tracking-wider transition-colors"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', textDecoration: 'none' }}
        >
          {region.emergencyDisplay}
        </a>
      </div>

      {/* Peer support — one bordered box per entry */}
      {region.peerSupport.map((resource) => {
        const slug = slugify(resource.name);
        const hasSms = Boolean(resource.sms);
        return (
          <div
            key={slug}
            className="border rounded-md p-3 space-y-2"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              {resource.type}
            </p>
            <p className="text-[12px]" style={{ color: 'var(--color-text-primary)' }}>
              <CopyablePhone displayPhone={resource.displayPhone} />
              {resource.url ? (
                <span
                  onClick={() => {
                    setPendingLink({ name: resource.name, url: resource.url });
                    reportAction(`Open ${resource.name} website`, `peer-support-${region.code}-${slug}-website`);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${resource.name} website`}
                  className="cursor-pointer"
                >
                  {resource.name}
                  <svg
                    className="inline-block ml-1"
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      color: 'var(--color-text-tertiary)',
                      verticalAlign: 'middle',
                      transform: 'translateY(-2px)',
                      opacity: 0.5,
                    }}
                    aria-hidden="true"
                  >
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </span>
              ) : (
                resource.name
              )}
            </p>
            {resource.description && (
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {resource.description}
              </p>
            )}
            <div className="flex gap-2">
              <a
                href={`tel:${resource.phone}`}
                onClick={() => reportAction(`Call ${resource.name}`, `peer-support-${region.code}-${slug}-call`)}
                className="no-underline flex-1 px-3 py-2 border rounded-md text-center text-[11px] uppercase tracking-wider transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', textDecoration: 'none' }}
              >
                Call
              </a>
              {hasSms && (
                <a
                  href={`sms:${resource.sms}${resource.smsBody ? `?body=${encodeURIComponent(resource.smsBody)}` : ''}`}
                  onClick={() => reportAction(`Text ${resource.name}`, `peer-support-${region.code}-${slug}-text`)}
                  className="no-underline flex-1 px-3 py-2 border rounded-md text-center text-[11px] uppercase tracking-wider transition-colors"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', textDecoration: 'none' }}
                >
                  Text
                </a>
              )}
            </div>
          </div>
        );
      })}

      <ExternalLinkConfirm pending={pendingLink} onClose={() => setPendingLink(null)} />
    </div>
  );
}
