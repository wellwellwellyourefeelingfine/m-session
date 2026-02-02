/**
 * AlarmPrompt Component
 * Prompts users to set a native phone alarm before beginning an "away from screen" module.
 * All actions proceed into the module — the clock link is purely a convenience.
 */

import Modal from './Modal';
import Button from './Button';

function formatDuration(minutes) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
  }
  return `${minutes} minutes`;
}

function getClockAppUrl() {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  if (isIOS) return 'clock-timer://';
  return null;
}

export default function AlarmPrompt({
  isOpen,
  onProceed,
  durationMinutes,
  activityName = 'activity',
  hasBackgroundAudio = false,
}) {
  const clockUrl = getClockAppUrl();

  const handleOpenClock = () => {
    if (clockUrl) {
      window.location.href = clockUrl;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onProceed}>
      <div className="text-center space-y-6">
        <h2 className="font-serif text-xl text-[var(--text-primary)]">
          {hasBackgroundAudio ? 'Ready to begin?' : 'Set a phone alarm?'}
        </h2>

        {hasBackgroundAudio ? (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Your {activityName.toLowerCase()} is {formatDuration(durationMinutes)}.
            A gentle bell will sound when your time is up, even if your screen is off.
            You may still want to set a backup alarm, just in case.
          </p>
        ) : (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Your {activityName.toLowerCase()} is {formatDuration(durationMinutes)}.
            The app can't alert you when your screen is off.
          </p>
        )}

        <div className="space-y-3 pt-2">
          {clockUrl && (
            <Button
              variant="secondary"
              onClick={handleOpenClock}
              className="w-full"
            >
              Open Clock App
            </Button>
          )}

          <Button
            variant="primary"
            onClick={onProceed}
            className="w-full"
          >
            {hasBackgroundAudio
              ? 'Begin'
              : (clockUrl ? "I've Set My Alarm" : "Continue")}
          </Button>

          {clockUrl && (
            <Button
              variant="text"
              onClick={onProceed}
              className="w-full"
            >
              {hasBackgroundAudio ? 'Skip alarm' : 'No thanks'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
