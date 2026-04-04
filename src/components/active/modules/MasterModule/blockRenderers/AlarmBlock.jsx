/**
 * AlarmBlock — Prompt to set native alarm
 *
 * Displays a prompt for users to set a phone alarm before an away-from-screen activity.
 * Uses the shared AlarmPrompt component inline rather than as a modal.
 */

function getClockAppUrl() {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);

  if (isIOS) return 'clock-timer://';
  if (isAndroid) return 'intent:#Intent;action=android.intent.action.SHOW_TIMERS;end';
  return null;
}

export default function AlarmBlock({ screen }) {
  const clockUrl = getClockAppUrl();
  const activityName = screen.activityName || 'your activity';

  const handleOpenClock = () => {
    if (!clockUrl) return;
    const a = document.createElement('a');
    a.href = clockUrl;
    a.click();
  };

  return (
    <div className="text-center space-y-6">
      <p
        className="text-lg text-[var(--color-text-primary)]"
        style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
      >
        Set a phone alarm?
      </p>

      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
        If you will be away from your screen during {activityName.toLowerCase()},
        consider setting an alarm so you know when time is up.
      </p>

      {clockUrl && (
        <button
          onClick={handleOpenClock}
          className="w-full py-3 border border-[var(--color-border)] text-xs uppercase tracking-wider
            text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
        >
          Open Clock App
        </button>
      )}
    </div>
  );
}
