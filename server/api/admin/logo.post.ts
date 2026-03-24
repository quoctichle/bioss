import { readBody } from 'h3';

import { saveLogoDataUrl } from '../../utils/landing-config';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const logoUrl = await saveLogoDataUrl(body?.dataUrl, body?.previousLogoUrl);

  return { logoUrl };
});