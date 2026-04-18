import { useEffect, useState } from 'react';

interface ConfettiProps {
  x?: number;
  y?: number;
}

export function Confetti({ x = 0, y = 0 }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    color: string;
    angle: number;
    distance: number;
    size: number;
    duration: number;
  }>>([]);

  useEffect(() => {
    const colors = [
      '#0066CC',
      '#0099FF',
      '#00CCFF',
      '#3366FF',
      '#0066FF',
      '#0044AA',
      '#00AAFF',
      '#1E90FF',
    ];

    const newParticles = Array.from({ length: 30 }, (_, i) => {
      const angle = (Math.random() * 360) * (Math.PI / 180);
      const distance = 80 + Math.random() * 120;
      return {
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle,
        distance,
        size: 4 + Math.random() * 4,
        duration: 0.5 + Math.random() * 0.3,
      };
    });

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9997] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: x,
            top: y,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            transform: 'translate(-50%, -50%)',
            animation: `confetti-explode ${p.duration}s ease-out forwards`,
            ['--angle' as string]: `${p.angle}rad`,
            ['--distance' as string]: `${p.distance}px`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-explode {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform:
              translate(
                calc(-50% + cos(var(--angle)) * var(--distance)),
                calc(-50% + sin(var(--angle)) * var(--distance))
              )
              scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
