# Technical Spec: Newsletter Signup Popup (Tabled)

**Author:** Implementation review
**Status:** Designed, implemented, then tabled on 2026-05-21 — code reverted, spec preserved for future revival.
**Surfaces that would be affected (if revived):** `landing-page.html`, `about.html`, `faq.html`, `contribute.html`, `privacy.html`, `shared.css`, `shared.js`

---

## 1. Overview

A non-intrusive email-signup popup for the marketing site (`/`) that posts to a privacy-first third-party newsletter service. Never appears inside the PWA (`/app/`). Designed to harmonize with the site's "non-directive, undemanding, altered-state-aware" UX ethos rather than the typical aggressive newsletter modal.

The feature was fully implemented against Buttondown, then tabled before deployment. Everything below is preserved so the work can be resurrected without redoing the design exploration.

## 2. Why this was tabled

The decision to ship a newsletter was reversed before launch. No technical blocker — the implementation worked end to end against Buttondown's free tier. Revisit if/when:

- There's a clear editorial cadence in mind (who writes? what cadence? what's the first 3 issues?)
- The team is ready to commit to a privacy disclosure update and a third-party data relationship
- There's measurable demand (e.g. inbound requests for updates)

## 3. Decisions made (record of prior exploration)

| Decision           | Choice                                                                        | Rationale                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Email provider     | **Buttondown** (free tier ≤100 subs)                                          | Privacy-first, double opt-in by default, public embed endpoint (no API key in client). Best ethos fit.                   |
| Rejected: Mailgun  | Not suitable                                                                  | Transactional SMTP service, not a newsletter platform. No CORS-safe public endpoint — would require a serverless proxy.   |
| Rejected: Mailchimp / ConvertKit | Too heavy / tracking-flavored for this brand                  | Mismatched with the project's privacy posture.                                                                           |
| Trigger            | **Scroll past ~40% OR 25s dwell** — whichever first                            | Signals genuine engagement without aggressive immediate-popup pattern. Industry norm for thoughtful brands.              |
| Form shape         | **Single email field + clear copy** (no preference toggles)                    | Lowest friction. Considered: 3 toggles for App/Fundraising/Events — rejected for added friction with no clear payoff yet. |
| Position           | **Bottom-anchored card** (desktop), **bottom sheet** (mobile)                  | Calmer than centered modal with backdrop. Consistent with altered-state UX.                                              |
| Persistence        | `m-session-newsletter-dismissed-at` (ISO ts, 30-day snooze) + `m-session-newsletter-subscribed` (`"true"`, never shows again) | Matches existing localStorage naming convention (`m-session-*` kebab-case).                                              |

## 4. Architecture summary

- **No backend.** Form POSTs directly to `https://buttondown.com/api/emails/embed-subscribe/<USERNAME>` using `fetch` with `mode: 'no-cors'` and `FormData` (so no preflight, no CORS errors).
- **Optimistic success UI.** Because `no-cors` makes responses opaque, we show success on resolve. Buttondown's double opt-in handles real validation: invalid addresses simply never confirm.
- **Popup markup persists across PJAX navigation** by living outside `.page-transition-wrap` (which only contains `<main>` + `<footer>`). PJAX only swaps `main.innerHTML`, so the `<aside>` sibling is preserved.
- **Plausible analytics** follow the existing categorical pattern. The email address is never sent — only an anonymous count of completed submissions.
- **App scope is unaffected.** The markup only exists in the 5 root HTML files; the React PWA at `/app/` has no popup code path.

## 5. Files & exact code (paste-ready)

> All snippets use the literal placeholder `YOUR_BUTTONDOWN_USERNAME`. Replace with the actual Buttondown account username before deployment. The "Powered by Buttondown" attribution link is required by Buttondown's free tier.

### 5.1 Popup markup — identical in all 5 marketing HTML pages

Insert between `</footer>` and `<script src="/shared.js"></script>` on each of: `landing-page.html`, `about.html`, `faq.html`, `contribute.html`, `privacy.html`.

