import { GraphQLClient } from 'graphql-request';

// Direct test of Shopify GraphQL endpoint
const domain = 'strike2x.myshopify.com';
const token = '8674e01617d65ef9adca861da183b232';
const endpoint = `https://${domain}/api/2024-10/graphql.json`;

console.log('=== Direct Shopify GraphQL Test ===');
console.log('Domain:', domain);
console.log('Token:', token.substring(0, 8) + '...');
console.log('Endpoint:', endpoint);

const client = new GraphQLClient(endpoint, {
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': token,
    'Accept': 'application/json',
  },
});

const query = `
  query {
    products(first: 10) {
      edges {
        node {
          id
          title
          handle
          availableForSale
          publishedAt
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 5) {
            edges {
              node {
                id
                title
                availableForSale
                quantityAvailable
              }
            }
          }
        }
      }
    }
  }
`;

try {
  console.log('\nFetching products...');
  const data = await client.request(query);
  
  console.log('\n✅ GraphQL Response:');
  console.log(JSON.stringify(data, null, 2));
  
  if (data.products.edges.length === 0) {
    console.log('\n⚠️  No products found! Possible reasons:');
    console.log('1. Products are not published to the Online Store sales channel');
    console.log('2. Products are in draft status');
    console.log('3. Products are archived');
    console.log('4. Store has no products yet');
  } else {
    console.log(`\n✅ Found ${data.products.edges.length} products`);
    data.products.edges.forEach((edge, i) => {
      const product = edge.node;
      console.log(`\nProduct ${i + 1}:`);
      console.log(`- Title: ${product.title}`);
      console.log(`- Handle: ${product.handle}`);
      console.log(`- Available: ${product.availableForSale}`);
      console.log(`- Published: ${product.publishedAt}`);
      console.log(`- Variants: ${product.variants.edges.length}`);
    });
  }
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
  if (error.response) {
    console.error('Response:', error.response);
  }
}