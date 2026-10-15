import { en, type Messages } from './i18n/en';
import { fr } from './i18n/fr';

export const SUPPORTED_LANGUAGES = ['en', 'fr'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export function isLanguage(value: unknown): value is Language {
  return (SUPPORTED_LANGUAGES as readonly unknown[]).includes(value);
}

const MESSAGES: Record<Language, Messages> = { en, fr };

export function getMessages(lang: Language): Messages {
  return MESSAGES[lang];
}

export type { Messages };

export type { Database } from './database.types';
