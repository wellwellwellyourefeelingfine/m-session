/**
 * BreathOrb Component
 *
 * A meditative breathing animation featuring:
 * - Radial gradient orb that expands/contracts with breath
 * - Orbital ring with moon dot that tracks breath progress
 * - Centered text showing current phase and countdown
 *
 * Visual Design:
 * - Orb: Accent color gradient (solid center → transparent edge)
 * - Ring: Subtle solid line with markers at top (0°) and bottom (180°)
 * - Moon: Solid accent dot that orbits clockwise
 * - Text: Phase name + countdown timer
 *
 * Movement Pattern (clockwise from bottom):
 * - Inhale: 180° → 360° (bottom → top via left)
 * - Hold: stays at 360°/0° (top)
 * - Exhale: 0° → 180° (top → bottom via right)
 * - Hold after exhale: stays at 180° (bottom)
 */

import { useMemo } from 'react';

/**
 * @param {Object} props
 * @param {string} props.phase - Current breath phase: 'inhale' | 'hold' | 'exhale' | 'holdAfterExhale'
 * @param {number} props.phaseProgress - Progress through current phase (0-1)
 * @param {number} props.phaseDuration - Duration of current phase in seconds
 * @param {number} props.phaseSecondsRemaining - Seconds remaining in current phase
 * @param {number} props.moonAngle - Current moon position in degrees (0-360)
 * @param {boolean} props.isActive - Whether the animation is actively running
 * @param {boolean} props.isIdle - Whether in idle state (gentle pulse animation)
 * @param {string} props.size - Size variant: 'small' | 'medium' | 'large'
 */
