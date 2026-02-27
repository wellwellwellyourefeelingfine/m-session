/**
 * useTranscriptModal Hook
 *
 * Encapsulates the transcript modal open/close state and fade animation
 * used by all TTS meditation modules. Eliminates ~14 lines of identical
 * boilerplate per module.
 *
 * Usage:
 *   const transcript = useTranscriptModal();
 *
 *   <TranscriptModal
 *     isOpen={transcript.showTranscript}
 *     closing={transcript.transcriptClosing}
 *     onClose={transcript.handleCloseTranscript}
 *     ...
 *   />
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { FADE_MS } from '../components/active/capabilities/TranscriptModal';

export function useTranscriptModal() {
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptClosing, setTranscriptClosing] = useState(false);
  const transcriptCloseTimerRef = useRef(null);

  const handleOpenTranscript = useCallback(() => {
    setShowTranscript(true);
  }, []);

  const handleCloseTranscript = useCallback(() => {
    setTranscriptClosing(true);
    if (transcriptCloseTimerRef.current) clearTimeout(transcriptCloseTimerRef.current);
    transcriptCloseTimerRef.current = setTimeout(() => {
      setShowTranscript(false);
      setTranscriptClosing(false);
    }, FADE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (transcriptCloseTimerRef.current) clearTimeout(transcriptCloseTimerRef.current);
    };
  }, []);

  return {
    showTranscript,
    transcriptClosing,
    handleOpenTranscript,
    handleCloseTranscript,
  };
}
