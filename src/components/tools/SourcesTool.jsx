/**
 * SourcesTool Component
 * Acknowledgements for the researchers, practitioners, and organizations
 * whose work has contributed to MDMA therapy and psychedelic research.
 */

import { FRAMEWORKS } from '../../content/modules';

const PEOPLE = [
  { name: 'Alexander "Sasha" Shulgin', description: 'Chemist who re-synthesized MDMA and meticulously documented its effects, opening the door to its therapeutic potential.' },
  { name: 'Ann Shulgin', description: 'Therapist and co-author who pioneered the use of MDMA as a tool for therapeutic insight and emotional healing.' },
  { name: 'Leo Zeff', description: 'Psychotherapist known as the "Secret Chief" who quietly introduced MDMA to the therapeutic community in the 1970s.' },
  { name: 'Rick Doblin', description: 'Founder of MAPS, who spent decades leading the push for FDA-approved MDMA-assisted therapy research.' },
  { name: 'Michael & Annie Mithoefer', description: 'Psychiatrist and nurse who led the landmark MAPS Phase 2 and Phase 3 clinical trials for MDMA-assisted therapy for PTSD.' },
  { name: 'Stanislav Grof', description: 'Psychiatrist who mapped the landscape of non-ordinary states of consciousness and developed holotropic breathwork.' },
  { name: 'Ralph Metzner', description: 'Psychologist and consciousness researcher who explored the transformative potential of psychedelic experience.' },
  { name: 'Bill Richards', description: 'Psychedelic researcher at Johns Hopkins who developed structured session frameworks for psilocybin and other psychedelics.' },
  { name: 'Robin Carhart-Harris', description: 'Neuroscientist who led groundbreaking neuroimaging studies on psychedelics at Imperial College London, revealing how they reshape brain connectivity.' },
  { name: 'Amanda Fielding', description: 'Founder of the Beckley Foundation, who has championed psychedelic science and drug policy reform for over four decades.' },
  { name: 'Hamilton Morris', description: 'Journalist, chemist, and researcher whose work has brought rigorous psychedelic pharmacology to a wide audience.' },
  { name: 'Claudio Naranjo', description: 'Chilean psychiatrist and one of the most scientifically rigorous early MDMA therapists, treating over 30 patients before scheduling.' },
  { name: 'George Greer & Requa Tolbert', description: 'Psychiatrist and nurse who treated over 80 patients with MDMA-assisted therapy in the early 1980s and published some of the first clinical accounts.' },
  { name: 'Charles Grob', description: 'Psychiatrist who conducted the first FDA-approved human MDMA study in 1996 and pioneered psilocybin research for end-of-life anxiety.' },
  { name: 'Roland Griffiths', description: 'Founder of the Johns Hopkins Center for Psychedelic Research, whose landmark psilocybin studies reshaped the scientific understanding of psychedelics.' },
  { name: 'Matthew Johnson', description: 'Psychedelic researcher at Johns Hopkins, expert on psychoactive drugs, addiction, and the design of rigorous clinical psychedelic trials.' },
  { name: 'David Nutt', description: 'British neuropharmacologist and advocate for psychedelic research and evidence-based drug policy reform.' },
  { name: 'Marcela Ot\'alora G.', description: 'Lead therapist and trainer for the MAPS MDMA-assisted therapy clinical trials.' },
  { name: 'Torsten Passie', description: 'Researcher and author of the key historical paper documenting the early therapeutic use of MDMA from 1977 to 1985.' },
  { name: 'MethyleneMan', description: 'Underground MDMA chemist whose dedication to purity and harm reduction has quietly influenced standards in the community.' },
  { name: 'Richard Schwartz', description: 'Creator of Internal Family Systems (IFS), a model for working with protective and vulnerable inner parts.' },
  { name: 'Steven Hayes', description: 'Creator of Acceptance and Commitment Therapy (ACT), a framework for psychological flexibility and values-based living.' },
  { name: 'Eugene Gendlin', description: 'Philosopher and psychologist who developed Focusing, a practice for listening to the body\'s felt sense.' },
  { name: 'Peter Levine', description: 'Creator of Somatic Experiencing, a body-based approach to releasing trauma held in the nervous system.' },
  { name: 'Sue Johnson', description: 'Creator of Emotionally Focused Therapy (EFT), a model for understanding attachment and emotional cycles in relationships.' },
  { name: 'Bruce Ecker', description: 'Co-developer of Coherence Therapy, a framework for transforming emotional schemas through experiential reconsolidation.' },
  { name: 'Kristin Neff', description: 'Researcher who pioneered the scientific study of self-compassion and its role in emotional well-being.' },
  { name: 'Fritz Perls', description: 'Co-founder of Gestalt Therapy, an approach centered on present-moment awareness and direct dialogue with experience.' },
];

