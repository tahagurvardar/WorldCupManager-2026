import { Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const next = language === 'tr' ? 'en' : 'tr';

  return (
    <button className="icon-button" type="button" onClick={() => setLanguage(next)} title={next.toUpperCase()}>
      <Languages size={18} />
      <span>{language.toUpperCase()}</span>
    </button>
  );
}
