import { Signer } from '@aws-sdk/rds-signer';
import pg from 'pg';

let pool: pg.Pool | undefined;
let signer: Signer | undefined;

const envVars = [
  'bio_AWS_REGION',
  'bio_PGHOST',
  'bio_PGPORT',
  'bio_PGUSER',
  'bio_AWS_ACCOUNT_ID',
];

export async function getClient() {
  if (pool) {
    return pool;
  }

  const region = process.env.bio_AWS_REGION;
  const hostname = process.env.bio_PGHOST;
  const username = process.env.bio_PGUSER;
  const port = parseInt(process.env.bio_PGPORT || '5432', 10);
  const database = process.env.bio_PGDATABASE;

  if (!hostname || !username) {
    if (Object.keys(process.env).some((k) => k.startsWith('bio_'))) {
        throw new Error('Database connection credentials are missing.');
    } else {
        console.warn('DB connect: Local environment mode detected.');
    }
  }

  signer = new Signer({
    hostname: hostname || 'localhost',
    port: port,
    username: username || 'postgres',
    region: region || 'ap-southeast-1',
  });

  const getPassword = async () => {
    return await signer!.getAuthToken();
  };

  pool = new pg.Pool({
    host: hostname,
    port: port,
    user: username,
    database: database,
    password: process.env.bio_PGPASSWORD || getPassword,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
  });

  return pool;
}

export async function initDb() {
  const client = await getClient();
  await client.query(`
    CREATE TABLE IF NOT EXISTS site_config (
      id SERIAL PRIMARY KEY,
      config JSONB NOT NULL
    )
  `);
}