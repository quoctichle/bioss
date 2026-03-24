import { readLandingConfig } from '../utils/landing-config';

export default defineEventHandler(async () => {
  return await readLandingConfig();
});