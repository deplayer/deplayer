const SUPPORTED_LANGUAGES = ['en', 'ca', 'es'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

class LanguageDetector {
  static getPreferredLanguage(): SupportedLanguage {
    // Try to get language from navigator
    const browserLangs = navigator.languages || [navigator.language];
    
    // Find first matching supported language
    for (const lang of browserLangs) {
      const baseLang = lang.split('-')[0].toLowerCase();
      if (SUPPORTED_LANGUAGES.includes(baseLang as SupportedLanguage)) {
        return baseLang as SupportedLanguage;
      }
    }

    // Default to English if no match
    return 'en';
  }

  static getSupportedLanguages(): typeof SUPPORTED_LANGUAGES {
    return SUPPORTED_LANGUAGES;
  }
}

export default LanguageDetector; 