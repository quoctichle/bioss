import { Signer } from '@aws-sdk/rds-signer';
import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

let pool: pg.Pool | undefined;
let signer: Signer | undefined;

export async function getClient() {
  if (pool) {
    return pool;
  }

  // Ensure mapping of Vercel custom prefixed vars to standard AWS SDK vars
  if (process.env.bio_AWS_ROLE_ARN && !process.env.AWS_ROLE_ARN) {
    process.env.AWS_ROLE_ARN = process.env.bio_AWS_ROLE_ARN;
  }
  if (process.env.bio_AWS_REGION && !process.env.AWS_REGION) {
    process.env.AWS_REGION = process.env.bio_AWS_REGION;
  }
  if (process.env.bio_AWS_WEB_IDENTITY_TOKEN_FILE && !process.env.AWS_WEB_IDENTITY_TOKEN_FILE) {
    process.env.AWS_WEB_IDENTITY_TOKEN_FILE = process.env.bio_AWS_WEB_IDENTITY_TOKEN_FILE;
  }

  const region = process.env.bio_AWS_REGION || process.env.AWS_REGION;
  const hostname = process.env.bio_PGHOST;
  const username = process.env.bio_PGUSER;
  const port = parseInt(process.env.bio_PGPORT || '5432', 10);
  const database = process.env.bio_PGDATABASE;

  if (!hostname || !username || !database) {
    console.warn('DB connect: Missing connection credentials (bio_PGHOST, bio_PGUSER, bio_PGDATABASE).');
  }

  signer = new Signer({
    hostname: hostname || 'localhost',
    port: port,
    username: username || 'postgres',
    region: region || 'ap-northeast-1',
  });

  try {
    // Await the token immediately to catch any AWS IAM Auth/Signer exceptions
    const passwordToken = process.env.bio_PGPASSWORD || await signer.getAuthToken();

    pool = new pg.Pool({
      host: hostname,
      port: port,
      user: username,
      database: database,
      password: passwordToken,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
    });

    return pool;
  } catch (signerError: any) {
    console.error('Failed to generate AWS IAM RDS Token:', signerError);
    throw new Error('AWS RDS Signer Error: ' + signerError.message);
  }
}

export async function initDb() {
  try {
    const client = await getClient();
    await client.query(`
      CREATE TABLE IF NOT EXISTS site_config (
        id SERIAL PRIMARY KEY,
        config JSONB NOT NULL
      )
    `);
  } catch (err: any) {
    console.error('initDb error:', err);
    throw err;
  }
}