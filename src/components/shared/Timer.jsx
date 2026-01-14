/**
 * Timer Component
 * Reusable countdown/countup timer display
 * Formatted as MM:SS or HH:MM:SS
 */

export default function Timer({
  seconds,
  mode = 'countdown', // 'countdown' or 'elapsed'
  className = '',
}) {
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`font-mono text-app-gray-600 dark:text-app-gray-400 ${className}`}>
      {formatTime(seconds)}
    </div>
  );
}
