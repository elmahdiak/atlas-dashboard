import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Automatically creates the table if it does not exist
  await sql`CREATE TABLE IF NOT EXISTS atlas_data (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`;

  // Fetch saved data
  if (req.method === 'GET') {
    try {
      const { rows } = await sql`SELECT value FROM atlas_data WHERE key = 'state' LIMIT 1;`;
      return res.status(200).json(rows[0]?.value || null);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Save new data
  if (req.method === 'POST') {
    try {
      const payload = req.body;
      await sql`
        INSERT INTO atlas_data (key, value)
        VALUES ('state', ${JSON.stringify(payload)})
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
      `;
      return res.status(200).json({ status: 'success' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}