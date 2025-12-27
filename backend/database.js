const { Pool } = require("pg");

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "lisah_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgrespw",
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize database tables
async function initializeDatabase() {
  try {
    const client = await pool.connect();

    // Create table if it doesn't exist
    await client.query(`
            CREATE TABLE IF NOT EXISTS early_access_submissions (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                holds_assets VARCHAR(10) NOT NULL,
                consent VARCHAR(10) NOT NULL,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                email_sent BOOLEAN DEFAULT FALSE,
                email_sent_at TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_email ON early_access_submissions(email);
            CREATE INDEX IF NOT EXISTS idx_submitted_at ON early_access_submissions(submitted_at);
        `);

    console.log("Database initialized successfully");
    client.release();
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

module.exports = { pool, initializeDatabase };
