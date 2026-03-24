import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { createDefaultLandingConfig, normalizeLandingConfig, type LandingConfig } from '../../shared/landing';
import { getClient, initDb } from './db';

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
const dataDir = path.join(process.cwd(), 'server', 'data');
const configPath = path.join(dataDir, 'landing-config.json');

// Biến lưu trạng thái fallback để tránh spam kết nối lỗi nhiều lần dưới local
let useLocalFallback = false;

async function ensureConfigFile() {
  await mkdir(dataDir, { recursive: true });
  try {
    await stat(configPath);
  } catch {
    await writeFile(configPath, JSON.stringify(createDefaultLandingConfig(), null, 2), 'utf8');
  }
}

export async function readLandingConfig(): Promise<LandingConfig> {
  try {
    if (useLocalFallback) throw new Error('Local fallback active');
    
    await initDb();
    const client = await getClient();
    const queryResult = await client.query('SELECT config FROM site_config WHERE id = 1');

    if (queryResult.rows.length === 0) {
      const defaultConfig = createDefaultLandingConfig();
      await client.query('INSERT INTO site_config (id, config) VALUES (1, $1)', [defaultConfig]);
      return normalizeLandingConfig(defaultConfig);
    }

    return normalizeLandingConfig(queryResult.rows[0].config);
  } catch (error: any) {
    if (!useLocalFallback) {
      console.warn('DB connection failed, falling back to local JSON.', error?.message || '');
      useLocalFallback = true;
    }
    
    // Đọc từ file JSON nếu DB lỗi hoặc đang ở dưới máy tính cá nhân
    await ensureConfigFile();
    const raw = await readFile(configPath, 'utf8');
    return normalizeLandingConfig(JSON.parse(raw));
  }
}

export async function writeLandingConfig(config: unknown): Promise<LandingConfig> {
  const normalized = normalizeLandingConfig(config);

  try {
    if (useLocalFallback) throw new Error('Local fallback active');

    await initDb();
    const client = await getClient();
    const queryResult = await client.query('SELECT id FROM site_config WHERE id = 1');

    if (queryResult.rows.length === 0) {
      await client.query('INSERT INTO site_config (id, config) VALUES (1, $1)', [normalized]);
    } else {
      await client.query('UPDATE site_config SET config = $1 WHERE id = 1', [normalized]);
    }
  } catch (error) {
    // Lưu vào file JSON nếu đang ở Local
    useLocalFallback = true;
    await ensureConfigFile();
    await writeFile(configPath, JSON.stringify(normalized, null, 2), 'utf8');
  }

  return normalized;
}

function extensionFromMime(mimeType: string): string {
  if (mimeType === 'image/jpeg') {
    return 'jpg';
  }

  if (mimeType === 'image/svg+xml') {
    return 'svg';
  }

  if (mimeType === 'image/png' || mimeType === 'image/webp') {
    return mimeType.split('/')[1];
  }

  throw createError({ statusCode: 400, statusMessage: 'Định dạng logo/icon không được hỗ trợ.' });
}

function toPublicFilePath(fileUrl: string): string | null {
  if (!fileUrl.startsWith('/uploads/')) {
    return null;
  }

  const safeName = path.basename(fileUrl);
  return path.join(uploadsDir, safeName);
}

export async function saveLogoDataUrl(dataUrl: unknown, previousLogoUrl?: string): Promise<string> {
  if (typeof dataUrl !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Dữ liệu logo không hợp lệ.' });
  }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    throw createError({ statusCode: 400, statusMessage: 'Logo phải là ảnh PNG, JPG, WEBP hoặc SVG.' });
  }

  const mimeType = match[1];
  const base64 = match[2];
  const extension = extensionFromMime(mimeType);
  const buffer = Buffer.from(base64, 'base64');

  if (buffer.byteLength > 4 * 1024 * 1024) {
    throw createError({ statusCode: 413, statusMessage: 'Logo vượt quá giới hạn 4MB.' });
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
    throw createError({ statusCode: 400, statusMessage: 'Dữ liệu cờ không hợp lệ.' });
  }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    throw createError({ statusCode: 400, statusMessage: 'Cờ phải là ảnh PNG, JPG, WEBP hoặc SVG.' });
  }

  const mimeType = match[1];
  const base64 = match[2];
  const extension = extensionFromMime(mimeType);
  const buffer = Buffer.from(base64, 'base64');

  if (buffer.byteLength > 2 * 1024 * 1024) {
    throw createError({ statusCode: 413, statusMessage: 'Cờ vượt quá giới hạn 2MB.' });
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
