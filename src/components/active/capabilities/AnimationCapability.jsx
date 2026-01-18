/**
 * AnimationCapability Component
 *
 * Renders visual animations for modules:
 * - 'breathing-circle': Circle that expands/contracts with breath phases
 * - 'glowing-orb': Animated glowing orb (future implementation)
 * - 'fade-pulse': Subtle pulsing fade effect
 */

/**
 * @param {object} props
 * @param {object} props.config - Animation capability config
 * @param {string} props.config.type - 'breathing-circle' | 'glowing-orb' | 'fade-pulse'
 * @param {string} props.config.color - Color for the animation
 * @param {string} props.config.size - 'small' | 'medium' | 'large'
 * @param {string} props.breathPhase - Current breath phase (for breathing-circle)
 * @param {number} props.countdown - Countdown number to display (for breathing-circle)
 * @param {boolean} props.isActive - Whether animation should be active
 */
export default function AnimationCapability({
  config,
  breathPhase,
  countdown,
  isActive = true,
}) {
  if (!config || !config.type) {
    return null;
  }

  const { type, color, size = 'medium' } = config;

  switch (type) {
    case 'breathing-circle':
      return (
        <BreathingCircle
          breathPhase={breathPhase}
          countdown={countdown}
          size={size}
          isActive={isActive}
        />
      );

    case 'glowing-orb':
      return (
        <GlowingOrb
          color={color}
          size={size}
          isActive={isActive}
        />
      );

    case 'fade-pulse':
      return (
        <FadePulse
          size={size}
          isActive={isActive}
        />
      );

    default:
      return null;
  }
}

/**
 * Breathing Circle Animation
 * Expands on inhale, contracts on exhale
 */
function BreathingCircle({ breathPhase, countdown, size, isActive }) {
  const getSizeClasses = () => {
    switch (size) {
      case 'small': return 'w-24 h-24';
      case 'large': return 'w-40 h-40';
      default: return 'w-32 h-32';
    }
  };

  const getScaleClass = () => {
    if (!isActive) return 'scale-75';

    switch (breathPhase) {
      case 'inhale':
        return 'scale-100';
      case 'hold':
        return 'scale-100';
      case 'exhale':
        return 'scale-75';
      case 'holdAfterExhale':
        return 'scale-75';
      default:
        return 'scale-75';
    }
  };

  // Calculate transition duration based on breath phase
  // This makes the circle animation smooth and synced with the breathing
  const getTransitionDuration = () => {
    // Default smooth transition
    return 'duration-1000';
  };

  return (
    <div className="flex justify-center py-8">
      <div
        className={`${getSizeClasses()} rounded-full border-2 border-[var(--color-border)]
          flex items-center justify-center transition-transform ease-in-out
          ${getTransitionDuration()} ${getScaleClass()}`}
      >
        {countdown !== undefined && isActive && (
          <span className="text-2xl text-[var(--color-text-primary)] font-light">
            {countdown}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Glowing Orb Animation (Future)
 * Animated glowing orb for meditation focus
 */
function GlowingOrb({ color = 'orange', size, isActive }) {
  const getSizeClasses = () => {
    switch (size) {
      case 'small': return 'w-16 h-16';
      case 'large': return 'w-32 h-32';
      default: return 'w-24 h-24';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'orange':
        return 'bg-orange-400/30 shadow-orange-400/50';
      case 'blue':
        return 'bg-blue-400/30 shadow-blue-400/50';
      case 'purple':
        return 'bg-purple-400/30 shadow-purple-400/50';
      case 'green':
        return 'bg-green-400/30 shadow-green-400/50';
      default:
        return 'bg-orange-400/30 shadow-orange-400/50';
    }
  };

  return (
    <div className="flex justify-center py-8">
      <div className="relative">
        {/* Outer glow */}
        <div
          className={`${getSizeClasses()} rounded-full ${getColorClasses()}
            blur-xl absolute inset-0
            ${isActive ? 'animate-pulse' : 'opacity-30'}`}
        />
        {/* Inner orb */}
        <div
          className={`${getSizeClasses()} rounded-full ${getColorClasses()}
            relative shadow-2xl
            ${isActive ? 'animate-orb-glow' : 'opacity-50'}`}
        />
      </div>
    </div>
  );
}

/**
 * Fade Pulse Animation
 * Subtle pulsing effect for ambient modules
 */
function FadePulse({ size, isActive }) {
  const getSizeClasses = () => {
    switch (size) {
      case 'small': return 'w-8 h-8';
      case 'large': return 'w-16 h-16';
      default: return 'w-12 h-12';
    }
  };

  return (
    <div className="flex justify-center py-4">
      <div
        className={`${getSizeClasses()} rounded-full bg-[var(--color-text-tertiary)]
          ${isActive ? 'animate-pulse' : 'opacity-30'}`}
      />
    </div>
  );
}

/**
 * Standalone Breathing Circle for direct use
 */
export function BreathingCircleStandalone({
  phase,
  countdown,
  size = 'medium',
}) {
  return (
    <BreathingCircle
      breathPhase={phase}
      countdown={countdown}
      size={size}
      isActive={true}
    />
  );
}

/**
 * CSS keyframes for orb animation (add to global styles or index.css)
 *
 * @keyframes orb-glow {
 *   0%, 100% {
 *     opacity: 0.6;
 *     transform: scale(1);
 *   }
 *   50% {
 *     opacity: 1;
 *     transform: scale(1.1);
 *   }
 * }
 *
 * .animate-orb-glow {
 *   animation: orb-glow 3s ease-in-out infinite;
 * }
 */
