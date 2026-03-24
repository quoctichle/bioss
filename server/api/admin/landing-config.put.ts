import { readBody } from 'h3';

import { writeLandingConfig } from '../../utils/landing-config';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  return await writeLandingConfig(body);
});