import { memo, useRef, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';

export default memo(function AnimatedTextLogo() {
  const darkMode = useAppStore((state) => state.darkMode);
  const barRef = useRef(null);

  useEffect(() => {
    let prevTrigger = useAppStore.getState().logoAnimationTrigger;
    const unsub = useAppStore.subscribe((state) => {
      if (state.logoAnimationTrigger !== prevTrigger) {
        prevTrigger = state.logoAnimationTrigger;
        const el = barRef.current;
        if (!el || useAppStore.getState().preferences?.reduceMotion) return;
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = 'hyphen-flip 1.1s var(--ease-default)';
      }
    });
    return unsub;
  }, []);

  const hyphenColor = darkMode ? 'var(--accent)' : 'var(--text-primary)';

  return (
    <span
      style={{
        fontFamily: "'DM Serif Text', serif",
        fontWeight: 600,
        fontSize: '22px',
        letterSpacing: '0.04em',
        textTransform: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        color: 'var(--text-primary)',
        lineHeight: 1,
      }}
    >
      <span>m</span>
      <span
        style={{
          display: 'inline-block',
          position: 'relative',
          width: '1ch',
          height: '1em',
          letterSpacing: 0,
          marginLeft: '-0.05em',
        }}
      >
        <span
          ref={barRef}
          style={{
            position: 'absolute',
            left: '48%',
            top: '60%',
            transform: 'translate(-50%, -50%)',
            width: '0.30em',
            height: '0.12em',
            backgroundColor: hyphenColor,
            borderRadius: '0.5px',
            transformOrigin: 'center',
          }}
        />
      </span>
      <span>session</span>
    </span>
  );
})
