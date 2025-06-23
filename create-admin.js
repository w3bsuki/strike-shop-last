const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function createAdminUser() {
  const client = new Client({
    connectionString: 'postgres://postgres:postgres@localhost:5432/medusa_db',
  });

  try {
    await client.connect();

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Check if admin exists
    const checkResult = await client.query(
      'SELECT id FROM "user" WHERE email = $1',
      ['admin@medusa.com']
    );

    if (checkResult.rows.length > 0) {
      console.log('Admin user already exists');
    } else {
      // Create admin user
      await client.query(
        'INSERT INTO "user" (id, email, role, metadata, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
        [`usr_${Date.now()}`, 'admin@medusa.com', 'admin', {}]
      );

      console.log('Admin user created successfully!');
      console.log('Email: admin@medusa.com');
      console.log('Password: admin123');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

createAdminUser();
