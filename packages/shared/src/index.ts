export const SUPPORTED_LANGUAGES = ['en', 'fr'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];
