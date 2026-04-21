import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/index.css';

import AsciiMoon from '../../src/components/active/capabilities/animations/AsciiMoon';
import AsciiDiamond from '../../src/components/active/capabilities/animations/AsciiDiamond';
import BreathOrb from '../../src/components/active/capabilities/animations/BreathOrb';
import CompassV2 from '../../src/components/active/capabilities/animations/CompassV2';
import LeafDrawV2 from '../../src/components/active/capabilities/animations/LeafDrawV2';
import MorphingShapes from '../../src/components/active/capabilities/animations/MorphingShapes';
import WaveLoop from '../../src/components/active/capabilities/animations/WaveLoop';
import AsciiLandscape from '../../src/components/active/capabilities/animations/AsciiLandscape';
import AsciiRipple from '../../src/components/active/capabilities/animations/AsciiRipple';
import AsciiRippleScramble from '../../src/components/active/capabilities/animations/AsciiRippleScramble';
import BambooSway from '../../src/components/active/capabilities/animations/BambooSway';
import ConstellationDrift from '../../src/components/active/capabilities/animations/ConstellationDrift';
import ContourRings from '../../src/components/active/capabilities/animations/ContourRings';
import DropRipple from '../../src/components/active/capabilities/animations/DropRipple';
import FlowerBloom from '../../src/components/active/capabilities/animations/FlowerBloom';
import FractalClouds from '../../src/components/active/capabilities/animations/FractalClouds';
import GeometricPulse from '../../src/components/active/capabilities/animations/GeometricPulse';
import InterferenceWaves from '../../src/components/active/capabilities/animations/InterferenceWaves';
import OrganicMorph from '../../src/components/active/capabilities/animations/OrganicMorph';
import Orrery from '../../src/components/active/capabilities/animations/Orrery';
import OrreryRefined from '../../src/components/active/capabilities/animations/OrreryRefined';
import ParticleDrift from '../../src/components/active/capabilities/animations/ParticleDrift';
import ShoreWaves from '../../src/components/active/capabilities/animations/ShoreWaves';

const existingAnimations = [
  {
    name: 'AsciiMoon',
    group: 'Reference',
    notes: 'ASCII moon',
    component: <AsciiMoon opacity={0.68} />,
    scale: 0.72,
  },
  {
    name: 'AsciiDiamond',
    group: 'Reference',
    notes: 'ASCII diamond',
    component: <AsciiDiamond />,
    scale: 1.45,
  },
  {
    name: 'MorphingShapes',
    group: 'Reference',
    notes: 'SVG geometry',
    component: <MorphingShapes size={168} strokeWidth={3} />,
  },
  {
    name: 'BreathOrb',
    group: 'Reference',
    notes: 'Breath guide',
    component: <BreathOrb phase="inhale" phaseProgress={0.35} moonAngle={250} isActive hideText size="medium" />,
    scale: 0.72,
  },
  {
    name: 'LeafDrawV2',
    group: 'Reference',
    notes: 'Organic draw',
    component: <LeafDrawV2 />,
    scale: 1.15,
  },
  {
    name: 'CompassV2',
    group: 'Reference',
    notes: 'Compass',
    component: <CompassV2 size={168} />,
  },
  {
    name: 'WaveLoop',
    group: 'Reference',
    notes: 'Wave + sun',
    component: <WaveLoop size={168} />,
  },
];

const prototypeAnimations = [
  {
    name: 'AsciiRippleScramble',
    group: 'Prototype',
    notes: 'Phrase ripple with ASCII scramble',
    component: <AsciiRippleScramble />,
    scale: 1.42,
  },
  {
    name: 'AsciiRipple',
    group: 'Prototype',
    notes: 'Original bolder phrase ripple',
    component: <AsciiRipple />,
    scale: 1.42,
  },
  {
    name: 'DropRipple',
    group: 'Prototype',
    notes: 'Droplet impact and circular damping',
    component: <DropRipple size={168} />,
  },
  {
    name: 'ParticleDrift',
    group: 'Prototype',
    notes: 'Gentle particle drift, slightly quicker',
    component: <ParticleDrift size={168} />,
  },
  {
    name: 'ConstellationDrift',
    group: 'Prototype',
    notes: 'Visible moving constellation',
    component: <ConstellationDrift size={168} />,
  },
  {
    name: 'OrreryRefined',
    group: 'Prototype',
    notes: 'Layered tilted orbit map',
    component: <OrreryRefined size={168} />,
  },
  {
    name: 'Orrery',
    group: 'Prototype',
    notes: 'Original orbiting dot map',
    component: <Orrery size={168} />,
  },
  {
    name: 'GeometricPulse',
    group: 'Prototype',
    notes: 'Expanding geometry',
    component: <GeometricPulse size={168} />,
  },
  {
    name: 'InterferenceWaves',
    group: 'Prototype',
    notes: 'Wave interference',
    component: <InterferenceWaves size={168} />,
  },
  {
    name: 'OrganicMorph',
    group: 'Prototype',
    notes: 'Slow organic morph',
    component: <OrganicMorph size={168} />,
  },
  {
    name: 'AsciiLandscape',
    group: 'Prototype',
    notes: 'Subtle shifting landscape',
    component: <AsciiLandscape />,
    scale: 1.42,
  },
  {
    name: 'ShoreWaves',
    group: 'Prototype',
    notes: 'Break-thickening shore waves',
    component: <ShoreWaves size={168} />,
  },
  {
    name: 'TreeSway',
    group: 'Prototype',
    notes: 'Tree line in wind',
    component: <BambooSway size={168} />,
  },
  {
    name: 'FlowerBloom',
    group: 'Prototype',
    notes: 'Lotus opening',
    component: <FlowerBloom size={168} />,
  },
  {
    name: 'CloudDrift',
    group: 'Prototype',
    notes: 'Passing cloud contours',
    component: <FractalClouds size={168} />,
  },
  {
    name: 'ContourRings',
    group: 'Prototype',
    notes: 'Grounding rings',
    component: <ContourRings size={168} />,
  },
];

