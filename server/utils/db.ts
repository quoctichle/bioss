import { Signer } from '@aws-sdk/rds-signer';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

let pool: pg.Pool | undefined;
let signer: Signer | undefined;

export async function getClient() {
  if (pool) {
    return pool;
  }

  const region = process.env.bio_AWS_REGION || process.env.AWS_REGION || 'ap-northeast-1';
  const hostname = process.env.bio_PGHOST;
  const username = process.env.bio_PGUSER;
  const port = parseInt(process.env.bio_PGPORT || '5432', 10);
  const database = process.env.bio_PGDATABASE;
  const roleArn = process.env.bio_AWS_ROLE_ARN;

  if (!hostname || !username || !database) {
    console.warn('DB connect: Missing connection credentials.');
  }

  // Lấy credentials trực tiếp từ biến môi trường của Vercel
  const accessKeyId = process.env.bio_AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.bio_AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.bio_AWS_SESSION_TOKEN; // Có thể có hoặc không

  const provider = async () => {
    if (!accessKeyId || !secretAccessKey) {
       throw new Error("Missing bio_AWS_ACCESS_KEY_ID or bio_AWS_SECRET_ACCESS_KEY in env");
    }
    
    return {
      accessKeyId,
      secretAccessKey,
      sessionToken
    };
  };

  signer = new Signer({
    hostname: hostname || 'localhost',
    port: port,
    username: username || 'postgres',
    region: region,
    credentials: provider,
  });

  try {
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