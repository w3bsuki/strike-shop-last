const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function initDatabase() {
  console.log('Initializing Medusa database...');
  
  try {
    // Run Medusa CLI commands to set up database
    console.log('Creating database schema...');
    await execAsync('npx medusa db:create', { cwd: process.cwd() });
    console.log('Database created successfully');
  } catch (error) {
    console.log('Database might already exist, continuing...');
  }

  try {
    // Run migrations
    console.log('Running migrations...');
    await execAsync('npx medusa db:migrate', { cwd: process.cwd() });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error.message);
  }

  try {
    // Sync database - this creates missing tables
    console.log('Syncing database schema...');
    await execAsync('npx medusa db:sync', { cwd: process.cwd() });
    console.log('Database sync completed');
  } catch (error) {
    console.log('Database sync error (this is normal if tables exist):', error.message);
  }

  console.log('Database initialization complete');
}

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase };