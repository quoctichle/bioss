import { MongoClient, Db, Collection } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.bio_MONGODB_URI;
const dbName = process.env.MONGODB_DB || process.env.bio_MONGODB_DB || 'bioss';

let cachedClient: MongoClient | undefined;
let cachedDb: Db | undefined;

async function getDb(): Promise<Db> {
  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }

  if (cachedClient && cachedDb) {
    return cachedDb;
  }

  cachedClient = new MongoClient(uri);
  await cachedClient.connect();
  cachedDb = cachedClient.db(dbName);
  return cachedDb;
}

export async function getMongoCollection<T>(name: string): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}