```html
<!-- ─── NEWSLETTER POPUP ─── -->
<aside
  class="newsletter-popup"
  id="newsletter-popup"
  role="dialog"
  aria-labelledby="newsletter-title"
  aria-hidden="true"
>
  <div class="newsletter-card">
    <button
      type="button"
      class="newsletter-close"
      id="newsletter-close"
      aria-label="Dismiss newsletter signup"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    <div class="newsletter-eyebrow">Stay in the loop</div>
    <h2 class="newsletter-title" id="newsletter-title">
      Occasional updates from m-session
    </h2>
    <p class="newsletter-body">
      ~1 email/month. New features, fundraising, and events. Unsubscribe
      anytime via the link in every email.
      <a href="/privacy#newsletter">How we handle your email</a>.
    </p>
    <form
      class="newsletter-form"
      id="newsletter-form"
      action="https://buttondown.com/api/emails/embed-subscribe/YOUR_BUTTONDOWN_USERNAME"
      method="post"
      target="popupwindow"
      novalidate
    >
      <input
        type="email"
        name="email"
        id="newsletter-email"
        required
        placeholder="you@example.com"
        autocomplete="email"
        aria-label="Email address"
      />
      <button type="submit" class="btn btn-primary newsletter-submit">
        Subscribe
      </button>
    </form>
    <div class="newsletter-success" id="newsletter-success" hidden>
      Check your inbox to confirm your subscription.
    </div>
    <div class="newsletter-error" id="newsletter-error" hidden>
      Something went wrong. Please try again, or email us directly.
    </div>
    <p class="newsletter-powered">
      <a
        href="https://buttondown.com/refer/YOUR_BUTTONDOWN_USERNAME"
        target="_blank"
        rel="noopener"
        >Powered by Buttondown</a
      >
    </p>
  </div>
</aside>
```

### 5.2 CSS — appended to `shared.css`

```css
/* ═══════════════════════════════════════════
   NEWSLETTER POPUP
   Bottom-anchored card on desktop, bottom sheet on mobile.
   ═══════════════════════════════════════════ */
.newsletter-popup {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%) translateY(140%);
  z-index: 140;
  width: calc(100vw - 32px);
  max-width: 460px;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    transform 0.55s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.4s ease,
    visibility 0s linear 0.55s;
}
.newsletter-popup.open {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition:
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.4s ease,
    visibility 0s linear;
}
.newsletter-popup.closing {
  transform: translateX(-50%) translateY(140%);
  opacity: 0;
  transition:
    transform 0.4s cubic-bezier(0.4, 0, 0.6, 1),
    opacity 0.3s ease;
}

.newsletter-card {
  position: relative;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 28px 28px 24px;
  box-shadow: 0 14px 48px rgba(0, 0, 0, 0.45);
}
html.light .newsletter-card {
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.12);
}

.newsletter-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.newsletter-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.newsletter-close:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.newsletter-eyebrow {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 10px;
}
.newsletter-title {
  font-family: var(--serif);
  font-size: 22px;
  line-height: 1.25;
  color: var(--text-primary);
  margin: 0 0 10px;
  font-weight: 400;
  padding-right: 24px;
}
.newsletter-body {
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0 0 18px;
}
.newsletter-body a {
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid var(--border-accent);
}
.newsletter-body a:hover {
  border-bottom-color: var(--accent);
}

.newsletter-form {
  display: flex;
  gap: 8px;
  align-items: stretch;
}
.newsletter-form input[type="email"] {
  flex: 1;
  min-width: 0;
  padding: 12px 14px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: var(--mono);
  font-size: 13px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.newsletter-form input[type="email"]::placeholder {
  color: var(--text-tertiary);
}
.newsletter-form input[type="email"]:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim);
}
.newsletter-form input[type="email"]:invalid:not(:placeholder-shown) {
  border-color: var(--warm);
}
.newsletter-submit {
  padding: 12px 20px;
  font-size: 10px;
  white-space: nowrap;
  border-radius: 6px;
}

.newsletter-success,
.newsletter-error {
  margin-top: 14px;
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.5;
  padding: 10px 12px;
  border-radius: 6px;
}
.newsletter-success {
  color: var(--accent);
  background: var(--accent-dim);
  border: 1px solid var(--border-accent);
}
.newsletter-error {
  color: var(--warm);
  background: rgba(232, 168, 124, 0.08);
  border: 1px solid rgba(232, 168, 124, 0.2);
}

.newsletter-powered {
  margin: 14px 0 0;
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  text-align: right;
}
.newsletter-powered a {
  color: inherit;
  text-decoration: none;
  border-bottom: 1px dotted var(--text-tertiary);
}
.newsletter-powered a:hover {
  color: var(--text-secondary);
  border-bottom-color: var(--text-secondary);
}

/* Mobile bottom sheet */
@media (max-width: 600px) {
  .newsletter-popup {
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: none;
    transform: translateY(100%);
  }
  .newsletter-popup.open {
    transform: translateY(0);
  }
  .newsletter-popup.closing {
    transform: translateY(100%);
  }
  .newsletter-card {
    border-radius: 16px 16px 0 0;
    padding: 24px 20px calc(24px + env(safe-area-inset-bottom));
  }
  .newsletter-form {
    flex-direction: column;
  }
  .newsletter-submit {
    width: 100%;
    justify-content: center;
  }
}

/* Respect reduced-motion preferences */
@media (prefers-reduced-motion: reduce) {
  .newsletter-popup,
  .newsletter-popup.open,
  .newsletter-popup.closing {
    transition: opacity 0.2s ease, visibility 0s linear;
  }
}
```

