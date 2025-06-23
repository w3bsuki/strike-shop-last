export default async function ({ container }) {
  const query = container.resolve('query');

  try {
    console.log('🇬🇧 Creating proper GBP region...');

    // Create GBP region with proper structure
    const { data: newRegion } = await query.graph({
      entity: 'region',
      fields: ['id', 'name', 'currency_code'],
      filters: {},
      create: {
        name: 'United Kingdom',
        currency_code: 'gbp',
        automatic_taxes: false,
        payment_providers: [],
        fulfillment_providers: [],
        countries: [],
        metadata: {},
      },
    });

    console.log(
      `✅ Created GBP region: ${newRegion.name} (ID: ${newRegion.id})`
    );

    // Now update the EUR region prices to be proper test prices
    const { data: products } = await query.graph({
      entity: 'product',
      fields: [
        'id',
        'title',
        'handle',
        'variants.id',
        'variants.title',
        'variants.prices.id',
        'variants.prices.amount',
        'variants.prices.currency_code',
        'variants.prices.region_id',
      ],
    });

    // Get EUR region
    const { data: regions } = await query.graph({
      entity: 'region',
      fields: ['id', 'name', 'currency_code'],
    });

    const eurRegion = regions.find((r) => r.currency_code === 'eur');
    const gbpRegion = regions.find((r) => r.currency_code === 'gbp');

    // Define prices
    const priceMap = {
      't-shirt': { gbp: 2500, eur: 3000 }, // £25 / €30
      sweatshirt: { gbp: 4500, eur: 5400 }, // £45 / €54
      sweatpants: { gbp: 4000, eur: 4800 }, // £40 / €48
      shorts: { gbp: 2000, eur: 2400 }, // £20 / €24
      tshirts: { gbp: 3500, eur: 4200 }, // £35 / €42
    };

    let pricesAdded = 0;

    for (const product of products) {
      console.log(`\n📦 ${product.title}`);

      const prices = priceMap[product.handle] || { gbp: 3000, eur: 3600 };

      for (const variant of product.variants) {
        // Add GBP price
        try {
          await query.graph({
            entity: 'price',
            fields: ['id'],
            filters: {},
            create: {
              amount: prices.gbp,
              currency_code: 'gbp',
              variant_id: variant.id,
              region_id: gbpRegion.id,
            },
          });

          console.log(
            `   ✅ ${variant.title}: £${(prices.gbp / 100).toFixed(2)}`
          );
          pricesAdded++;
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.log(`   ❌ GBP price error: ${error.message}`);
          }
        }
      }
    }

    console.log(`\n🎉 Setup complete! Added ${pricesAdded} GBP prices`);
    console.log(`\n🔧 Add this to your .env.local:`);
    console.log(`NEXT_PUBLIC_MEDUSA_REGION_ID=${gbpRegion.id}`);
    console.log(
      `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_29b82d9f59f0a63f3af01b371bbb4213c0f335610e50c3b9db479d3cea8247ae`
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}
