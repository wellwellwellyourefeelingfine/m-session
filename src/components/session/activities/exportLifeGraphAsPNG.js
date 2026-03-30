/**
 * Canvas-based PNG export for the Life Graph.
 *
 * Renders milestones as a smooth bezier curve on a 0-10 well-being scale.
 * 4× retina scale (1200×800 logical → 4800×3200 physical).
 * Theme-aware: reads dark class from <html>.
 */

export async function exportLifeGraphAsPNG(milestones) {
  const scale = 4;
  const W = 1200;
  const H = 800;

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
  const gridLine = isDark ? '#333333' : '#D0D0D0';
  const dotFill = accent;
  const curveStroke = accent;

  await document.fonts.ready;

  // Layout constants
  const LEFT_PAD = 100;
  const RIGHT_PAD = 60;
  const TOP_PAD = 60;
  const BOTTOM_PAD = 140;
  const FOOTER_Y = H - 30;
  const CHART_W = W - LEFT_PAD - RIGHT_PAD;
  const CHART_H = H - TOP_PAD - BOTTOM_PAD;

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Y-axis: 0-10 grid lines + labels
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 10; i++) {
    const y = TOP_PAD + CHART_H - (i / 10) * CHART_H;

    // Grid line
    ctx.strokeStyle = gridLine;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(LEFT_PAD, y);
    ctx.lineTo(LEFT_PAD + CHART_W, y);
    ctx.stroke();

    // Number label
    ctx.fillStyle = textTertiary;
    ctx.font = '20px monospace';
    ctx.fillText(String(i), LEFT_PAD - 14, y);
  }

  // Y-axis anchors
  ctx.fillStyle = textTertiary;
  ctx.font = '14px monospace';
  ctx.textAlign = 'right';
  ctx.save();
  ctx.translate(18, TOP_PAD + CHART_H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('THRIVING', 0 + CHART_H * 0.25, 0);
  ctx.restore();
  ctx.save();
  ctx.translate(18, TOP_PAD + CHART_H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('STRUGGLING', 0 - CHART_H * 0.25, 0);
  ctx.restore();

  // X-axis: milestone labels
  const count = milestones.length;
  if (count === 0) {
    // No data — just show footer
    ctx.fillStyle = textTertiary;
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('No milestones added', W / 2, H / 2);
  }

  // Compute point positions
  const points = milestones.map((m, i) => {
    const x = count === 1
      ? LEFT_PAD + CHART_W / 2
      : LEFT_PAD + (i / (count - 1)) * CHART_W;
    const y = TOP_PAD + CHART_H - (m.rating / 10) * CHART_H;
    return { x, y, label: m.label, note: m.note, rating: m.rating };
  });

  // Dynamic label sizing
  const labelFontSize = count > 10 ? 14 : count > 7 ? 15 : 17;
  const labelRotation = count > 12 ? -Math.PI / 3 : count > 5 ? -Math.PI / 4 : 0;
  const maxLabelChars = count > 15 ? 12 : count > 10 ? 18 : 30;

  // X-axis labels
  ctx.fillStyle = textPrimary;
  ctx.font = `${labelFontSize}px monospace`;
  for (const pt of points) {
    ctx.save();
    ctx.translate(pt.x, TOP_PAD + CHART_H + 20);
    ctx.rotate(labelRotation);
    ctx.textAlign = labelRotation ? 'right' : 'center';
    ctx.textBaseline = 'top';
    let label = pt.label;
    if (label.length > maxLabelChars) {
      label = label.slice(0, maxLabelChars - 1) + '\u2026';
    }
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }

  // Draw curve
  if (points.length === 1) {
    // Single dot
    ctx.fillStyle = dotFill;
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, 7, 0, Math.PI * 2);
    ctx.fill();
  } else if (points.length === 2) {
    // Straight line
    ctx.strokeStyle = curveStroke;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.stroke();

    // Dots
    ctx.fillStyle = dotFill;
    for (const pt of points) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (points.length > 2) {
    // Smooth bezier curve — quadratic with midpoint control points
    ctx.strokeStyle = curveStroke;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 2; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const midX = (curr.x + next.x) / 2;
      const midY = (curr.y + next.y) / 2;
      ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
    }

    // Final segment: smooth curve through second-to-last point to last point
    const last = points[points.length - 1];
    const secondLast = points[points.length - 2];
    ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
    ctx.stroke();

    // Dots
    ctx.fillStyle = dotFill;
    for (const pt of points) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Note labels (word-wrapped, rendered near each dot)
  const noteFontSize = count > 10 ? 11 : 13;
  const noteLineHeight = noteFontSize + 4;
  const noteMaxWidth = count > 1
    ? Math.min(140, (CHART_W / (count - 1)) * 0.7)
    : 140;
  ctx.fillStyle = textTertiary;
  ctx.font = `${noteFontSize}px monospace`;
  ctx.textAlign = 'center';

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    if (!pt.note?.trim()) continue;

    // Placement: above at 0 and 7–9, below at 1–6 and 10
    const placeAbove = pt.rating === 0 || (pt.rating >= 7 && pt.rating <= 9);

    // Word-wrap into lines that fit within noteMaxWidth
    const words = pt.note.trim().split(/\s+/);
    const lines = [];
    let currentLine = words[0];
    for (let w = 1; w < words.length; w++) {
      const test = currentLine + ' ' + words[w];
      if (ctx.measureText(test).width <= noteMaxWidth) {
        currentLine = test;
      } else {
        lines.push(currentLine);
        currentLine = words[w];
      }
    }
    lines.push(currentLine);

    // Position the block of lines relative to the dot
    const gap = 14; // space between dot and first line of text
    if (placeAbove) {
      // Stack upward: last line closest to dot
      ctx.textBaseline = 'bottom';
      for (let l = 0; l < lines.length; l++) {
        const lineY = pt.y - gap - (lines.length - 1 - l) * noteLineHeight;
        ctx.fillText(lines[l], pt.x, lineY);
      }
    } else {
      // Stack downward: first line closest to dot
      ctx.textBaseline = 'top';
      for (let l = 0; l < lines.length; l++) {
        const lineY = pt.y + gap + l * noteLineHeight;
        ctx.fillText(lines[l], pt.x, lineY);
      }
    }
  }

  // Footer
  ctx.fillStyle = textTertiary;
  ctx.font = '15px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `YOUR LIFE GRAPH \u00B7 ${new Date().toLocaleDateString()}`,
    W / 2,
    FOOTER_Y,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}
