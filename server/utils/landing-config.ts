import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createError } from 'h3';

import { createDefaultLandingConfig, normalizeLandingConfig, type LandingConfig } from '../../shared/landing';
import { getMongoCollection } from './mongo';

const dataDir = path.join(process.cwd(), 'server', 'data');
const configPath = path.join(dataDir, 'landing-config.json');
const mongoCollectionName = 'landing_config';
const mongoDocumentId = 'landing-config';
let useLocalFallback = false;

interface LandingConfigDocument {
  _id: string;
  config: LandingConfig;
}

async function ensureConfigFile(): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  try {
    await stat(configPath);
  } catch {
    const defaultConfig = createDefaultLandingConfig();
    await writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
  }
}

async function readConfigFile(): Promise<LandingConfig> {
  await ensureConfigFile();
  const raw = await readFile(configPath, 'utf8');
  return normalizeLandingConfig(JSON.parse(raw));
}

async function writeConfigFile(config: LandingConfig): Promise<void> {
  await ensureConfigFile();
  await writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
}

async function readFromMongo(): Promise<LandingConfig> {
  const collection = await getMongoCollection<LandingConfigDocument>(mongoCollectionName);
  const doc = await collection.findOne({ _id: mongoDocumentId });

  if (doc && doc.config) {
    return normalizeLandingConfig(doc.config);
  }

  const defaultConfig = createDefaultLandingConfig();
  await collection.updateOne(
    { _id: mongoDocumentId },
    { $set: { config: defaultConfig } },
    { upsert: true }
  );

  return normalizeLandingConfig(defaultConfig);
}

async function writeToMongo(config: LandingConfig): Promise<void> {
  const collection = await getMongoCollection<LandingConfigDocument>(mongoCollectionName);
  await collection.updateOne(
    { _id: mongoDocumentId },
    { $set: { config } },
    { upsert: true }
  );
}

export async function readLandingConfig(): Promise<LandingConfig> {
  if (useLocalFallback) {
    return readConfigFile();
  }

  try {
    return await readFromMongo();
  } catch (error: any) {
    console.error('MongoDB read failed:', error);
    useLocalFallback = true;
    return readConfigFile();
  }
}

export async function writeLandingConfig(config: unknown): Promise<LandingConfig> {
  const normalized = normalizeLandingConfig(config);

  if (useLocalFallback) {
    await writeConfigFile(normalized);
    return normalized;
  }

  try {
    await writeToMongo(normalized);
    return normalized;
  } catch (error: any) {
    console.error('MongoDB write failed:', error);
    useLocalFallback = true;
    await writeConfigFile(normalized);
    return normalized;
  }
}

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

function extensionFromMime(mimeType: string): string {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/svg+xml') return 'svg';
  if (mimeType === 'image/png' || mimeType === 'image/webp') return mimeType.split('/')[1];
  throw createError({ statusCode: 400, statusMessage: 'Invalid logo format.' });
}

function toPublicFilePath(fileUrl: string): string | null {
  if (!fileUrl.startsWith('/uploads/')) return null;
  const safeName = path.basename(fileUrl);
  return path.join(uploadsDir, safeName);
}

export async function saveLogoDataUrl(dataUrl: unknown, previousLogoUrl?: string): Promise<string> {
  if (typeof dataUrl !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid data.' });
  }

  if (!dataUrl.startsWith('data:')) {
    // treat as external link, just store and return it
    return dataUrl;
  }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw createError({ statusCode: 400, statusMessage: 'Logo must be PNG, JPG, WEBP, or SVG base64.' });
  }

  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return dataUrl as string;
  }

  const mimeType = match[1];
  const base64 = match[2];
  const extension = extensionFromMime(mimeType);
  const buffer = Buffer.from(base64, 'base64');

  if (buffer.byteLength > 4 * 1024 * 1024) {
    throw createError({ statusCode: 413, statusMessage: 'Logo exceeds 4MB.' });
  }

  await mkdir(uploadsDir, { recursive: true });
  const fileName = `logo-${Date.now()}.${extension}`;
  const filePath = path.join(uploadsDir, fileName);
  await writeFile(filePath, buffer);

  const previousFile = previousLogoUrl ? toPublicFilePath(previousLogoUrl) : null;
  if (previousFile && previousFile !== filePath) {
    await rm(previousFile, { force: true }).catch(() => undefined);
  }

  return `/uploads/${fileName}`;
}

export async function saveFlagDataUrl(dataUrl: unknown, previousFileUrl?: string): Promise<string> {
  if (typeof dataUrl !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid data.' });
  }

  if (!dataUrl.startsWith('data:')) {
    return dataUrl;
  }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw createError({ statusCode: 400, statusMessage: 'Flag must be PNG, JPG, WEBP or SVG base64.' });
  }

  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return dataUrl as string;
  }

  const mimeType = match[1];
  const base64 = match[2];
  const extension = extensionFromMime(mimeType);
  const buffer = Buffer.from(base64, 'base64');

  if (buffer.byteLength > 4 * 1024 * 1024) {
    throw createError({ statusCode: 413, statusMessage: 'Flag exceeds 4MB.' });
  }

  await mkdir(uploadsDir, { recursive: true });
  const fileName = `flag-${Date.now()}.${extension}`;
  const filePath = path.join(uploadsDir, fileName);
  await writeFile(filePath, buffer);

  const previousFile = previousFileUrl ? toPublicFilePath(previousFileUrl) : null;
  if (previousFile && previousFile !== filePath) {
    await rm(previousFile, { force: true }).catch(() => undefined);
  }

  return `/uploads/${fileName}`;
}