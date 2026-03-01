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
  const LEFT_PAD = 80;
  const RIGHT_PAD = 60;
  const TOP_PAD = 60;
  const BOTTOM_PAD = 120;
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
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(LEFT_PAD, y);
    ctx.lineTo(LEFT_PAD + CHART_W, y);
    ctx.stroke();

    // Number label
    ctx.fillStyle = textTertiary;
    ctx.font = '14px monospace';
    ctx.fillText(String(i), LEFT_PAD - 12, y);
  }

  // Y-axis anchors
  ctx.fillStyle = textTertiary;
  ctx.font = '10px monospace';
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
    return { x, y, label: m.label };
  });

  // Dynamic label sizing
  const labelFontSize = count > 10 ? 10 : count > 7 ? 11 : 13;
  const labelRotation = count > 12 ? -Math.PI / 3 : count > 5 ? -Math.PI / 4 : 0;
  const maxLabelChars = count > 15 ? 12 : count > 10 ? 18 : 30;

  // X-axis labels
  ctx.fillStyle = textPrimary;
  ctx.font = `${labelFontSize}px monospace`;
  for (const pt of points) {
    ctx.save();
    ctx.translate(pt.x, TOP_PAD + CHART_H + 16);
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
    ctx.arc(points[0].x, points[0].y, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (points.length === 2) {
    // Straight line
    ctx.strokeStyle = curveStroke;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.stroke();

    // Dots
    ctx.fillStyle = dotFill;
    for (const pt of points) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (points.length > 2) {
    // Smooth bezier curve — quadratic with midpoint control points
    ctx.strokeStyle = curveStroke;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const midX = (curr.x + next.x) / 2;
      const midY = (curr.y + next.y) / 2;

      if (i === 0) {
        // First segment: quadratic to midpoint
        ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
      } else {
        // Middle segments: quadratic from previous midpoint through current point to next midpoint
        ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
      }
    }

    // Last segment: quadratic to final point
    const last = points[points.length - 1];
    const secondLast = points[points.length - 2];
    ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);

    // Actually: use the last point as the final destination
    // The curve from the last midpoint to the final point
    ctx.stroke();

    // Dots
    ctx.fillStyle = dotFill;
    for (const pt of points) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Footer
  ctx.fillStyle = textTertiary;
  ctx.font = '12px monospace';
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
