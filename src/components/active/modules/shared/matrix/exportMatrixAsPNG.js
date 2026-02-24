/**
 * Shared PNG export utility for the Values Compass matrix.
 * Extracted from ValuesCompassModule for reuse in follow-up modules.
 */

import { QUADRANT_LABELS } from '../../../../../content/modules/valuesCompassContent';

export async function exportMatrixAsPNG(quadrants) {
  const scale = 3;
  const BASE = 420;
  const MATRIX = 360;
  const PAD = 30;
  const FOOTER = 40;

  const canvas = document.createElement('canvas');
  canvas.width = BASE * scale;
  canvas.height = (BASE + FOOTER) * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  const isDark = document.documentElement.classList.contains('dark');
  const bg = isDark ? '#1A1A1A' : '#F5F5F0';
  const accent = isDark ? '#9D8CD9' : '#E8A87C';
  const textPrimary = isDark ? '#E5E5E5' : '#3A3A3A';
  const textTertiary = isDark ? '#666666' : '#999999';
  const border = isDark ? '#333333' : '#D0D0D0';
  const chipBg = isDark ? '#2A2A2A' : '#ECECEC';

  // Wait for fonts
  await document.fonts.ready;

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, BASE, BASE + FOOTER);

  const cx = PAD + MATRIX / 2;
  const cy = PAD + MATRIX / 2;

  // Heat map gradient
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, MATRIX * 0.45);
  grad.addColorStop(0, accent + '28');
  grad.addColorStop(1, accent + '00');
  ctx.fillStyle = grad;
  ctx.fillRect(PAD, PAD, MATRIX, MATRIX);

  // Grid lines (accent color, semi-opaque)
  const accentLine = accent + '4D'; // ~30% opacity
  ctx.strokeStyle = accentLine;
  ctx.lineWidth = 0.5;
  const arrowSize = 3;
  // Shortened vertical axis — line terminates at arrow bases
  const vTop = PAD + MATRIX * 0.08;
  const vBot = PAD + MATRIX * 0.92;
  ctx.beginPath();
  ctx.moveTo(cx, vTop + arrowSize);
  ctx.lineTo(cx, vBot - arrowSize);
  ctx.stroke();
  // Shortened horizontal axis — line terminates at arrow bases
  const hLeft = PAD + MATRIX * 0.14;
  const hRight = PAD + MATRIX * 0.86;
  ctx.beginPath();
  ctx.moveTo(hLeft + arrowSize, cy);
  ctx.lineTo(hRight - arrowSize, cy);
  ctx.stroke();

  // Arrow heads
  ctx.fillStyle = accentLine;
  // Up arrow
  ctx.beginPath();
  ctx.moveTo(cx, vTop);
  ctx.lineTo(cx - arrowSize, vTop + arrowSize);
  ctx.lineTo(cx + arrowSize, vTop + arrowSize);
  ctx.fill();
  // Down arrow
  ctx.beginPath();
  ctx.moveTo(cx, vBot);
  ctx.lineTo(cx - arrowSize, vBot - arrowSize);
  ctx.lineTo(cx + arrowSize, vBot - arrowSize);
  ctx.fill();
  // Left arrow
  ctx.beginPath();
  ctx.moveTo(hLeft, cy);
  ctx.lineTo(hLeft + arrowSize, cy - arrowSize);
  ctx.lineTo(hLeft + arrowSize, cy + arrowSize);
  ctx.fill();
  // Right arrow
  ctx.beginPath();
  ctx.moveTo(hRight, cy);
  ctx.lineTo(hRight - arrowSize, cy - arrowSize);
  ctx.lineTo(hRight - arrowSize, cy + arrowSize);
  ctx.fill();

  // Axis labels
  ctx.fillStyle = textTertiary;
  ctx.font = '6px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('AWAY', PAD + MATRIX * 0.05, cy + 3);
  ctx.fillText('TOWARD', PAD + MATRIX * 0.95, cy + 3);
  ctx.fillText('EXTERNAL ACTIONS', cx, PAD + 8);
  ctx.fillText('INNER EXPERIENCE', cx, PAD + MATRIX - 4);

  // Quadrant offsets: q3(TL) q4(TR) q2(BL) q1(BR)
  const offsets = {
    q3: { x: PAD, y: PAD },
    q4: { x: cx, y: PAD },
    q2: { x: PAD, y: cy },
    q1: { x: cx, y: cy },
  };
  const half = MATRIX / 2;

  // Quadrant labels (serif, accent color) — positioned at corner opposite origin
  ctx.font = '9px serif';
  ctx.fillStyle = accent + 'B3'; // ~70% opacity
  // q3 (top-left): label at top-left
  ctx.textAlign = 'left';
  ctx.fillText(QUADRANT_LABELS.q3 || '', offsets.q3.x + 4, offsets.q3.y + 12);
  // q4 (top-right): label at top-right
  ctx.textAlign = 'right';
  ctx.fillText(QUADRANT_LABELS.q4 || '', offsets.q4.x + half - 4, offsets.q4.y + 12);
  // q2 (bottom-left): label at bottom-left
  ctx.textAlign = 'left';
  ctx.fillText(QUADRANT_LABELS.q2 || '', offsets.q2.x + 4, offsets.q2.y + half - 6);
  // q1 (bottom-right): label at bottom-right
  ctx.textAlign = 'right';
  ctx.fillText(QUADRANT_LABELS.q1 || '', offsets.q1.x + half - 4, offsets.q1.y + half - 6);

  // Draw chips
  ctx.font = '7px monospace';
  ctx.textAlign = 'left';
  for (const [qId, chips] of Object.entries(quadrants)) {
    const off = offsets[qId];
    if (!off || !chips) continue;
    for (const chip of chips) {
      const chipX = off.x + 6 + chip.x * (half - 40);
      const chipY = off.y + 20 + chip.y * (half - 30);

      const textWidth = ctx.measureText(chip.text.toUpperCase()).width;
      const chipW = textWidth + 10;
      const chipH = 14;

      // Chip background
      ctx.fillStyle = chipBg;
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, chipW, chipH, 7);
      ctx.fill();

      // Chip border
      ctx.strokeStyle = border;
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, chipW, chipH, 7);
      ctx.stroke();

      // Chip text
      ctx.fillStyle = textPrimary;
      ctx.fillText(chip.text.toUpperCase(), chipX + 5, chipY + 10);
    }
  }

  // Footer
  ctx.fillStyle = textTertiary;
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`VALUES COMPASS \u00B7 ${new Date().toLocaleDateString()}`, BASE / 2, BASE + FOOTER / 2 + 3);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}
