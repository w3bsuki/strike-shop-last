import { RegionSwitcher, RegionIndicator, RegionPrice } from '@/components/region-switcher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TestRegionPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Multi-Region Test Page</h1>
        <p className="text-muted-foreground">
          Test the multi-region functionality with currency conversion, region detection, and localization.
        </p>
      </div>

      {/* Region Switcher Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Region Switcher Components</CardTitle>
          <CardDescription>
            Different variants of the region switcher for various use cases.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="space-y-2">
              <Badge variant="outline">Default</Badge>
              <RegionSwitcher />
            </div>
            
            <div className="space-y-2">
              <Badge variant="outline">Minimal</Badge>
              <RegionSwitcher variant="minimal" />
            </div>
            
            <div className="space-y-2">
              <Badge variant="outline">Compact</Badge>
              <RegionSwitcher variant="compact" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Region Display */}
      <Card>
        <CardHeader>
          <CardTitle>Current Region Information</CardTitle>
          <CardDescription>
            Display current region settings without interaction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegionIndicator />
        </CardContent>
      </Card>

      {/* Price Conversion Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Price Conversion Examples</CardTitle>
          <CardDescription>
            Test currency conversion with different base currencies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Product A (EUR Base)</h3>
              <RegionPrice
                amount={99.99}
                fromCurrency="EUR"
                showOriginal={true}
              />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Product B (USD Base)</h3>
              <RegionPrice
                amount={149.99}
                fromCurrency="USD"
                showOriginal={true}
              />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Product C (BGN Base)</h3>
              <RegionPrice
                amount={199.99}
                fromCurrency="BGN"
                showOriginal={true}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Region-Specific Features */}
      <Card>
        <CardHeader>
          <CardTitle>Region-Specific Configuration</CardTitle>
          <CardDescription>
            Shows tax handling, shipping zones, and payment methods based on current region.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Tax Configuration</h4>
              <Badge variant="secondary">
                Prices {/* Tax included/excluded will be shown based on region */}
              </Badge>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Available Shipping Zones</h4>
              <div className="flex gap-2 flex-wrap">
                {/* Shipping zones will be populated based on region */}
                <Badge variant="outline">Loading...</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Payment Methods</h4>
              <div className="flex gap-2 flex-wrap">
                {/* Payment methods will be populated based on region */}
                <Badge variant="outline">Loading...</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
          <CardDescription>
            How to test the multi-region functionality.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Automatic Detection Testing</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Clear localStorage (DevTools → Application → Storage)</li>
                <li>Use VPN or browser extension to change location</li>
                <li>Refresh the page and check auto-detection</li>
                <li>Verify correct currency and locale are selected</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Manual Region Switching</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Use the region switcher above to change regions</li>
                <li>Notice prices update automatically</li>
                <li>Check that settings persist on page refresh</li>
                <li>Verify correct business logic (tax, shipping, payments)</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Currency Conversion Testing</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Switch between different currencies</li>
                <li>Check that conversion rates are reasonable</li>
                <li>Test with base prices in different currencies</li>
                <li>Verify loading states work correctly</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}