// Quick script to add prices to Medusa products
// Run this in the browser console while logged into admin panel

async function addPricesToProducts() {
  const products = [
    { handle: 't-shirt', price: 2500 }, // $25.00
    { handle: 'sweatpants', price: 4500 }, // $45.00
    { handle: 'sweatshirt', price: 6500 }, // $65.00
    { handle: 'shorts', price: 3500 }, // $35.00
  ];

  console.log('Add prices to your products in the admin panel:');
  console.log('1. Go to Products');
  console.log('2. Click on each product');
  console.log('3. Edit variants and add prices:');
  
  products.forEach(p => {
    console.log(`\n${p.handle}: $${(p.price/100).toFixed(2)} USD / €${(p.price/100 * 0.85).toFixed(2)} EUR`);
  });
  
  console.log('\nOr use the API to update prices programmatically');
}

addPricesToProducts();