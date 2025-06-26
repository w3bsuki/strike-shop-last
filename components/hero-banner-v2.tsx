import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface HeroBannerV2Props {
  image: string;
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
}

export default function HeroBannerV2({
  image,
  title,
  subtitle,
  buttonText = 'SHOP NOW',
  buttonLink = '#',
}: HeroBannerV2Props) {
  return (
    <section className="relative h-[65vh] h-[65dvh] md:h-[70vh] md:h-[70dvh] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={image}
          alt={title}
          fill
          sizes="100vw"
          priority={true}
          className="object-cover object-center"
          quality={90}
        />
        {/* Stark Overlay */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center justify-center">
        <div className="text-center px-4 md:px-8 max-w-6xl mx-auto">
          {/* Massive Typography */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] font-typewriter font-bold text-white uppercase leading-[0.85] tracking-tighter mb-4 md:mb-6">
            {title}
          </h1>
          
          {subtitle && (
            <p className="text-sm md:text-base lg:text-lg font-typewriter text-white/90 uppercase tracking-wider mb-6 md:mb-8 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
          
          <Link href={buttonLink}>
            <Button
              variant="strike"
              size="lg"
              className="bg-white text-black hover:bg-black hover:text-white border-2 border-white font-typewriter font-bold uppercase tracking-wider px-8 py-4 text-sm md:text-base transition-all duration-200"
            >
              {buttonText}
            </Button>
          </Link>
        </div>
      </div>

      {/* Infinite Scrolling Trust Factors */}
      <div className="absolute bottom-0 left-0 right-0 bg-black text-white py-3 md:py-4 overflow-hidden">
        <div className="relative flex">
          <div className="animate-marquee whitespace-nowrap flex">
            {[...Array(10)].map((_, i) => (
              <span key={`first-${i}`} className="inline-block text-sm md:text-base font-typewriter font-medium uppercase tracking-wide mx-6 md:mx-8">
                FREE SHIPPING WORLDWIDE • 30 DAY RETURNS • STRIKE GUARANTEE • VERIFIED AUTHENTIC • 
              </span>
            ))}
          </div>
          <div className="animate-marquee2 whitespace-nowrap flex absolute top-0">
            {[...Array(10)].map((_, i) => (
              <span key={`second-${i}`} className="inline-block text-sm md:text-base font-typewriter font-medium uppercase tracking-wide mx-6 md:mx-8">
                FREE SHIPPING WORLDWIDE • 30 DAY RETURNS • STRIKE GUARANTEE • VERIFIED AUTHENTIC • 
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}