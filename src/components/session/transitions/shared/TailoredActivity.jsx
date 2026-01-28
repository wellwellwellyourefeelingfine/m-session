/**
 * TailoredActivity Component
 * Renders the appropriate integration activity based on the user's focus
 * Each activity type has its own layout and input structure
 */

import { useState } from 'react';
import { getActivityForFocus } from '../content/tailoredActivities';
import TransitionTextarea from './TransitionTextarea';

export default function TailoredActivity({
  focus,
  response = {},
  onChange,
}) {
  const [showPrompts, setShowPrompts] = useState(false);
  const activity = getActivityForFocus(focus);

  const updateResponse = (field, value) => {
    onChange({ ...response, [field]: value });
  };

  // Render based on activity type
  switch (activity.id) {
    case 'letter':
      return (
        <LetterActivity
          activity={activity}
          response={response}
          updateResponse={updateResponse}
          showPrompts={showPrompts}
          setShowPrompts={setShowPrompts}
        />
      );

    case 'dialogue':
      return (
        <DialogueActivity
          activity={activity}
          response={response}
          updateResponse={updateResponse}
        />
      );

    case 'release-keep':
      return (
        <ReleaseKeepActivity
          activity={activity}
          response={response}
          updateResponse={updateResponse}
        />
      );

    case 'reclaiming':
      return (
        <ReclaimingActivity
          activity={activity}
          response={response}
          updateResponse={updateResponse}
        />
      );

    case 'vision-meaning':
      return (
        <VisionMeaningActivity
          activity={activity}
          response={response}
          updateResponse={updateResponse}
        />
      );

    case 'open-reflection':
    default:
      return (
        <OpenReflectionActivity
          activity={activity}
          response={response}
          updateResponse={updateResponse}
        />
      );
  }
}

// Letter Writing Activity (relationship focus)
function LetterActivity({ activity, response, updateResponse, showPrompts, setShowPrompts }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
          {activity.title}
        </h2>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
          {activity.instructions}
        </p>
        <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed">
          {activity.instructionsSecondary}
        </p>
      </div>

      {/* Salutation */}
      <div>
        <input
          type="text"
          value={response.salutation || ''}
          onChange={(e) => updateResponse('salutation', e.target.value)}
          placeholder={activity.salutationPlaceholder}
          className="w-full py-2 px-0 border-0 border-b border-[var(--color-border)] bg-transparent
                     focus:outline-none focus:border-[var(--accent)]
                     text-[var(--color-text-primary)]
                     placeholder:text-[var(--color-text-tertiary)]"
        />
      </div>

      {/* Main textarea */}
      <TransitionTextarea
        value={response.content || ''}
        onChange={(value) => updateResponse('content', value)}
        placeholder={activity.mainPlaceholder}
        large
      />

      {/* Prompt hints (collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setShowPrompts(!showPrompts)}
          className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider hover:text-[var(--color-text-secondary)]"
        >
          {showPrompts ? '− Hide prompts' : '+ Some places to start, if helpful'}
        </button>
        {showPrompts && (
          <ul className="mt-3 space-y-2 text-[var(--color-text-tertiary)] text-sm italic">
            {activity.prompts.map((prompt, i) => (
              <li key={i}>{prompt}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Dialogue Activity (self-understanding focus)
function DialogueActivity({ activity, response, updateResponse }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
          {activity.title}
        </h2>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
          {activity.instructions}
        </p>
        <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed">
          {activity.instructionsSecondary}
        </p>
      </div>

      {/* Voice 1 - The part that asks */}
      <div className="space-y-2">
        <p className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider">
          {activity.voice1Label}
        </p>
        <TransitionTextarea
          value={response.voice1 || ''}
          onChange={(value) => updateResponse('voice1', value)}
          placeholder={activity.voice1Placeholder}
        />
      </div>

      {/* Voice 2 - The part that knows */}
      <div className="space-y-2">
        <p className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider">
          {activity.voice2Label}
        </p>
        <TransitionTextarea
          value={response.voice2 || ''}
          onChange={(value) => updateResponse('voice2', value)}
          placeholder={activity.voice2Placeholder}
        />
      </div>

      {/* Closing reflection */}
      <div className="space-y-2 pt-4 border-t border-[var(--color-border)]">
        <p className="text-[var(--color-text-secondary)] text-sm">
          {activity.closingPrompt}
        </p>
        <TransitionTextarea
          value={response.closing || ''}
          onChange={(value) => updateResponse('closing', value)}
          placeholder={activity.closingPlaceholder}
          small
        />
      </div>
    </div>
  );
}