const comparisonAnimations = [...prototypeAnimations, ...existingAnimations];

function AnimationReview({ items }) {
  return (
    <section className="review-stack">
      {items.map((animation) => (
        <article
          key={animation.name}
          className="review-panel border border-[var(--color-border)] rounded-lg"
        >
          <div className="review-visual flex items-center justify-center">
            <div style={{ transform: `scale(${animation.scale || 1})` }}>
              {animation.component}
            </div>
          </div>
          <div className="review-copy">
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <h2
                className="text-xl text-[var(--color-text-primary)] normal-case mb-0"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                {animation.name}
              </h2>
              <span className="text-[10px] tracking-[0.16em] text-[var(--color-text-tertiary)]">
                {animation.group}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--color-text-secondary)] normal-case mb-0">
              {animation.notes}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
}

function MiniComparison({ items }) {
  return (
    <section className="mini-grid">
      {items.map((animation) => (
        <article key={animation.name} className="mini-card border border-[var(--color-border)] rounded-lg">
          <div className="mini-visual flex items-center justify-center">
            <div style={{ transform: `scale(${(animation.scale || 1) * 0.55})` }}>
              {animation.component}
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2 px-3 pb-3">
            <h3 className="text-[10px] font-medium normal-case mb-0">{animation.name}</h3>
            <span className="text-[9px] text-[var(--color-text-tertiary)]">
              {animation.group}
            </span>
          </div>
        </article>
      ))}
    </section>
  );
}

export default function AnimationPreview() {
  const scrollRootRef = useRef(null);

  useEffect(() => {
    scrollRootRef.current?.scrollTo({ top: 0, left: 0 });
  }, []);

  return (
    <main
      ref={scrollRootRef}
      className="preview-scroll-root bg-[var(--color-bg)] text-[var(--color-text-primary)] px-6 py-8"
    >
      <style>{`
        html,
        body,
        #root {
          height: 100% !important;
          min-height: 100% !important;
          overflow: hidden !important;
        }

        .preview-scroll-root {
          height: 100vh;
          height: 100dvh;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }

        .review-stack {
          display: grid;
          gap: 18px;
        }

        .review-panel {
          min-height: 320px;
          display: grid;
          grid-template-columns: minmax(240px, 1fr) minmax(220px, 320px);
          align-items: stretch;
          overflow: hidden;
        }

        .review-visual {
          min-height: 320px;
        }

        .review-copy {
          border-left: 1px solid var(--color-border);
          padding: 28px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .mini-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
        }

        .mini-visual {
          height: 100px;
          overflow: hidden;
        }

        @media (max-width: 760px) {
          .review-panel {
            grid-template-columns: 1fr;
          }

          .review-copy {
            border-left: 0;
            border-top: 1px solid var(--color-border);
            padding: 20px;
          }
        }
      `}</style>
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1
            className="text-3xl text-[var(--color-text-primary)] mb-3"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            Animation prototype review
          </h1>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)] mb-0">
            Large scroll view with a compact line-weight strip below
          </p>
        </header>

        <h2 className="text-xs tracking-[0.18em] text-[var(--color-text-tertiary)] mb-4">
          Large specimens
        </h2>
        <AnimationReview items={comparisonAnimations} />

        <h2 className="text-xs tracking-[0.18em] text-[var(--color-text-tertiary)] mt-12 mb-4">
          Compact comparison strip
        </h2>
        <MiniComparison items={comparisonAnimations} />
      </div>
    </main>
  );
}

const rootElement = document.getElementById('root');
const root = window.__animationPreviewRoot || createRoot(rootElement);
window.__animationPreviewRoot = root;

root.render(
  <React.StrictMode>
    <AnimationPreview />
  </React.StrictMode>,
);
