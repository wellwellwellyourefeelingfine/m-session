/**
 * GenerateSection — PNG generation with RevealOverlay orchestration
 *
 * Renders a generate button screen, coordinates:
 * 1. Button click → RevealOverlay starts (at MasterModule root)
 * 2. Generator function called → produces PNG blob
 * 3. After ~1800ms (overlay solidly opaque) → ImageViewerModal opens (at MasterModule root)
 * 4. RevealOverlay fades out → viewer visible
 * 5. Viewer "Done" → advance to next section seamlessly
 *
 * The RevealOverlay and ImageViewerModal are rendered at MasterModule.jsx level
 * so they persist across section transitions. This component only coordinates timing.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getGenerator } from '../generators/registry';
import { useJournalStore } from '../../../../../stores/useJournalStore';
import { useSessionStore } from '../../../../../stores/useSessionStore';
import { saveImage } from '../../../../../utils/imageStorage';
import ModuleLayout from '../../../capabilities/ModuleLayout';
import ModuleControlBar from '../../../capabilities/ModuleControlBar';
import renderContentLines from '../utils/renderContentLines';

export default function GenerateSection({
  section,
  accentTerms,
  // Data from useMasterModuleState
  responses,
  selectorValues,
  selectorJournals,
  choiceValues,
  // Generated image actions (lifted to MasterModule level)
  onSetGeneratedImage,
  onStartRevealOverlay,
  onOpenViewer,
  // Navigation
  onSectionComplete,
  onSkip,
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const advanceTimerRef = useRef(null);

  const addEntry = useJournalStore((state) => state.addEntry);
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;

    const generator = getGenerator(section.generatorId);
    if (!generator) {
      console.warn(`Generator "${section.generatorId}" not found`);
      onSectionComplete();
      return;
    }

    setIsGenerating(true);

    // Start the reveal overlay (mounted at MasterModule root)
    onStartRevealOverlay();

    const startTime = Date.now();

    try {
      // Call the generator with collected data
      const result = await generator({
        responses,
        selectorValues,
        selectorJournals,
        choiceValues,
      });

      // Save to journal if configured
      let journalEntryId = null;
      if (section.saveToJournal) {
        const entry = addEntry({
          content: `${section.journalTitle || section.buttonLabel || 'GENERATED IMAGE'}\n\nImage generated.`,
          source: 'session',
          sessionId,
          moduleTitle: section.journalTitle || 'Generated Image',
          hasImage: true,
        });

        if (entry?.id && result.blob) {
          try {
            await saveImage(entry.id, result.blob);
          } catch (err) {
            console.warn('Failed to save generated image:', err);
          }
          journalEntryId = entry.id;
        }
      }

      // Store the generated image
      onSetGeneratedImage(section.generatorId, {
        blob: result.blob,
        url: result.url,
        journalEntryId,
      });

      // Wait until overlay is solidly opaque (~1800ms from start)
      // before opening the viewer behind it
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 1800 - elapsed);

      advanceTimerRef.current = setTimeout(() => {
        onOpenViewer(section.generatorId);
      }, delay);
    } catch (err) {
      console.warn('Image generation failed:', err);
      setIsGenerating(false);
      // Dismiss overlay on error — will be handled by MasterModule
    }
  }, [
    isGenerating, section, responses, selectorValues, selectorJournals, choiceValues,
    onStartRevealOverlay, onSetGeneratedImage, onOpenViewer, onSectionComplete,
    addEntry, sessionId,
  ]);

  return (
    <>
      <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
        <div className="text-center animate-fadeIn">
          {/* Optional preview text */}
          {section.previewLines && section.previewLines.length > 0 && (
            <div className="mb-8">
              {renderContentLines(section.previewLines, accentTerms)}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)]
              text-xs uppercase tracking-wider transition-all active:scale-[0.98]
              ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isGenerating ? 'Generating...' : section.buttonLabel || 'Generate'}
          </button>
        </div>
      </ModuleLayout>

      <ModuleControlBar
        phase="active"
        primary={{ label: section.buttonLabel || 'Generate', onClick: handleGenerate, disabled: isGenerating }}
        showSkip={true}
        onSkip={onSkip}
        skipConfirmMessage="Skip this activity?"
      />
    </>
  );
}
