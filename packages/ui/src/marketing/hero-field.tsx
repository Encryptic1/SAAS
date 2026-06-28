export function HeroField() {
  const gridLines = [120, 240, 360, 480, 600, 720, 840, 960, 1080];
  const waves = [
    { y: 160, c1: -90, c2: 120 },
    { y: 280, c1: 70, c2: -70 },
    { y: 400, c1: -120, c2: 80 },
    { y: 520, c1: 90, c2: -90 },
    { y: 640, c1: -80, c2: 120 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="ms-noise absolute inset-0 opacity-80" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 800" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="ms-gold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#C5A55A" stopOpacity="0" />
            <stop offset="50%" stopColor="#C5A55A" stopOpacity="0.36" />
            <stop offset="100%" stopColor="#39FF14" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        {gridLines.map((x, index) => (
          <line
            key={x}
            x1={x}
            y1="0"
            x2={x}
            y2="800"
            stroke="#C5A55A"
            strokeOpacity="0.08"
            style={{
              transformOrigin: `${x}px 0`,
              animation: `ms-grid-line 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.04}s both`,
            }}
          />
        ))}
        {waves.map((wave, index) => (
          <path
            key={wave.y}
            d={`M0,${wave.y + index * 8} C220,${wave.y + wave.c1} 410,${wave.y + wave.c2} 650,${wave.y} C840,${
              wave.y - 70
            } 980,${wave.y + 80} 1200,${wave.y - 30}`}
            fill="none"
            stroke="url(#ms-gold)"
            strokeWidth="1.5"
            opacity={0.9}
          />
        ))}
      </svg>
    </div>
  );
}
