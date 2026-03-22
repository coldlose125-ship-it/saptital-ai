import { useEffect, useState } from 'react';
import { Stethoscope } from 'lucide-react';

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<'in' | 'hiding' | 'done'>('in');

  useEffect(() => {
    // t=0:    logo fades in
    // t=1800: start fading out
    // t=2500: done
    const t1 = setTimeout(() => setPhase('hiding'), 1800);
    const t2 = setTimeout(() => { setPhase('done'); onDone(); }, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
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

      {/* Logo — same design as the header, scaled up */}
      <div className="splash-logo in relative z-10 flex flex-col items-center gap-5">
        {/* Icon */}
        <div className="w-24 h-24 bg-white/15 rounded-3xl flex items-center justify-center shadow-2xl ring-1 ring-white/20">
          <Stethoscope className="w-14 h-14 text-white" />
        </div>

        {/* Brand name */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="text-white text-5xl font-extrabold tracking-tight leading-none">
            Sapital <span className="text-blue-300">AI</span>
          </div>
          <div className="text-white/60 text-sm font-medium tracking-widest uppercase">
            Hospital Communication Service
          </div>
        </div>

        {/* Subtitle */}
        <div className="splash-subtitle-text mt-2 text-base">
          청각장애인을 위한 병원 진료 맞춤 소통 서비스
        </div>
      </div>
    </div>
  );
}
