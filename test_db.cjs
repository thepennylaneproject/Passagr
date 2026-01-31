require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
});

console.log('Connecting to:', process.env.DATABASE_URL?.split('@')[1] || 'URL not found'); // Log host only for safety

client.connect()
  .then(() => {
    console.log('Connected successfully!');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Query success:', res.rows[0]);
    client.end();
  })
  .catch(err => {
    console.error('Connection error:', err);
    client.end();
  });
