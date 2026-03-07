/**
 * CycleDiagram Component
 *
 * SVG visualization of a relationship cycle — a figure-8 / infinity shape
 * with two loops: one for the pursuer's moves, one for the withdrawer's.
 * Directional arrows show how each side triggers the other.
 *
 * Props:
 * - myMoves: array of move IDs selected by the user
 * - partnerMoves: array of move IDs selected for the partner
 * - cycleName: user-given name for the cycle
 * - myPosition: 'pursuer' | 'withdrawer'
 * - partnerPosition: optional 'pursuer' | 'withdrawer' (defaults to opposite of myPosition)
 * - animate: boolean — whether to animate the build sequence
 * - className: optional class
 */

import { getMoveLabel } from '../../../../../content/modules/theCycleContent';

// Layout constants for the figure-8 diagram
const W = 360;
const H = 480;
const CX = W / 2;          // center x
const TOP_CY = 150;        // top loop center y
const BOT_CY = 330;        // bottom loop center y
const LOOP_RX = 120;       // loop horizontal radius
const LOOP_RY = 90;        // loop vertical radius

// Label placement radii (slightly outside the loops)
const LABEL_RX = LOOP_RX + 10;
const LABEL_RY = LOOP_RY + 10;

/**
 * Distribute labels evenly around an ellipse.
 * Returns array of {x, y} for each label, positioned around the top or bottom half.
 */
function distributeLabels(count, cx, cy, rx, ry, startAngle = -Math.PI / 2) {
  const positions = [];
  const arcSpan = Math.PI * 1.6; // use 80% of the full ellipse to avoid overlap at crossing point
  const offset = (Math.PI * 2 - arcSpan) / 2;

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const angle = startAngle + offset + t * arcSpan;
    positions.push({
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    });
  }
  return positions;
}

export default function CycleDiagram({
  myMoves = [],
  partnerMoves = [],
  cycleName = '',
  myPosition = 'pursuer',
  partnerPosition: partnerPositionProp,
  animate = false,
  className = '',
}) {
  // My moves on top, partner moves on bottom
  const resolvedPartnerPosition = partnerPositionProp || (myPosition === 'pursuer' ? 'withdrawer' : 'pursuer');
  const topMoves = myMoves;
  const botMoves = partnerMoves;
  const topPosition = myPosition;
  const botPosition = resolvedPartnerPosition;
  const topLabel = myPosition === 'pursuer' ? 'I move toward' : 'I move away';
  const botLabel = resolvedPartnerPosition === 'pursuer' ? 'They move toward' : 'They move away';

  // Calculate label positions
  const topLabelPositions = distributeLabels(topMoves.length, CX, TOP_CY, LABEL_RX, LABEL_RY, -Math.PI);
  const botLabelPositions = distributeLabels(botMoves.length, CX, BOT_CY, LABEL_RX, LABEL_RY, 0);

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        fill="none"
        style={{ color: 'var(--fg, var(--color-text-primary))' }}
      >
        {/* Top loop (ellipse) */}
        <ellipse
          cx={CX}
          cy={TOP_CY}
          rx={LOOP_RX}
          ry={LOOP_RY}
          stroke="var(--accent)"
          strokeWidth="1.5"
          className={animate ? 'cycle-loop-top' : undefined}
          strokeDasharray={animate ? '600' : undefined}
        />

        {/* Bottom loop (ellipse) */}
        <ellipse
          cx={CX}
          cy={BOT_CY}
          rx={LOOP_RX}
          ry={LOOP_RY}
          stroke="var(--accent)"
          strokeWidth="1.5"
          className={animate ? 'cycle-loop-bot' : undefined}
          strokeDasharray={animate ? '600' : undefined}
        />

        {/* Directional arrows — right side: top→bottom */}
        <path
          d={`M ${CX + LOOP_RX - 8},${TOP_CY + LOOP_RY - 15} L ${CX + LOOP_RX},${TOP_CY + LOOP_RY + 5}`}
          stroke="var(--accent)"
          strokeWidth="1.5"
          markerEnd="url(#cycle-arrow)"
          className={animate ? 'cycle-arrow-r' : undefined}
        />

        {/* Directional arrows — left side: bottom→top */}
        <path
          d={`M ${CX - LOOP_RX + 8},${BOT_CY - LOOP_RY + 15} L ${CX - LOOP_RX},${BOT_CY - LOOP_RY - 5}`}
          stroke="var(--accent)"
          strokeWidth="1.5"
          markerEnd="url(#cycle-arrow)"
          className={animate ? 'cycle-arrow-l' : undefined}
        />

        {/* Arrow marker definition */}
        <defs>
          <marker
            id="cycle-arrow"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <path d="M 0,0 L 8,3 L 0,6" fill="none" stroke="var(--accent)" strokeWidth="1.2" />
          </marker>
        </defs>

        {/* Top position label */}
        <text
          x={CX}
          y={TOP_CY - LOOP_RY - 14}
          textAnchor="middle"
          fill="var(--accent)"
          fontSize="10"
          fontFamily="monospace"
          style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
          className={animate ? 'cycle-label-fade' : undefined}
        >
          {topLabel}
        </text>

        {/* Bottom position label */}
        <text
          x={CX}
          y={BOT_CY + LOOP_RY + 22}
          textAnchor="middle"
          fill="var(--accent)"
          fontSize="10"
          fontFamily="monospace"
          style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
          className={animate ? 'cycle-label-fade' : undefined}
        >
          {botLabel}
        </text>

        {/* Move labels — top loop */}
        {topMoves.map((moveId, i) => {
          const pos = topLabelPositions[i];
          if (!pos) return null;
          return (
            <text
              key={`top-${moveId}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="currentColor"
              fontSize="11"
              fontFamily="monospace"
              className={animate ? 'cycle-move-fade' : undefined}
              style={animate ? { animationDelay: `${1.2 + i * 0.15}s` } : undefined}
            >
              {getMoveLabel(topPosition, moveId)}
            </text>
          );
        })}

        {/* Move labels — bottom loop */}
        {botMoves.map((moveId, i) => {
          const pos = botLabelPositions[i];
          if (!pos) return null;
          return (
            <text
              key={`bot-${moveId}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="currentColor"
              fontSize="11"
              fontFamily="monospace"
              className={animate ? 'cycle-move-fade' : undefined}
              style={animate ? { animationDelay: `${1.8 + i * 0.15}s` } : undefined}
            >
              {getMoveLabel(botPosition, moveId)}
            </text>
          );
        })}

        {/* Cycle name — center */}
        {cycleName && (
          <text
            x={CX}
            y={(TOP_CY + BOT_CY) / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--accent)"
            fontSize="14"
            fontFamily="'DM Serif Text', serif"
            className={animate ? 'cycle-name-fade' : undefined}
          >
            {cycleName}
          </text>
        )}
      </svg>

      {animate && (
        <style>{`
          .cycle-loop-top {
            stroke-dashoffset: 600;
            animation: cycle-draw 1.5s ease-out forwards;
          }
          .cycle-loop-bot {
            stroke-dashoffset: 600;
            animation: cycle-draw 1.5s ease-out 0.3s forwards;
          }
          .cycle-arrow-r, .cycle-arrow-l {
            opacity: 0;
            animation: cycle-fade-in 0.4s ease forwards;
            animation-delay: 1.0s;
          }
          .cycle-label-fade {
            opacity: 0;
            animation: cycle-fade-in 0.5s ease forwards;
            animation-delay: 0.8s;
          }
          .cycle-move-fade {
            opacity: 0;
            animation: cycle-fade-in 0.4s ease forwards;
          }
          .cycle-name-fade {
            opacity: 0;
            animation: cycle-fade-in 0.6s ease forwards;
            animation-delay: 2.2s;
          }
          @keyframes cycle-draw {
            to { stroke-dashoffset: 0; }
          }
          @keyframes cycle-fade-in {
            to { opacity: 1; }
          }
        `}</style>
      )}
    </div>
  );
}
