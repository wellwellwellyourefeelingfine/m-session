/**
 * Canvas-based PNG export for the Cycle Diagram.
 *
 * Renders a figure-8 cycle diagram on a 1200×1000 logical canvas.
 * 4× retina scale. Theme-aware.
 */

import { getMoveLabel } from '../../../../../content/modules/theCycleContent';

export async function exportCycleAsPNG({ myMoves, partnerMoves, cycleName, myPosition, partnerPosition: partnerPositionProp }) {
  const scale = 4;
  const W = 1200;
  const H = 1000;

  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  // Theme detection
  const isDark = document.documentElement.classList.contains('dark');
  const bg = isDark ? '#1A1A1A' : '#F5F5F0';
  const accent = isDark ? '#9D8CD9' : '#E8A87C';
  const textPrimary = isDark ? '#E5E5E5' : '#3A3A3A';
  const textTertiary = isDark ? '#666666' : '#999999';

  await document.fonts.ready;

  // Layout
  const CX = W / 2;
  const TOP_CY = 320;
  const BOT_CY = 680;
  const LOOP_RX = 280;
  const LOOP_RY = 200;

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.fillStyle = textPrimary;
  ctx.font = '28px "DM Serif Text", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('THE CYCLE', CX, 50);

  // Determine layout — my moves on top, partner moves on bottom
  const resolvedPartnerPosition = partnerPositionProp || (myPosition === 'pursuer' ? 'withdrawer' : 'pursuer');
  const topMoves = myMoves;
  const botMoves = partnerMoves;
  const topPosition = myPosition;
  const botPosition = resolvedPartnerPosition;
  const topLabel = myPosition === 'pursuer' ? 'I MOVE TOWARD' : 'I MOVE AWAY';
  const botLabel = resolvedPartnerPosition === 'pursuer' ? 'THEY MOVE TOWARD' : 'THEY MOVE AWAY';

  // Draw ellipses
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.ellipse(CX, TOP_CY, LOOP_RX, LOOP_RY, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(CX, BOT_CY, LOOP_RX, LOOP_RY, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Draw arrows (right side top→bottom, left side bottom→top)
  const drawArrow = (x1, y1, x2, y2) => {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 12;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4));
    ctx.stroke();
  };

  drawArrow(CX + LOOP_RX - 15, TOP_CY + LOOP_RY - 30, CX + LOOP_RX, TOP_CY + LOOP_RY + 10);
  drawArrow(CX - LOOP_RX + 15, BOT_CY - LOOP_RY + 30, CX - LOOP_RX, BOT_CY - LOOP_RY - 10);

  // Position labels
  ctx.fillStyle = accent;
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(topLabel, CX, TOP_CY - LOOP_RY - 20);
  ctx.fillText(botLabel, CX, BOT_CY + LOOP_RY + 30);

  // Distribute move labels around ellipses
  function drawMoveLabels(moves, position, cx, cy, rx, ry, startAngle) {
    const labelRx = rx + 20;
    const labelRy = ry + 20;
    const arcSpan = Math.PI * 1.6;
    const offset = (Math.PI * 2 - arcSpan) / 2;

    ctx.fillStyle = textPrimary;
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    moves.forEach((moveId, i) => {
      const t = moves.length === 1 ? 0.5 : i / (moves.length - 1);
      const angle = startAngle + offset + t * arcSpan;
      const x = cx + labelRx * Math.cos(angle);
      const y = cy + labelRy * Math.sin(angle);
      ctx.fillText(getMoveLabel(position, moveId), x, y);
    });
  }

  drawMoveLabels(topMoves, topPosition, CX, TOP_CY, LOOP_RX, LOOP_RY, -Math.PI);
  drawMoveLabels(botMoves, botPosition, CX, BOT_CY, LOOP_RX, LOOP_RY, 0);

  // Cycle name — center
  if (cycleName) {
    ctx.fillStyle = accent;
    ctx.font = '22px "DM Serif Text", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cycleName, CX, (TOP_CY + BOT_CY) / 2);
  }

  // Footer
  ctx.fillStyle = textTertiary;
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `THE CYCLE \u00B7 ${new Date().toLocaleDateString()}`,
    CX,
    H - 30,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}
