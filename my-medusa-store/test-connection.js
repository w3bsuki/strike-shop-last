const { Client } = require('pg');

// Test different connection strings
const connectionStrings = [
  // Pooled connection - Transaction mode (port 6543)
  'postgresql://postgres.vxvitkusmtukyjrdjhqk:941015tyJa7!@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  // Pooled connection - Session mode (port 5432)
  'postgresql://postgres.vxvitkusmtukyjrdjhqk:941015tyJa7!@aws-0-us-west-1.pooler.supabase.com:5432/postgres',
  // Direct connection
  'postgresql://postgres:941015tyJa7!@db.vxvitkusmtukyjrdjhqk.supabase.co:5432/postgres',
];

async function testConnection(connStr, label) {
  console.log(`\nTesting ${label}...`);
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query('SELECT NOW()');
    console.log(`✅ SUCCESS: Connected at ${res.rows[0].now}`);
    await client.end();
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
  }
}

(async () => {
  console.log('Testing Supabase connections...\n');
  
  await testConnection(connectionStrings[0], 'Pooled Transaction Mode (6543)');
  await testConnection(connectionStrings[1], 'Pooled Session Mode (5432)');
  await testConnection(connectionStrings[2], 'Direct Connection');
})();