import { 
  PromoSection, 
  PromoContent, 
  PromoTitle, 
  PromoDescription, 
  PromoActions, 
  PromoBadge, 
  PromoCountdown, 
  PromoBackground 
} from '@/components/promo';
import {
  DividerSection,
  DividerLine,
  DividerText,
  DividerIcon,
  DividerMarquee,
} from '@/components/divider';
import { Button } from '@/components/ui/button';
import { PromoSaleBanner } from '@/components/promo-sale-banner';
import { FlexibleDivider } from '@/components/flexible-divider';
import { getActivePromos } from '@/config/promos';
import { dividerConfigs } from '@/config/dividers';

export default function PromoComponentsDemo() {
  const activePromos = getActivePromos();

  return (
    <div className="min-h-screen bg-white">
      <div className="py-12">
        <div className="strike-container">
          <h1 className="text-4xl font-typewriter font-bold uppercase mb-8">
            Promo Components Demo
          </h1>
        </div>
      </div>

      {/* Config-based Promos */}
      <section className="space-y-8 mb-16">
        <div className="strike-container">
          <h2 className="text-2xl font-typewriter font-bold uppercase mb-6">
            Config-based Promo Banners
          </h2>
        </div>
        {activePromos.map((promo) => (
          <PromoSaleBanner key={promo.id} config={promo} />
        ))}
      </section>

      {/* Manual Promo Examples */}
      <section className="space-y-8 mb-16">
        <div className="strike-container">
          <h2 className="text-2xl font-typewriter font-bold uppercase mb-6">
            Manual Promo Components
          </h2>
        </div>

        {/* Centered Layout */}
        <PromoSection theme="gradient" size="lg">
          <PromoContent layout="centered">
            <PromoTitle size="xl">FLASH SALE</PromoTitle>
            <PromoDescription size="lg">LIMITED TIME ONLY</PromoDescription>
            <PromoBadge value="50" unit="%" suffix="OFF SITEWIDE" variant="pulsing" />
            <PromoCountdown endDate="2025-01-01" format="timer" variant="timer" />
            <PromoActions align="center">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-black">
                SHOP NOW
              </Button>
            </PromoActions>
          </PromoContent>
          <PromoBackground 
            variant="gradient" 
            gradientFrom="#000000" 
            gradientTo="#333333" 
          />
        </PromoSection>

        {/* Split Layout */}
        <PromoSection theme="inverted" size="default">
          <PromoContent layout="split">
            <div>
              <PromoTitle size="lg" color="black">NEW COLLECTION</PromoTitle>
              <PromoDescription size="lg" color="black">
                SS25 NOW AVAILABLE
              </PromoDescription>
              <PromoActions>
                <Button size="lg">EXPLORE</Button>
                <Button size="lg" variant="outline">LOOKBOOK</Button>
              </PromoActions>
            </div>
            <div className="flex items-center justify-center">
              <PromoBadge 
                value="NEW" 
                unit="" 
                size="lg" 
                color="black"
                className="text-6xl"
              />
            </div>
          </PromoContent>
          <PromoBackground pattern="dots" variant="pattern" />
        </PromoSection>

        {/* Stacked Layout */}
        <PromoSection theme="default" size="sm">
          <PromoContent layout="stacked" container="narrow">
            <PromoTitle size="sm">MEMBERS ONLY</PromoTitle>
            <PromoDescription>EXCLUSIVE ACCESS TO SALES</PromoDescription>
            <PromoActions direction="column">
              <Button size="sm" variant="outline" className="w-full">
                JOIN NOW
              </Button>
            </PromoActions>
          </PromoContent>
          <PromoBackground pattern="grid" />
        </PromoSection>
      </section>

      {/* Divider Examples */}
      <section className="space-y-8">
        <div className="strike-container">
          <h2 className="text-2xl font-typewriter font-bold uppercase mb-6">
            Divider Components
          </h2>
        </div>

        {/* Config-based Dividers */}
        {Object.values(dividerConfigs).map((config) => (
          <FlexibleDivider key={config.id} config={config} />
        ))}

        {/* Manual Divider Examples */}
        <DividerSection theme="gradient" size="lg">
          <DividerMarquee text="STRIKE™" speed="slow" pauseOnHover />
        </DividerSection>

        <DividerSection theme="transparent">
          <div className="flex items-center justify-center">
            <DividerLine variant="dashed" color="primary" spacing="none" className="flex-1" />
            <DividerText text="OR" spacing="tight" color="primary" />
            <DividerLine variant="dashed" color="primary" spacing="none" className="flex-1" />
          </div>
        </DividerSection>

        <DividerSection theme="muted" size="xs">
          <div className="flex items-center justify-center">
            <DividerIcon animation="spin" size="sm" color="muted" />
          </div>
        </DividerSection>

        <DividerSection theme="inverted">
          <div className="flex items-center justify-center gap-4">
            <DividerLine variant="solid" color="black" spacing="none" className="w-16" />
            <DividerText text="END" color="black" size="lg" />
            <DividerLine variant="solid" color="black" spacing="none" className="w-16" />
          </div>
        </DividerSection>
      </section>
    </div>
  );
}