import {
  PromoSection,
  PromoContent,
  PromoTitle,
  PromoDescription,
  PromoCountdown,
  PromoBadge,
  PromoBackground,
} from '@/components/promo';

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
    <PromoSection href={link} theme="default" size="default" className="group cursor-pointer">
      <PromoContent layout="default">
        {/* Left: Text Content */}
        <div>
          <PromoTitle size="default" color="white">
            {title}
          </PromoTitle>
          <PromoDescription size="default" opacity="default" color="white">
            {subtitle}
          </PromoDescription>
          {endDate && (
            <PromoCountdown
              endDate={endDate}
              format="custom"
              variant="default"
              color="white"
            />
          )}
        </div>
        
        {/* Right: Massive Discount */}
        <PromoBadge
          value={discount}
          unit="%"
          suffix="OFF EVERYTHING"
          size="default"
          variant="animated"
          color="white"
        />
      </PromoContent>
      
      {/* Background Pattern */}
      <PromoBackground pattern="stripes" variant="pattern" />
    </PromoSection>
  );
}