const ORGANIZATIONS = [
  { name: 'MAPS (Multidisciplinary Association for Psychedelic Studies)', description: 'The pioneering organization behind decades of psychedelic therapy research, including the landmark MDMA-assisted therapy clinical trials.' },
  { name: 'Johns Hopkins Center for Psychedelic & Consciousness Research', description: 'A leading academic institution advancing rigorous research into psychedelic compounds and their therapeutic applications.' },
  { name: 'Imperial College London Centre for Psychedelic Research', description: 'A world-renowned research group studying the neuroscience and therapeutic potential of psychedelic substances.' },
  { name: 'Beckley Foundation', description: 'A think tank and research organization advancing the scientific understanding of consciousness and psychoactive substances.' },
  { name: 'Fireside Project', description: 'Nonprofit operating the first psychedelic peer support hotline, providing free, confidential emotional support to people during and after psychedelic experiences.' },
  { name: 'Zendo Project', description: 'MAPS-sponsored harm reduction initiative providing trained peer support at festivals and events to help people through difficult psychedelic experiences.' },
];

export default function SourcesTool() {
  // Get all non-general frameworks
  const frameworkEntries = Object.entries(FRAMEWORKS).filter(([key]) => key !== 'general');

  return (
    <div className="py-6 px-6 max-w-xl mx-auto">
      <h1
        className="text-2xl mb-8 text-[var(--color-text-primary)]"
        style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
      >
        Sources & Acknowledgements
      </h1>

      <div className="space-y-8 text-[var(--color-text-secondary)]">
        {/* Gratitude Intro */}
        <section>
          <p className="mb-4">
            m-session is deeply indebted to the researchers, practitioners, and
            organizations whose work has shaped the field of MDMA-assisted therapy
            and psychedelic therapeutic research. This app exists because of their
            courage, rigor, and dedication, often carried forward over decades and
            sometimes at great personal cost.
          </p>
          <p>
            Our goal is to serve as a living repository for the knowledge and best
            practices that have emerged from this work, making them accessible to
            anyone seeking to use these tools for honest self-exploration and healing.
            We are grateful beyond measure for the following contributions.
          </p>
        </section>

        {/* People & Pioneers */}
        <section>
          <h2
            className="text-xl mb-4 text-[var(--accent)]"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            People & Pioneers
          </h2>
          <div className="space-y-3">
            {PEOPLE.map((person) => (
              <div key={person.name}>
                <p className="text-base text-[var(--color-text-primary)]" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>{person.name}</p>
                <p>{person.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Organizations & Institutions */}
        <section>
          <h2
            className="text-xl mb-4 text-[var(--accent)]"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            Organizations & Institutions
          </h2>
          <div className="space-y-3">
            {ORGANIZATIONS.map((org) => (
              <div key={org.name}>
                <p className="text-base text-[var(--color-text-primary)]" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>{org.name}</p>
                <p>{org.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Therapeutic Frameworks */}
        <section>
          <h2
            className="text-xl mb-4 text-[var(--accent)]"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            Therapeutic Frameworks
          </h2>
          <p className="mb-4">
            Every guided activity in m-session is rooted in an established therapeutic
            approach, adapted for self-guided use in altered states.
          </p>
          <div className="space-y-3">
            {frameworkEntries.map(([key, fw]) => (
              <div key={key}>
                <p className="text-base text-[var(--color-text-primary)]" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
                  {fw.label}{fw.abbreviation ? ` (${fw.abbreviation})` : ''}
                </p>
                <p>{fw.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How This App Was Built */}
        <section>
          <h2
            className="text-xl mb-4 text-[var(--accent)]"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            How This App Was Built
          </h2>
          <p className="mb-4">
            m-session is built by dasloops in close collaboration with AI, specifically
            Anthropic's Claude. Every piece of content, every therapeutic adaptation, and
            every design decision is directed, reviewed, and refined by a human author
            with deep familiarity with the subject matter. dasloops brings over seven
            years of experience in the field of psychology, as well as many years of
            practice with the facilitation of psychedelics in ritual and therapeutic
            settings, both in personal use and as a guide for others.
          </p>
          <p>
            AI serves as a creative and technical partner in this process, drafting,
            iterating, and building at a pace that would be impossible alone. But the
            vision, judgment, and care behind the work are human. Nothing ships without
            being read, tested, and held to the standard of something you'd trust in
            your most vulnerable moments.
          </p>
        </section>

        {/* Footer */}
        <section className="text-center pt-4">
          <p className="text-xs text-[var(--color-text-tertiary)] mb-3">
            If you believe we've overlooked anyone, please let us know.
          </p>
          <a
            href="https://tally.so/r/BzG9qN"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs uppercase tracking-wider py-2 px-4 border border-[var(--color-border)] text-[var(--accent)] hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            Submit Feedback
          </a>
        </section>
      </div>
    </div>
  );
}
