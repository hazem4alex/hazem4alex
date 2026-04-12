import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import arEG from 'antd/locale/ar_EG';
import enUS from 'antd/locale/en_US';
import App from './App';
import './i18n';
import { useSettingsStore } from './store/settingsStore';

function Root() {
  const language = useSettingsStore((s) => s.language);

  React.useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  return (
    <ConfigProvider
      direction={language === 'ar' ? 'rtl' : 'ltr'}
      locale={language === 'ar' ? arEG : enUS}
      theme={{
        token: {
          fontFamily: "'Cairo', -apple-system, BlinkMacSystemFont, sans-serif",
          colorPrimary: '#1677ff',
          borderRadius: 8,
        },
      }}
    >
      <App />
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
