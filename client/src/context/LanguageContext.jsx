/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react';
import tr from '../i18n/tr.json';
import en from '../i18n/en.json';

const dictionaries = { tr, en };
const LanguageContext = createContext(null);
const languageKey = 'wcm2026.language';

function resolveKey(dictionary, key) {
  return key.split('.').reduce((value, part) => value?.[part], dictionary);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem(languageKey) || 'tr');

  const value = useMemo(() => {
    const setLanguage = (nextLanguage) => {
      localStorage.setItem(languageKey, nextLanguage);
      setLanguageState(nextLanguage);
    };

    const t = (key, variables = {}) => {
      const raw = resolveKey(dictionaries[language], key) || resolveKey(dictionaries.tr, key) || key;
      return Object.entries(variables).reduce((text, [name, value]) => text.replaceAll(`{{${name}}}`, value), raw);
    };

    const localize = (valueObject) => valueObject?.[language] || valueObject?.tr || valueObject?.en || '';

    return { language, setLanguage, t, localize };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return context;
}
