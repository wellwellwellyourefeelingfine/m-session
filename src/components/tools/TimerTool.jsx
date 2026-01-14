/**
 * TimerTool Component
 * Minimalist countdown timer
 */

import { useState, useEffect, useRef } from 'react';
import { useToolsStore } from '../../stores/useToolsStore';

export default function TimerTool() {
  const {
    timerDuration,
    timerRemaining,
    timerActive,
    timerStartTime,
    startTimer,
    pauseTimer,
    resumeTimer,
    updateTimerRemaining,
    resetTimer,
  } = useToolsStore();

  const [inputValue, setInputValue] = useState('000000');
  const [isEditing, setIsEditing] = useState(false);
  const intervalRef = useRef(null);

  // Format 6 digits as HH:MM:SS
  const formatDisplay = (digits) => {
    const padded = digits.padStart(6, '0');
    return `${padded.substring(0, 2)}:${padded.substring(2, 4)}:${padded.substring(4, 6)}`;
  };

  // Format seconds as HH:MM:SS
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Parse 6 digits to seconds
  const parseTime = (digits) => {
    const hours = parseInt(digits.substring(0, 2));
    const minutes = parseInt(digits.substring(2, 4));
    const seconds = parseInt(digits.substring(4, 6));
    return hours * 3600 + minutes * 60 + seconds;
  };

  // Timer countdown
  useEffect(() => {
    if (timerActive) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
        const remaining = timerDuration - elapsed;
        updateTimerRemaining(remaining);
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerActive, timerStartTime, timerDuration, updateTimerRemaining]);

  const handleDisplayClick = () => {
    // Only allow editing when timer is in idle state (00:00:00)
    if (isIdle) {
      setIsEditing(true);
      setInputValue('000000');
    }
  };

  const handleInputChange = (e) => {
    const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setInputValue(digits.padEnd(6, '0'));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue('000000');
    }
  };

  const handleBegin = () => {
    const totalSeconds = parseTime(inputValue);
    if (totalSeconds > 0) {
      startTimer(totalSeconds);
      setIsEditing(false);
    }
  };

  const handlePause = () => {
    pauseTimer();
  };

  const handleResume = () => {
    resumeTimer();
  };

  const handleReset = () => {
    resetTimer();
    setInputValue('000000');
  };

  // Determine UI state
  const isPaused = !timerActive && timerRemaining > 0;
  const isIdle = !timerActive && timerRemaining === 0;
  const showBegin = isEditing && parseTime(inputValue) > 0;

  return (
    <div className="flex flex-col items-center pt-8 pb-4">
      {/* Timer Display - fixed height container */}
      <div className="h-[1.5rem] flex items-center justify-center w-full">
        {isEditing ? (
          <input
            type="text"
            value={formatDisplay(inputValue)}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            autoFocus
            className="text-lg font-mono text-center bg-transparent border-none focus:outline-none w-full leading-none tracking-wider"
          />
        ) : (
          <button
            onClick={handleDisplayClick}
            className={`text-lg font-mono leading-none tracking-wider ${
              isIdle ? 'hover:opacity-70 transition-opacity cursor-pointer' : 'cursor-default'
            }`}
          >
            {formatTime(timerRemaining)}
          </button>
        )}
      </div>

      {/* Controls - fixed height container */}
      <div className="mt-3 relative flex items-center justify-center h-[1rem]">
        {/* Begin button - shows when editing and time > 0 */}
        {showBegin && (
          <button
            onClick={handleBegin}
            className="text-[10px] uppercase tracking-wider text-app-black dark:text-app-white hover:opacity-70 transition-opacity animate-fade-in"
          >
            Begin
          </button>
        )}

        {/* Pause button - shows when timer is active */}
        {timerActive && (
          <button
            onClick={handlePause}
            className="text-[10px] uppercase tracking-wider text-app-black dark:text-app-white hover:opacity-70 transition-opacity animate-fade-in"
          >
            Pause
          </button>
        )}

        {/* Resume button - show when paused, anchored in center */}
        {isPaused && (
          <button
            onClick={handleResume}
            className="text-[10px] uppercase tracking-wider text-app-black dark:text-app-white hover:opacity-70 transition-opacity animate-fade-in"
          >
            Resume
          </button>
        )}

        {/* Reset button - absolute positioned to the right of Resume */}
        {isPaused && (
          <button
            onClick={handleReset}
            className="absolute left-[calc(50%+3rem)] text-[10px] uppercase tracking-wider text-app-black dark:text-app-white hover:opacity-70 transition-opacity animate-fade-in"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
