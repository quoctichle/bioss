export type LandingIconName =
  | 'shop'
  | 'chat'
  | 'flag'
  | 'building'
  | 'globe'
  | 'star'
  | 'phone'
  | 'spark';

export type LinkTone = 'green' | 'orange';
export type LanguageCode = 'ja' | 'vi' | 'en' | 'mm';

export interface LandingLanguageCopy {
  greenTitle: string;
  orangeSubtitle: string;
  linkLabels: Record<string, string>;
}

export const languageOptions: Array<{ code: LanguageCode; label: string; flag: string }> = [
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'mm', label: 'မြန်မာ', flag: '🇲🇲' },
];

export interface LandingLink {
  id: string;
  label: string;
  url: string;
  icon: LandingIconName | string;
  tone: LinkTone;
  flag1?: string;
  flag2?: string;
}

export interface LandingConfig {
  logoUrl: string;
  greenTitle: string;
  orangeSubtitle: string;
  links: LandingLink[];
  translations: Record<LanguageCode, LandingLanguageCopy>;
  languageFlags: Record<LanguageCode, string>;
}

export const iconOptions: Array<{ value: LandingIconName; label: string }> = [
  { value: 'shop', label: 'Shop' },
  { value: 'chat', label: 'Chat' },
  { value: 'flag', label: 'Flag' },
  { value: 'building', label: 'Building' },
  { value: 'globe', label: 'Globe' },
  { value: 'star', label: 'Star' },
  { value: 'phone', label: 'Phone' },
  { value: 'spark', label: 'Spark' },
];

export const toneOptions: Array<{ value: LinkTone; label: string }> = [
  { value: 'orange', label: 'Cam' },
  { value: 'green', label: 'Xanh lá' },
];

export function createLink(partial?: Partial<LandingLink>): LandingLink {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);

  return {
    id: partial?.id?.trim() || `${timestamp}-${random}`,
    label: partial?.label?.trim() || 'Link mới',
    url: partial?.url?.trim() || '#',
    icon: partial?.icon || 'globe',
    tone: partial?.tone || 'green',
    flag1: partial?.flag1 || '',
    flag2: partial?.flag2 || '',
  };
}

export function createDefaultLanguageFlags(): Record<LanguageCode, string> {
  return languageOptions.reduce<Record<LanguageCode, string>>((acc, language) => {
    acc[language.code] = language.flag;
    return acc;
  }, {});
}

const languageCodes: LanguageCode[] = ['ja', 'vi', 'en', 'mm'];

const heroCopy: Record<LanguageCode, { greenTitle: string; orangeSubtitle: string }> = {
  ja: { greenTitle: 'サンシャインエコシステム', orangeSubtitle: 'SUNSHINE ECOSYSTEM' },
  vi: { greenTitle: 'HỆ SINH THÁI SUNSHINE', orangeSubtitle: 'SUNSHINE ECOSYSTEM' },
  en: { greenTitle: 'SUNSHINE ECOSYSTEM', orangeSubtitle: 'SUNSHINE ECOSYSTEM' },
  mm: { greenTitle: 'SUNSHINE လောက', orangeSubtitle: 'SUNSHINE ECOSYSTEM' },
};

const linkCopy: Record<LanguageCode, string[]> = {
  ja: [
    'TikTokショップ | 今すぐ注文',
    'VN | ベトナム サポート',
    'MM | ミャンマー サポート',
    'エコシステム | サンシャイン グローバル',
    '公式ウェブサイト',
  ],
  vi: [
    'TikTok Shop | Mua ngay',
    'VN | Hỗ trợ Việt Nam',
    'MM | Hỗ trợ Myanmar',
    'Hệ sinh thái | Sunshine Global',
    'Trang chính thức',
  ],
  en: [
    'TikTok Shop | Order Now',
    'VN | Vietnamese Support',
    'MM | Myanmar Support',
    'Ecosystem | Sunshine Global',
    'Official Website',
  ],
  mm: [
    'TikTok ဆိုင် | အမှာစာ ချက်ချင်းပေးမယ်',
    'VN | မြန်မာအတွက် ပံ့ပိုးမှု',
    'MM | မြန်မာ အထောက်အကူ',
    'သဘာဝ အစည်းအဝေး | Sunshine Global',
    'တရားဝင် ဝဘ်ဆိုက်',
  ],
};

function createDefaultTranslations(links: LandingLink[]): Record<LanguageCode, LandingLanguageCopy> {
  const translations = {} as Record<LanguageCode, LandingLanguageCopy>;

  languageCodes.forEach((code) => {
    translations[code] = {
      greenTitle: heroCopy[code].greenTitle,
      orangeSubtitle: heroCopy[code].orangeSubtitle,
      linkLabels: links.reduce<Record<string, string>>((acc, link, index) => {
        acc[link.id] = linkCopy[code][index] ?? link.label;
        return acc;
      }, {}),
    };
  });

  return translations;
}

