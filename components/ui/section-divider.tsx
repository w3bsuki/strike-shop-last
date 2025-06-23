interface SectionDividerProps {
  text?: string;
  className?: string;
}

export function SectionDivider({ 
  text = "STRIKE™", 
  className = "" 
}: SectionDividerProps) {
  return (
    <div className={`relative overflow-hidden bg-black py-3 ${className}`}>
      <div className="marquee-container">
        <div className="marquee-content">
          {Array.from({ length: 20 }, (_, i) => (
            <span
              key={i}
              className="inline-block text-white font-typewriter text-xs font-bold uppercase tracking-[0.2em] mx-8"
            >
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}