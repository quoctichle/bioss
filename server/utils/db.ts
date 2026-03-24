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

  // Fallback to provider chain if no explicit keys are provided.
  // This helps when running locally with standard AWS credentials,
  // or if Vercel actually injects a valid role session later.
  const baseProvider = fromNodeProviderChain();

  const provider = async () => {
    // Nếu có biến do mình tự thêm (như bạn tạo IAM User)
    const accessKeyId = process.env.bio_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.bio_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
    const sessionToken = process.env.bio_AWS_SESSION_TOKEN || process.env.AWS_SESSION_TOKEN;
    
    if (accessKeyId && secretAccessKey) {
      return {
        accessKeyId,
        secretAccessKey,
        sessionToken
      };
    }

    // Nếu không có key cứng, thì dùng provider mặc định dò dẫm trong môi trường.
    try {
      const baseCreds = await baseProvider();
      
      // Nếu có role ARN thì thử assume role
      if (roleArn) {
         const sts = new STSClient({ region, credentials: baseCreds });
         const assumeCmd = new AssumeRoleCommand({
           RoleArn: roleArn,
           RoleSessionName: 'BiossVercelDB',
           DurationSeconds: 900
         });
         
         const assumed = await sts.send(assumeCmd);
         if (assumed.Credentials) {
            return {
              accessKeyId: assumed.Credentials.AccessKeyId!,
              secretAccessKey: assumed.Credentials.SecretAccessKey!,
              sessionToken: assumed.Credentials.SessionToken,
              expiration: assumed.Credentials.Expiration
            };
         }
      }

      return baseCreds;
    } catch(err: any) {
        throw new Error(`Credential Error: Need either bio_AWS_ACCESS_KEY_ID or valid IAM Provider/Role. Detail: ${err.message}`);
    }
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