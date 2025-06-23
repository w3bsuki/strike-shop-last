import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface HeroBannerProps {
  image: string;
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  textPosition?: 'bottom-left' | 'bottom-center' | 'center-left';
  textAlign?: 'text-left' | 'text-center';
  smallTitle?: boolean;
  showBrandCarousel?: boolean;
}

export default function HeroBanner({
  image,
  title,
  subtitle,
  buttonText = 'SHOP NOW',
  buttonLink = '#',
  textPosition = 'bottom-left',
  textAlign = 'text-left',
  smallTitle = false,
  showBrandCarousel = false,
}: HeroBannerProps) {
  // Adjust positioning to account for brand carousel
  let positionClasses = showBrandCarousel
    ? 'bottom-20 left-8 right-8 md:left-12 md:right-auto md:bottom-24'
    : 'bottom-8 left-8 right-8 md:left-12 md:right-auto';

  if (textPosition === 'bottom-center') {
    positionClasses = showBrandCarousel
      ? 'bottom-20 left-8 right-8 text-center md:bottom-24'
      : 'bottom-8 left-8 right-8 text-center';
  }
  if (textPosition === 'center-left') {
    positionClasses =
      'top-1/2 -translate-y-1/2 left-8 right-8 md:left-12 md:right-auto';
  }

  const brands = [
    'STRIKE™',
    'LUXURY',
    'STREETWEAR',
    'PREMIUM',
    'FASHION',
    'DESIGN',
    'QUALITY',
    'STYLE',
    'MODERN',
    'MINIMAL',
  ];

  return (
    <section className="relative bg-gray-100">
      <div className="relative w-full h-[65vh] h-[65dvh] min-h-[400px] md:h-[70vh] md:h-[70dvh] md:min-h-[500px]">
        <Image
          src={image || '/placeholder.svg'}
          alt={title}
          fill
          sizes="100vw"
          priority={true}
          className="object-cover"
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Content positioned above carousel */}
      <div className={`absolute ${positionClasses} ${textAlign} z-10`}>
        <div className="max-w-md inline-block">
          <h1
            className={`${smallTitle ? 'text-display-sm' : 'text-display-md'} mb-2 text-white uppercase drop-shadow-lg font-typewriter font-bold tracking-tight`}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-label-md mb-4 text-white/90 drop-shadow-md font-typewriter font-medium tracking-wider">
              {subtitle}
            </p>
          )}
          <Link href={buttonLink}>
            <Button
              variant="strike"
              size="strike"
              className="shadow-lg !py-3 !px-8 font-typewriter font-bold"
            >
              {buttonText} <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Brand Carousel - Bigger and Better Positioned */}
      {showBrandCarousel && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/75 backdrop-blur-sm py-3 md:py-4 overflow-hidden">
          <div className="flex whitespace-nowrap brand-carousel">
            {[...brands, ...brands].map((brand, index) => (
              <span
                key={index}
                className="inline-block text-white text-sm md:text-base font-bold uppercase tracking-wider mx-8 md:mx-12 lg:mx-16 font-typewriter"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
