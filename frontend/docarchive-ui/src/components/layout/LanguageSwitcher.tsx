import { Button } from 'antd';
import { useSettingsStore } from '../../store/settingsStore';
import i18n from '../../i18n';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useSettingsStore();

  const toggle = () => {
    const next = language === 'ar' ? 'en' : 'ar';
    setLanguage(next);
    i18n.changeLanguage(next);
  };

  return (
    <Button type="text" onClick={toggle} style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 600 }}>
      {language === 'ar' ? 'English' : 'عربي'}
    </Button>
  );
}
