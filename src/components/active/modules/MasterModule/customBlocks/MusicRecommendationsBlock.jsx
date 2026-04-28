/**
 * MusicRecommendationsBlock — Mapping the Territory music picks.
 */

import { useEffect, useRef, useState } from 'react';
import {
  musicRecommendations,
  getInitialRecommendations,
} from '../../../../../content/modules/musicRecommendations';

const FADE_MS = 400;

const ListIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="5" y1="3" x2="14" y2="3" />
    <line x1="5" y1="8" x2="14" y2="8" />
    <line x1="5" y1="13" x2="14" y2="13" />
    <circle cx="2" cy="3" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="2" cy="8" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="2" cy="13" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 8a6 6 0 0 1 10.3-4.2M14 8a6 6 0 0 1-10.3 4.2" />
    <polyline points="2 3 2 6.5 5.5 6.5" />
    <polyline points="14 13 14 9.5 10.5 9.5" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="1" y1="1" x2="13" y2="13" />
    <line x1="13" y1="1" x2="1" y2="13" />
  </svg>
);

function AlbumDetailPopup({ album, onClose }) {
  if (!album) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg)] border border-[var(--color-border)] p-6 max-w-xs w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[var(--color-text-primary)] font-medium" style={{ textTransform: 'none' }}>
              {album.artist}
            </p>
            <p className="text-sm text-[var(--color-text-primary)] mt-0.5" style={{ textTransform: 'none' }}>
              {album.title}
            </p>
          </div>

          <p className="text-xs text-[var(--color-text-tertiary)] normal-case tracking-normal leading-relaxed">
            {album.description}
          </p>

          <div className="space-y-2 pt-1">
            {album.links?.spotify && (
              <a href={album.links.spotify} target="_blank" rel="noopener noreferrer" className="block w-full py-2.5 text-center text-xs uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-primary)] hover:opacity-70 transition-opacity">
                Open in Spotify
              </a>
            )}
            {album.links?.appleMusic && (
              <a href={album.links.appleMusic} target="_blank" rel="noopener noreferrer" className="block w-full py-2.5 text-center text-xs uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-primary)] hover:opacity-70 transition-opacity">
                Open in Apple Music
              </a>
            )}
            {album.links?.youtube && (
              <a href={album.links.youtube} target="_blank" rel="noopener noreferrer" className="block w-full py-2.5 text-center text-xs uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-primary)] hover:opacity-70 transition-opacity">
                Open on YouTube
              </a>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full pt-2 text-xs text-[var(--color-text-tertiary)] hover:opacity-70 transition-opacity"
            style={{ textTransform: 'none' }}
          >
            Thanks, I can find it myself
          </button>
        </div>
      </div>
    </div>
  );
}

function AllMusicModal({ isOpen, closing, onClose }) {
  const [entered, setEntered] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setEntered(false);
      setSelectedAlbum(null);
      return undefined;
    }

    document.body.style.overflow = 'hidden';
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-[var(--color-bg)] flex flex-col"
      style={{
        opacity: closing ? 0 : entered ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: closing ? 'none' : 'auto',
      }}
    >
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))',
          paddingBottom: '0.75rem',
        }}
      >
        <button
          onClick={onClose}
          className="text-[var(--color-text-secondary)] text-sm w-8 h-8 flex items-center justify-center"
          aria-label="Close recommendations"
        >
          <CloseIcon />
        </button>
        <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
          All Recommendations
        </span>
        <div className="w-8" />
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-6 pb-12 pt-2">
          <div className="space-y-1 max-w-sm mx-auto">
            {musicRecommendations.map((album, index) => (
              <button
                key={`${album.artist}-${album.title}-${index}`}
                onClick={() => setSelectedAlbum(album)}
                className={`w-full text-left pt-1.5 pb-0.5 ${index < musicRecommendations.length - 1 ? 'border-b border-[var(--color-border)]' : ''} hover:opacity-70 transition-opacity`}
              >
                <p className="text-sm text-[var(--color-text-primary)]" style={{ textTransform: 'none' }}>
                  {album.artist} - {album.title}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] -mt-0.5 normal-case tracking-normal leading-snug">
                  {album.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedAlbum && (
        <AlbumDetailPopup album={selectedAlbum} onClose={() => setSelectedAlbum(null)} />
      )}
    </div>
  );
}

export default function MusicRecommendationsBlock() {
  const [picks, setPicks] = useState(() => getInitialRecommendations());
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [showAllMusic, setShowAllMusic] = useState(false);
  const [allMusicClosing, setAllMusicClosing] = useState(false);
  const queueRef = useRef([]);
  const closeTimerRef = useRef(null);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  const refresh = () => {
    if (queueRef.current.length < 3) {
      const shuffled = [...musicRecommendations];
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      queueRef.current = shuffled;
    }
    setPicks(queueRef.current.splice(0, 3));
  };

  const closeAllMusic = () => {
    setAllMusicClosing(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setShowAllMusic(false);
      setAllMusicClosing(false);
    }, FADE_MS);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex items-center justify-center gap-4 mb-3">
        <span className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
          Recommendations
        </span>
        <button
          onClick={refresh}
          className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
          aria-label="Refresh recommendations"
        >
          <RefreshIcon />
        </button>
        <button
          onClick={() => setShowAllMusic(true)}
          className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
          aria-label="All recommendations"
        >
          <ListIcon />
        </button>
      </div>

      <div className="space-y-1">
        {picks.map((album, index) => (
          <button
            key={`${album.artist}-${album.title}-${index}`}
            onClick={() => setSelectedAlbum(album)}
            className={`w-full text-left pt-1.5 pb-0.5 ${index < picks.length - 1 ? 'border-b border-[var(--color-border)]' : ''} hover:opacity-70 transition-opacity`}
          >
            <p className="text-sm text-[var(--color-text-primary)]">
              {album.artist} - {album.title}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] -mt-0.5 normal-case tracking-normal leading-snug">
              {album.description}
            </p>
          </button>
        ))}
      </div>

      <AlbumDetailPopup album={selectedAlbum} onClose={() => setSelectedAlbum(null)} />
      <AllMusicModal isOpen={showAllMusic} closing={allMusicClosing} onClose={closeAllMusic} />
    </div>
  );
}
