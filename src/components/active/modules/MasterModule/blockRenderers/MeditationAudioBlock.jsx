/**
 * MeditationAudioBlock — Paused indicator + fading prompt text
 *
 * Used internally by MeditationSection for the audio playback visual content.
 * Does NOT control the control bar — that stays at the section level.
 */

export default function MeditationAudioBlock({ isPlaying, promptPhase, currentPromptText }) {
  return (
    <>
      {/* Paused indicator */}
      <div className="h-5 flex items-center justify-center mt-3">
        {!isPlaying && (
          <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider animate-pulse">
            Paused
          </p>
        )}
      </div>

      {/* Prompt text — fades based on promptPhase */}
      <p
        className={`mt-1 px-4 text-[var(--color-text-secondary)] text-sm leading-relaxed
          transition-opacity duration-300 ${
          promptPhase === 'visible' || promptPhase === 'fading-in' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {currentPromptText || ''}
      </p>
    </>
  );
}
