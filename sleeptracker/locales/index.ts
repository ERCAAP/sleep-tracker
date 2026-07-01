import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

// Import language files
import en from './en.json';
import tr from './tr.json';

/**
 * Sleep Tracker App Internationalization System
 * Supports Turkish and English with automatic language detection
 */

// Create i18n instance
const i18n = new I18n({
  en,
  tr,
});

// Set fallback and pluralization
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

// Language storage key
const LANGUAGE_STORAGE_KEY = 'sleeptracker_language';

/**
 * Initialize the localization system
 */
export async function initializeLocalization(): Promise<void> {
  try {
    // Try to get saved language preference
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    
    if (savedLanguage && ['en', 'tr'].includes(savedLanguage)) {
      i18n.locale = savedLanguage;
    } else {
      // Use device locale or fallback to English
      const deviceLocales = Localization.getLocales();
      const deviceLanguage = deviceLocales[0]?.languageCode;
      
      if (deviceLanguage && ['en', 'tr'].includes(deviceLanguage)) {
        i18n.locale = deviceLanguage;
      } else {
        i18n.locale = 'en';
      }
      
      // Save the detected/default language
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, i18n.locale);
    }
    
    console.log('Localization initialized with locale:', i18n.locale);
  } catch (error) {
    console.error('Failed to initialize localization:', error);
    i18n.locale = 'en'; // Fallback to English
  }
}

/**
 * Change the app language
 */
export async function changeLanguage(languageCode: 'en' | 'tr'): Promise<void> {
  try {
    i18n.locale = languageCode;
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    console.log('Language changed to:', languageCode);
  } catch (error) {
    console.error('Failed to change language:', error);
  }
}

/**
 * Get current language
 */
export function getCurrentLanguage(): string {
  return i18n.locale;
}

/**
 * Check if RTL language
 */
export function isRTL(): boolean {
  // Add RTL languages here if needed in the future
  const rtlLanguages = ['ar', 'he', 'fa'];
  return rtlLanguages.includes(i18n.locale);
}

/**
 * Translate function with type safety
 */
export function t(key: string, options?: any): string {
  return i18n.t(key, options);
}

/**
 * Available languages
 */
export const availableLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
];

export default i18n; 