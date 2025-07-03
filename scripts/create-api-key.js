// Script to create publishable API key via database
const { Client } = require('pg');

async function createAPIKey() {
  const client = new Client({
    connectionString: 'postgresql://postgres.vxvitkusmtukyjrdjhqk:StrikeShop2025@aws-0-eu-central-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if api_key table exists and what's in it
    const result = await client.query(`
      SELECT id, title, token, type, created_at 
      FROM api_key 
      WHERE type = 'publishable'
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log('Existing API keys:', result.rows);

    // If no publishable keys exist, we need to create one
    if (result.rows.length === 0) {
      const newKey = await client.query(`
        INSERT INTO api_key (id, title, token, type, created_at, updated_at)
        VALUES (
          'apk_' || lower(substr(md5(random()::text), 1, 26)),
          'Production Store Key',
          'pk_' || lower(substr(md5(random()::text), 1, 50)),
          'publishable',
          NOW(),
          NOW()
        )
        RETURNING *
      `);
      
      console.log('Created new API key:', newKey.rows[0]);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

createAPIKey();