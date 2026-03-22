import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<'subtitle-in' | 'subtitle-out' | 'logo-in' | 'hiding' | 'done'>('subtitle-in');

  useEffect(() => {
    // t=0: subtitle fades in
    // t=1500: subtitle fades out
    // t=2200: logo fades in
    // t=3600: overlay fades out
    // t=4300: done (remove from DOM)

    const t1 = setTimeout(() => setPhase('subtitle-out'), 1500);
    const t2 = setTimeout(() => setPhase('logo-in'), 2200);
    const t3 = setTimeout(() => setPhase('hiding'), 3600);
    const t4 = setTimeout(() => { setPhase('done'); onDone(); }, 4300);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onDone]);

  if (phase === 'done') return null;

  return (
    <div className={`splash-overlay ${phase === 'hiding' ? 'hiding' : ''}`}>
      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 rounded-full bg-white/5" />
      </div>

      {/* Cross icon */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mb-2">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
          </svg>
        </div>

        {/* Subtitle text (phase 1) */}
        <div className={`splash-subtitle-text ${phase === 'subtitle-out' ? 'out' : ''} ${phase === 'logo-in' || phase === 'hiding' ? 'hidden' : ''}`}>
          청각 장애인을 위한 의료 맞춤 서비스
        </div>

        {/* Logo (phase 2) */}
        <div className={`flex flex-col items-center gap-2 ${phase === 'subtitle-in' || phase === 'subtitle-out' ? 'hidden' : ''}`}>
          <div className={`splash-logo ${phase === 'logo-in' || phase === 'hiding' ? 'in' : ''}`}>
            Saptital ai
          </div>
          <div className={`splash-logo-sub ${phase === 'logo-in' || phase === 'hiding' ? 'in' : ''}`}>
            Hospital Communication Service
          </div>
        </div>
      </div>
    </div>
  );
}
