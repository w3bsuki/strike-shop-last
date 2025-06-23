import { Truck, Shield, RefreshCw, CreditCard } from 'lucide-react';

const badges = [
  {
    icon: Truck,
    title: 'FREE WORLDWIDE SHIPPING',
    description: 'On all orders',
  },
  {
    icon: Shield,
    title: 'SECURE PAYMENT',
    description: '100% secure transactions',
  },
  {
    icon: RefreshCw,
    title: '30 DAY RETURNS',
    description: 'Easy returns policy',
  },
  {
    icon: CreditCard,
    title: 'PAYMENT OPTIONS',
    description: 'Multiple payment methods',
  },
];

export default function TrustBadges() {
  return (
    <section className="py-6 md:py-12 bg-black border-t border-b border-gray-200">
      {/* Desktop Grid Layout */}
      <div className="hidden md:block strike-container">
        <div className="grid grid-cols-4 gap-8">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div key={index} className="text-center">
                <Icon className="w-8 h-8 mx-auto mb-3 stroke-[1.5] text-white" />
                <h3 className="text-xs font-typewriter font-bold uppercase tracking-wider mb-1 text-white">
                  {badge.title}
                </h3>
                <p className="text-xs font-typewriter text-white/60">
                  {badge.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Mobile Compact Layout */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-2">
          {badges.slice(0, 2).map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div key={index} className="flex items-center gap-2">
                <Icon className="w-5 h-5 stroke-[1.5] text-white" />
                <div>
                  <h3 className="text-[10px] font-typewriter font-bold uppercase tracking-wider leading-tight text-white">
                    {badge.title.split(' ').slice(0, 2).join(' ')}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}