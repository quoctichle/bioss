import { readBody } from 'h3';

import { saveFlagDataUrl } from '../../utils/landing-config';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const fileUrl = await saveFlagDataUrl(body?.dataUrl, body?.previousUrl);

  return { fileUrl };
});
