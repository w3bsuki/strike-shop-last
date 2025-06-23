/**
 * SectionHeader Component Examples
 * 
 * This file demonstrates the usage of the SectionHeader component
 * which provides perfect headline/CTA alignment for all homepage sections.
 */

import { SectionHeader } from './section-header';

export function SectionHeaderExamples() {
  return (
    <div className="space-y-12 p-8">
      {/* Default variant with CTA */}
      <div>
        <h3 className="mb-4 text-lg font-bold">Default with CTA</h3>
        <SectionHeader 
          title="NEW ARRIVALS"
          ctaText="VIEW ALL"
          ctaHref="/new"
        />
        <div className="h-20 bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-500">
          Product content would go here
        </div>
      </div>

      {/* Compact variant without CTA */}
      <div>
        <h3 className="mb-4 text-lg font-bold">Compact without CTA</h3>
        <SectionHeader 
          title="CUSTOMER REVIEWS"
          variant="compact"
          showCta={false}
        />
        <div className="h-20 bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-500">
          Reviews content would go here
        </div>
      </div>

      {/* Large variant with custom CTA text */}
      <div>
        <h3 className="mb-4 text-lg font-bold">Large with Custom CTA</h3>
        <SectionHeader 
          title="SHOP BY CATEGORY"
          ctaText="SHOP ALL"
          ctaHref="/categories"
          variant="large"
        />
        <div className="h-20 bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-500">
          Categories content would go here
        </div>
      </div>

      {/* With custom styling */}
      <div>
        <h3 className="mb-4 text-lg font-bold">With Custom Styling</h3>
        <SectionHeader 
          title="COMMUNITY STYLE"
          showCta={false}
          className="mb-2"
        />
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-typewriter mb-6">
          Real customers, real style. Tag us @strike for a chance to be featured
        </p>
        <div className="h-20 bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-500">
          Community content would go here
        </div>
      </div>
    </div>
  );
}

export default SectionHeaderExamples;