export default function BreathOrb({
  phase = 'inhale',
  phaseProgress = 0,
  phaseDuration = 4,
  phaseSecondsRemaining = 4,
  moonAngle = 180,
  isActive = false,
  isIdle = false,
  size = 'medium',
}) {
  // Size configurations
  const sizeConfig = useMemo(() => {
    switch (size) {
      case 'small':
        return {
          containerSize: 200,
          orbBaseSize: 100,
          orbExpandedSize: 140,
          ringRadius: 85,
          moonSize: 8,
          markerSize: 6,
          textSize: 'text-[10px]',
          countdownSize: 'text-xs',
        };
      case 'large':
        return {
          containerSize: 320,
          orbBaseSize: 180,
          orbExpandedSize: 260,
          ringRadius: 145,
          moonSize: 12,
          markerSize: 10,
          textSize: 'text-sm',
          countdownSize: 'text-base',
        };
      default: // medium
        return {
          containerSize: 280,
          orbBaseSize: 150,
          orbExpandedSize: 220,
          ringRadius: 120,
          moonSize: 10,
          markerSize: 8,
          textSize: 'text-xs',
          countdownSize: 'text-sm',
        };
    }
  }, [size]);

  // Calculate orb scale based on phase
  const getOrbScale = () => {
    if (isIdle) {
      // Idle: small gentle pulse (handled by CSS animation)
      return sizeConfig.orbBaseSize / sizeConfig.orbExpandedSize;
    }

    if (!isActive) {
      return sizeConfig.orbBaseSize / sizeConfig.orbExpandedSize;
    }

    switch (phase) {
      case 'inhale':
        // Expand from base to full
        const inhaleScale = sizeConfig.orbBaseSize / sizeConfig.orbExpandedSize;
        return inhaleScale + (1 - inhaleScale) * phaseProgress;

      case 'hold':
        // Stay expanded
        return 1;

      case 'exhale':
        // Contract from full to base
        const exhaleScale = sizeConfig.orbBaseSize / sizeConfig.orbExpandedSize;
        return 1 - (1 - exhaleScale) * phaseProgress;

      case 'holdAfterExhale':
        // Stay contracted
        return sizeConfig.orbBaseSize / sizeConfig.orbExpandedSize;

      default:
        return sizeConfig.orbBaseSize / sizeConfig.orbExpandedSize;
    }
  };

  // Get phase text
  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return 'Inhale';
      case 'hold': return 'Hold';
      case 'exhale': return 'Exhale';
      case 'holdAfterExhale': return 'Hold';
      default: return '';
    }
  };

  // Use short transition for smooth animation since we update every 50ms
  // The scale is calculated based on phaseProgress, so we just need smooth interpolation
  const transitionDuration = isActive ? '100ms' : '0.3s';

  const orbScale = getOrbScale();
  const orbSize = sizeConfig.orbExpandedSize;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: sizeConfig.containerSize,
        height: sizeConfig.containerSize,
      }}
    >
      {/* Orbital Ring */}
      <svg
        className="absolute inset-0"
        width={sizeConfig.containerSize}
        height={sizeConfig.containerSize}
        viewBox={`0 0 ${sizeConfig.containerSize} ${sizeConfig.containerSize}`}
      >
        {/* Ring circle */}
        <circle
          cx={sizeConfig.containerSize / 2}
          cy={sizeConfig.containerSize / 2}
          r={sizeConfig.ringRadius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Top marker (0°/360°) */}
        <circle
          cx={sizeConfig.containerSize / 2}
          cy={sizeConfig.containerSize / 2 - sizeConfig.ringRadius}
          r={sizeConfig.markerSize / 2}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1"
          opacity="0.5"
        />

        {/* Bottom marker (180°) */}
        <circle
          cx={sizeConfig.containerSize / 2}
          cy={sizeConfig.containerSize / 2 + sizeConfig.ringRadius}
          r={sizeConfig.markerSize / 2}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1"
          opacity="0.5"
        />
      </svg>

      {/* Moon Dot - No CSS transition, position updated every 50ms by hook */}
      <div
        className="absolute"
        style={{
          width: sizeConfig.moonSize,
          height: sizeConfig.moonSize,
          borderRadius: '50%',
          backgroundColor: 'var(--accent)',
          // Position moon on the ring using transform
          // moonAngle: 0 = top, 90 = right, 180 = bottom, 270 = left
          transform: `
            translate(-50%, -50%)
            rotate(${moonAngle}deg)
            translateY(-${sizeConfig.ringRadius}px)
            rotate(-${moonAngle}deg)
          `,
          left: '50%',
          top: '50%',
        }}
      />

      {/* Orb */}
      <div
        className={`absolute rounded-full ${isIdle ? 'animate-breath-idle' : ''}`}
        style={{
          width: orbSize,
          height: orbSize,
          background: `radial-gradient(circle at center,
            var(--accent) 0%,
            var(--accent) 20%,
            color-mix(in srgb, var(--accent) 60%, transparent) 50%,
            color-mix(in srgb, var(--accent) 30%, transparent) 70%,
            transparent 100%
          )`,
          transform: `scale(${orbScale})`,
          transition: isIdle
            ? 'transform 2s ease-in-out'
            : `transform ${transitionDuration} linear`,
        }}
      />

      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        {/* Phase text */}
        {isActive && (
          <span
            className={`uppercase tracking-wider font-mono text-[var(--color-text-primary)] ${sizeConfig.textSize}`}
            style={{ opacity: 0.9 }}
          >
            {getPhaseText()}
          </span>
        )}

        {/* Countdown */}
        {isActive && (
          <span
            className={`font-mono text-[var(--color-text-secondary)] ${sizeConfig.countdownSize} mt-1`}
            style={{ opacity: 0.7 }}
          >
            {phaseSecondsRemaining}
          </span>
        )}

        {/* Idle state text */}
        {isIdle && !isActive && (
          <span
            className={`uppercase tracking-wider font-mono text-[var(--color-text-tertiary)] ${sizeConfig.textSize}`}
            style={{ opacity: 0.6 }}
          >
            Ready
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * CSS for idle breathing animation (add to index.css):
 *
 * @keyframes breath-idle {
 *   0%, 100% {
 *     transform: scale(0.68);
 *   }
 *   50% {
 *     transform: scale(0.75);
 *   }
 * }
 *
 * .animate-breath-idle {
 *   animation: breath-idle 4s ease-in-out infinite;
 * }
 */