export function createDefaultLandingConfig(): LandingConfig {
  const baseLinks = [
    createLink({ label: 'TikTok Shop | Order Now', url: 'https://www.tiktok.com', icon: '/uploads/flag-1774321205745.png', tone: 'green' }),
    createLink({ label: 'VN | Vietnamese Support', url: '#', icon: '/uploads/flag-1774322009504.png', tone: 'green' }),
    createLink({ label: 'MM | Myanmar Support', url: '#', icon: '/uploads/flag-1774322036142.png', tone: 'green' }),
    createLink({ label: 'Ecosystem | Sunshine Global', url: '#', icon: '/uploads/flag-1774322132237.png', tone: 'green' }),
    createLink({ label: 'Official Website', url: '#', icon: '/uploads/flag-1774322198955.png', tone: 'green' }),
  ];

  return {
    logoUrl: '/uploads/logo-1774257525679.png',
    greenTitle: 'HỆ SINH THÁI SUNSHINE',
    orangeSubtitle: 'SUNSHINE ECOSYSTEM',
    links: baseLinks,
    translations: createDefaultTranslations(baseLinks),
    languageFlags: createDefaultLanguageFlags(),
  };
}

function sanitizeText(value: unknown, fallback: string, maxLength = 120): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const sanitized = value.trim().slice(0, maxLength);

  return sanitized || fallback;
}

function sanitizeUrl(value: unknown): string {
  if (typeof value !== 'string') {
    return '#';
  }

  const sanitized = value.trim().slice(0, 500);

  return sanitized || '#';
}

export function normalizeLandingConfig(input: unknown): LandingConfig {
  const fallback = createDefaultLandingConfig();
  const source = input && typeof input === 'object' ? (input as Partial<LandingConfig>) : {};
  const iconSet = new Set(iconOptions.map((option) => option.value));
  const toneSet = new Set(toneOptions.map((option) => option.value));
  const candidateLinks = Array.isArray(source.links) ? source.links : fallback.links;
  const links = candidateLinks
    .slice(0, 12)
    .map((link) => {
      const sourceLink = link && typeof link === 'object' ? (link as Partial<LandingLink>) : {};
      
      const rawIcon = typeof sourceLink.icon === 'string' ? sourceLink.icon.trim() : 'globe';
      const icon = iconSet.has(rawIcon as LandingIconName) || rawIcon.startsWith('/') || rawIcon.startsWith('http')
        ? rawIcon
        : 'globe';

      const tone = toneSet.has(sourceLink.tone as LinkTone) ? (sourceLink.tone as LinkTone) : 'green';

      return createLink({
        id: sourceLink.id,
        label: sanitizeText(sourceLink.label, 'Link mới', 80),
        url: sanitizeUrl(sourceLink.url),
        icon,
        tone,
        flag1: typeof sourceLink.flag1 === 'string' ? sourceLink.flag1 : '',
        flag2: typeof sourceLink.flag2 === 'string' ? sourceLink.flag2 : '',
      });
    })
    .filter((link) => link.label.length > 0);

  const finalLinks = links.length > 0 ? links : fallback.links;

  return {
    logoUrl: typeof source.logoUrl === 'string' ? source.logoUrl.trim().slice(0, 500) : fallback.logoUrl,
    greenTitle: sanitizeText(source.greenTitle, fallback.greenTitle, 80),
    orangeSubtitle: sanitizeText(source.orangeSubtitle, fallback.orangeSubtitle, 80),
    links: finalLinks,
    translations: buildTranslations(source.translations, fallback.translations, finalLinks),
    languageFlags: buildLanguageFlags(source.languageFlags, fallback.languageFlags),
  };
}

function buildTranslations(
  provided: Record<LanguageCode, LandingLanguageCopy> | undefined,
  fallbackTranslations: Record<LanguageCode, LandingLanguageCopy>,
  links: LandingLink[],
): Record<LanguageCode, LandingLanguageCopy> {
  const translations = {} as Record<LanguageCode, LandingLanguageCopy>;

  languageCodes.forEach((code) => {
    const sourceLang = provided?.[code];
    const defaultLang = fallbackTranslations[code];

    translations[code] = {
      greenTitle: sanitizeText(sourceLang?.greenTitle, defaultLang.greenTitle, 80),
      orangeSubtitle: sanitizeText(sourceLang?.orangeSubtitle, defaultLang.orangeSubtitle, 80),
      linkLabels: links.reduce<Record<string, string>>((acc, link) => {
        const rawLabel = sourceLang?.linkLabels?.[link.id];
        acc[link.id] = typeof rawLabel === 'string' && rawLabel.trim().length > 0
          ? rawLabel.trim()
          : defaultLang.linkLabels[link.id] || link.label;
        return acc;
      }, {}),
    };
  });

  return translations;
}

function buildLanguageFlags(
  provided: Record<LanguageCode, string> | undefined,
  fallbackFlags: Record<LanguageCode, string>,
): Record<LanguageCode, string> {
  const flags = {} as Record<LanguageCode, string>;

  languageCodes.forEach((code) => {
    const customFlag = provided?.[code];
    flags[code] = typeof customFlag === 'string' && customFlag.trim().length > 0
      ? customFlag.trim()
      : fallbackFlags[code];
  });

  return flags;
}