// Release & Keep Activity (processing/healing focus)
function ReleaseKeepActivity({ activity, response, updateResponse }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
          {activity.title}
        </h2>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
          {activity.instructions}
        </p>
        <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed">
          {activity.instructionsSecondary}
        </p>
      </div>

      {/* Release section */}
      <div className="space-y-2">
        <h3 className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider">
          {activity.releaseTitle}
        </h3>
        <p className="text-[var(--color-text-tertiary)] text-xs">
          {activity.releaseDescription}
        </p>
        <TransitionTextarea
          value={response.release || ''}
          onChange={(value) => updateResponse('release', value)}
          placeholder={activity.releasePlaceholder}
        />
      </div>

      {/* Keep section */}
      <div className="space-y-2">
        <h3 className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider">
          {activity.keepTitle}
        </h3>
        <p className="text-[var(--color-text-tertiary)] text-xs">
          {activity.keepDescription}
        </p>
        <TransitionTextarea
          value={response.keep || ''}
          onChange={(value) => updateResponse('keep', value)}
          placeholder={activity.keepPlaceholder}
        />
      </div>

      {/* Closing reflection */}
      <div className="space-y-2 pt-4 border-t border-[var(--color-border)]">
        <p className="text-[var(--color-text-secondary)] text-sm">
          {activity.closingPrompt}
        </p>
        <TransitionTextarea
          value={response.closing || ''}
          onChange={(value) => updateResponse('closing', value)}
          placeholder={activity.closingPlaceholder}
          small
        />
      </div>
    </div>
  );
}

// Reclaiming Activity (reconnecting focus)
function ReclaimingActivity({ activity, response, updateResponse }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
          {activity.title}
        </h2>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
          {activity.instructions}
        </p>
        <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed">
          {activity.instructionsSecondary}
        </p>
      </div>

      {activity.prompts.map((prompt, i) => (
        <div key={i} className="space-y-2">
          <p className="text-[var(--color-text-secondary)] text-sm">
            {prompt.question}
          </p>
          <TransitionTextarea
            value={response[`prompt${i}`] || ''}
            onChange={(value) => updateResponse(`prompt${i}`, value)}
            placeholder={prompt.placeholder}
          />
        </div>
      ))}
    </div>
  );
}

// Vision & Meaning Activity (creativity focus)
function VisionMeaningActivity({ activity, response, updateResponse }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
          {activity.title}
        </h2>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
          {activity.instructions}
        </p>
        <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed">
          {activity.instructionsSecondary}
        </p>
      </div>

      {activity.sections.map((section, i) => (
        <div key={i} className="space-y-2">
          <h3 className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider">
            {section.title}
          </h3>
          <p className="text-[var(--color-text-tertiary)] text-xs">
            {section.question}
          </p>
          <TransitionTextarea
            value={response[`section${i}`] || ''}
            onChange={(value) => updateResponse(`section${i}`, value)}
            placeholder={section.placeholder}
            large={section.large}
            small={section.small}
          />
        </div>
      ))}
    </div>
  );
}

// Open Reflection Activity (open focus)
function OpenReflectionActivity({ activity, response, updateResponse }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
          {activity.title}
        </h2>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
          {activity.instructions}
        </p>
        <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed">
          {activity.instructionsSecondary}
        </p>
      </div>

      {activity.prompts.map((prompt, i) => (
        <div key={i} className="space-y-2">
          <p className="text-[var(--color-text-secondary)] text-sm">
            {prompt.question}
          </p>
          <TransitionTextarea
            value={response[`prompt${i}`] || ''}
            onChange={(value) => updateResponse(`prompt${i}`, value)}
            placeholder={prompt.placeholder}
          />
        </div>
      ))}
    </div>
  );
}
