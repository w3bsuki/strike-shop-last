import Link from 'next/link';

interface SaleBannerProps {
  title: string;
  subtitle: string;
  discount: string;
  link: string;
  endDate?: string;
}

export default function SaleBanner({
  title,
  subtitle,
  discount,
  link,
  endDate,
}: SaleBannerProps) {
  return (
    <Link href={link} className="block">
      <section className="bg-black text-white py-12 md:py-16 lg:py-20 relative overflow-hidden group cursor-pointer">
        <div className="strike-container relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left: Text Content */}
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-typewriter font-bold uppercase tracking-tighter mb-2 text-white">
                {title}
              </h2>
              <p className="text-sm md:text-base font-typewriter uppercase tracking-wider opacity-80 mb-4 text-white">
                {subtitle}
              </p>
              {endDate && (
                <p className="text-xs font-typewriter uppercase tracking-wider opacity-60 text-white">
                  ENDS {endDate}
                </p>
              )}
            </div>
            
            {/* Right: Massive Discount */}
            <div className="text-right">
              <div className="inline-block">
                <span className="text-[100px] md:text-[150px] lg:text-[200px] font-typewriter font-bold leading-none group-hover:scale-110 transition-transform duration-300 text-white">
                  {discount}
                </span>
                <span className="text-2xl md:text-3xl lg:text-4xl font-typewriter font-bold align-top text-white">
                  %
                </span>
              </div>
              <p className="text-sm md:text-base font-typewriter uppercase tracking-wider mt-2 text-white">
                OFF EVERYTHING
              </p>
            </div>
          </div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255,255,255,.1) 10px,
              rgba(255,255,255,.1) 20px
            )`
          }} />
        </div>
      </section>
    </Link>
  );
}