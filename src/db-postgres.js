const { neon } = require('@neondatabase/serverless');

// Use Neon (Vercel's PostgreSQL provider)
const sql = neon(process.env.POSTGRES_URL || process.env.DATABASE_URL);

// Initialize tables
const initTables = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS reflections (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        prompt TEXT NOT NULL,
        answer TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON reflections(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id)`;
    
    console.log('PostgreSQL tables initialized');
  } catch (err) {
    console.error('Error initializing tables:', err);
  }
};

const runAsync = async (query, params = []) => {
  try {
    // For INSERT queries, return the inserted ID
    if (query.trim().toUpperCase().startsWith('INSERT')) {
      // Convert ? to $1, $2, etc for PostgreSQL
      let index = 1;
      const pgQuery = query.replace(/\?/g, () => `$${index++}`) + ' RETURNING id';
      const result = await sql(pgQuery, params);
      return { 
        id: result[0]?.id || null, 
        changes: result.length 
      };
    }
    
    // For other queries (UPDATE, DELETE)
    let index = 1;
    const pgQuery = query.replace(/\?/g, () => `$${index++}`);
    const result = await sql(pgQuery, params);
    return { 
      id: null,
      changes: result.length 
    };
  } catch (err) {
    console.error('Database error:', err);
    throw err;
  }
};

const getAsync = async (query, params = []) => {
  try {
    let index = 1;
    const pgQuery = query.replace(/\?/g, () => `$${index++}`);
    const result = await sql(pgQuery, params);
    return result[0] || null;
  } catch (err) {
    console.error('Database error:', err);
    throw err;
  }
};

const allAsync = async (query, params = []) => {
  try {
    let index = 1;
    const pgQuery = query.replace(/\?/g, () => `$${index++}`);
    const result = await sql(pgQuery, params);
    return result;
  } catch (err) {
    console.error('Database error:', err);
    throw err;
  }
};

// Initialize tables on startup
if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
  initTables().catch(console.error);
}

module.exports = {
  sql,
  runAsync,
  getAsync,
  allAsync,
  initTables
};