### 5.3 JavaScript — appended to `shared.js`

```js
// Newsletter popup — bottom-anchored signup, fires once per browser on
// scroll-past-40% OR 25s dwell. Snoozes 30 days on dismiss, never shows once
// subscribed. Posts to Buttondown via no-cors fetch.
(function () {
  var popup = document.getElementById('newsletter-popup');
  if (!popup) return;

  var DISMISS_KEY = 'm-session-newsletter-dismissed-at';
  var SUBSCRIBED_KEY = 'm-session-newsletter-subscribed';
  var SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;
  var DWELL_MS = 25000;
  var SCROLL_PCT = 0.4;

  var card = popup.querySelector('.newsletter-card');
  var closeBtn = popup.querySelector('#newsletter-close');
  var form = popup.querySelector('#newsletter-form');
  var emailInput = popup.querySelector('#newsletter-email');
  var successEl = popup.querySelector('#newsletter-success');
  var errorEl = popup.querySelector('#newsletter-error');

  var isOpen = false;
  var firedThisSession = false;
  var dwellTimer = null;
  var scrollListener = null;

  function track(event, props) {
    if (window.plausible) {
      if (props) window.plausible(event, { props: props });
      else window.plausible(event);
    }
  }

  function shouldShow() {
    try {
      if (localStorage.getItem(SUBSCRIBED_KEY) === 'true') return false;
      var dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        var ts = new Date(dismissedAt).getTime();
        if (!isNaN(ts) && Date.now() - ts < SNOOZE_MS) return false;
      }
    } catch (e) {
      // localStorage blocked — fall through and show
    }
    return true;
  }

  function openPopup() {
    if (isOpen) return;
    // Defer if menu is open — avoid stacked overlays
    if (document.body.classList.contains('menu-open')) return;
    isOpen = true;
    popup.classList.remove('closing');
    popup.classList.add('open');
    popup.setAttribute('aria-hidden', 'false');
    document.body.classList.add('newsletter-open');
    track('newsletter-shown');
  }

  function closePopup(reason) {
    if (!isOpen) return;
    isOpen = false;
    // Move focus out of popup before aria-hidden is set
    if (document.activeElement && popup.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    popup.classList.remove('open');
    popup.classList.add('closing');
    popup.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('newsletter-open');
    setTimeout(function () { popup.classList.remove('closing'); }, 450);
    try {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    } catch (e) { /* localStorage blocked */ }
    track('newsletter-dismissed', { reason: reason || 'unknown' });
    teardownTriggers();
  }

  function fireOnce() {
    if (firedThisSession) return;
    firedThisSession = true;
    teardownTriggers();
    openPopup();
  }

  function onScroll() {
    var docHeight = document.documentElement.scrollHeight;
    var viewportBottom = window.scrollY + window.innerHeight;
    if (docHeight <= window.innerHeight) return; // page too short to scroll
    if (viewportBottom / docHeight >= SCROLL_PCT) fireOnce();
  }

  function setupTriggers() {
    teardownTriggers();
    if (firedThisSession || !shouldShow()) return;
    dwellTimer = setTimeout(fireOnce, DWELL_MS);
    scrollListener = onScroll;
    window.addEventListener('scroll', scrollListener, { passive: true });
  }

  function teardownTriggers() {
    if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
    if (scrollListener) {
      window.removeEventListener('scroll', scrollListener);
      scrollListener = null;
    }
  }

  // Close handlers
  if (closeBtn) {
    closeBtn.addEventListener('click', function () { closePopup('close-button'); });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!isOpen) return;
    // Yield to menu if it's open
    if (document.body.classList.contains('menu-open')) return;
    closePopup('esc');
  });
  popup.addEventListener('click', function (e) {
    // Click outside the card (on the popup itself) dismisses.
    if (e.target === popup) closePopup('outside-click');
  });

  // Submit handler — Buttondown embed-subscribe endpoint
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = emailInput && emailInput.value.trim();
      if (!email) return;
      if (emailInput && !emailInput.checkValidity()) {
        emailInput.reportValidity();
        return;
      }

      var fd = new FormData();
      fd.append('email', email);
      fd.append('embed', '1');

      // no-cors means we can't read the response, but the request still
      // reaches Buttondown. Buttondown's double opt-in handles the rest.
      fetch(form.action, { method: 'POST', mode: 'no-cors', body: fd })
        .then(function () {
          showSuccess();
        })
        .catch(function () {
          // Network failure — show error and keep popup open
          if (errorEl) errorEl.hidden = false;
        });
    });
  }

  function showSuccess() {
    if (form) form.hidden = true;
    if (errorEl) errorEl.hidden = true;
    if (successEl) successEl.hidden = false;
    try { localStorage.setItem(SUBSCRIBED_KEY, 'true'); } catch (e) { /* ignore */ }
    track('newsletter-subscribed');
    // Auto-close after a few seconds so the user can keep reading
    setTimeout(function () {
      if (isOpen) {
        isOpen = false;
        popup.classList.remove('open');
        popup.classList.add('closing');
        popup.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('newsletter-open');
        setTimeout(function () { popup.classList.remove('closing'); }, 450);
      }
    }, 4000);
  }

  // Public hook so PJAX can re-arm triggers after navigation, and so a
  // future footer link can open the popup manually.
  __ms.initNewsletter = setupTriggers;
  __ms.openNewsletter = function () {
    firedThisSession = false;
    openPopup();
  };

  // Initial arm
  setupTriggers();
})();
```

**Also required:** inside the existing PJAX `navigate()` function in `shared.js`, after the other reinit calls (`__ms.initScrollReveal()`, `__ms.initFaqAccordion()`, `__ms.updateMenuActive()`), add:

```js
if (__ms.initNewsletter) __ms.initNewsletter();
```

### 5.4 Privacy policy additions — `privacy.html`

**A. Add to the categorical Plausible event list** (inside the existing `<ul>` after `<li><strong>emergency-support</strong> …</li>`):

```html
<li><strong>newsletter-shown</strong> &mdash; When the newsletter signup popup is shown on the marketing site (not in the app)</li>
<li><strong>newsletter-dismissed</strong> &mdash; When the newsletter popup is dismissed; includes the dismissal method (close button, Escape, or outside click)</li>
<li><strong>newsletter-subscribed</strong> &mdash; When the newsletter form is submitted. The email address is never sent to Plausible &mdash; only an anonymous count of completed submissions.</li>
```

**B. Add Buttondown to the Third-party services `<ul>`** (after the Tally entry):

```html
<li>
  <strong>Buttondown</strong> &mdash; Powers our optional email newsletter. Buttondown is an independent, privacy-first newsletter service &mdash; no ad networks, no third-party trackers, double opt-in by default. If you choose to subscribe, your email address is stored on Buttondown&rsquo;s servers. This is entirely optional and external to the app. See <a href="https://buttondown.com/legal/privacy" target="_blank" rel="noopener">Buttondown&rsquo;s privacy policy</a>. Details below under <a href="#newsletter">Newsletter</a>.
</li>
```

**C. Insert a new `<section id="newsletter">`** immediately after the Third-party services section closes:

```html
<!-- Newsletter -->
<section id="newsletter">
  <div class="container">
    <div class="prose rv">
      <h2>Newsletter (optional)</h2>
      <p>
        m-session offers an optional email newsletter for occasional updates &mdash; new features, fundraising, and events. Subscribing is entirely optional and unrelated to anything you do inside the app.
      </p>
      <p>
        If you sign up, your email address is stored by <strong>Buttondown</strong> (<a href="https://buttondown.com/legal/privacy" target="_blank" rel="noopener">buttondown.com/legal/privacy</a>), an independent privacy-first newsletter service. We do not store your email anywhere else, and we do not share or sell it.
      </p>
      <ul>
        <li><strong>Double opt-in</strong> &mdash; You will receive a confirmation email and must click the link inside to be added. If you never click, you will never be added.</li>
        <li><strong>One-click unsubscribe</strong> &mdash; Every email includes an unsubscribe link, and unsubscribing removes you from the list immediately.</li>
        <li><strong>No session linkage</strong> &mdash; Your subscription is not linked to any session data. There is no session data on our servers to link it to.</li>
        <li><strong>No tracking pixels in emails</strong> beyond Buttondown&rsquo;s defaults, which we keep minimal.</li>
      </ul>
      <p>
        The signup popup appears at most once per browser on the marketing site, snoozes for 30 days if you dismiss it, and never appears again once you have subscribed. It never appears inside the app itself.
      </p>
    </div>
  </div>
</section>
```

## 6. Behavior contract (what good looks like)

1. **Time trigger:** load `/`, wait 25s without scrolling → popup slides up from bottom. Plausible `newsletter-shown` fires.
2. **Scroll trigger:** scroll past 40% of doc height within 25s → popup appears, scroll listener detaches.
3. **Once per browser:** dismiss the popup, reload → popup stays hidden for 30 days (verify `m-session-newsletter-dismissed-at` in localStorage).
4. **Dismiss paths:** X button, Escape (only when menu is closed), click outside the card. Each fires `newsletter-dismissed` with categorical `reason` prop.
5. **Submit happy path:** valid email → success banner shows, `m-session-newsletter-subscribed=true`, popup auto-closes after 4s, Buttondown confirmation email arrives.
6. **Submit invalid:** HTML5 validation message, no POST.
7. **Light/dark theme:** popup uses CSS vars — both themes work automatically.
8. **Mobile (≤600px):** popup is a full-width bottom sheet with safe-area-inset padding.
9. **PJAX nav:** popup persists across in-page navigation; triggers re-arm on each new page.
10. **Menu interaction:** opening menu while popup is visible doesn't break either; Escape yields to menu when both could respond.
11. **`/app/`:** popup never appears inside the React PWA.
12. **Privacy link:** "How we handle your email" lands on `/privacy#newsletter`.

## 7. Open considerations / what to revisit on revival

- **Preference toggles** (App updates / Fundraising / Events) were considered and rejected. If the cadence ever justifies it, Buttondown supports tags natively — the markup would gain three `<label><input type="checkbox" name="tag">…</label>` rows and the JS would `fd.append('tag', ...)` for each selected.
- **Manual trigger** — a "Get updates" link in the footer could call `__ms.openNewsletter()` directly. Useful once the popup is proven.
- **Standalone `/subscribe` page** — for direct linking from social posts.
- **Buttondown account hygiene** — when reviving, confirm in Buttondown settings:
  - Double opt-in is ON (default).
  - The embed-subscribe endpoint is enabled (Settings → Subscriber forms). If disabled, the POST silently no-ops and the user sees "success" without being added.
  - The "From name" / newsletter name is set to `m-session` (not the account slug).
- **In-app subscription tile** — could be added later as an opt-in entry in the PWA's Tools or Settings.
- **Buttondown free-tier cap** is 100 subscribers. Past that, the cheapest paid tier or migration to EmailOctopus (2,500 free) would be worth re-evaluating.
- **Free-tier attribution:** the "Powered by Buttondown" link with `?refer/<USERNAME>` referral slug is required as long as the account is on the free tier. Removing it requires a paid plan.

## 8. Resurrection checklist

1. Create / log into a Buttondown account; note the username slug.
2. Confirm double opt-in is enabled (Settings → Basics).
3. Confirm embed forms are enabled (Settings → Subscriber forms).
4. Set the newsletter "From name" / display name to `m-session`.
5. Paste §5.1 markup into all 5 marketing HTML files between `</footer>` and `<script src="/shared.js"></script>`.
6. Replace both occurrences of `YOUR_BUTTONDOWN_USERNAME` per file with the real slug (form `action` URL and refer link).
7. Append §5.2 CSS to `shared.css`.
8. Append §5.3 JS to `shared.js`, plus the one-line PJAX reinit hook.
9. Apply the three privacy.html edits from §5.4.
10. Run through the §6 behavior contract end-to-end.
