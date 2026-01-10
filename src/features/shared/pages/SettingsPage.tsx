/**
 * Settings Page
 *
 * Allows users to configure global app settings like sound and theme.
 */

import { Volume2, VolumeX, Check, Globe, Loader2 } from 'lucide-react';
import { useGlobalSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../../../infrastructure/i18n';
import type { Language } from '../../../infrastructure/i18n';
import { ConnectionError } from '../components/ConnectionError';

export default function SettingsPage() {
  const { soundEnabled, setSoundEnabled, loading, error } = useGlobalSettings();
  const { language, setLanguage, t } = useLanguage();

  const languages: { id: Language; label: string; flag: string }[] = [
    { id: 'en', label: 'English', flag: '🇺🇸' },
    { id: 'zh', label: '中文', flag: '🇨🇳' },
  ];

  if (loading) {
    return (
      <div className="min-h-full bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#4a7a2a]" />
          <div className="text-gray-600 text-xl">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-white flex items-center justify-center p-4">
        <ConnectionError message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white p-6 pb-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('settings.title')}</h1>

        {/* Language Settings */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Globe className="w-6 h-6 text-[#4a7a2a]" />
            {t('settings.language')}
          </h2>
          <p className="text-gray-600 mb-4">{t('settings.languageDescription')}</p>

          <div className="flex gap-3">
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`flex-1 p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                  language === lang.id
                    ? 'border-[#4a7a2a] bg-[#e8f5e0] ring-2 ring-[#4a7a2a]/30'
                    : 'border-gray-200 bg-white hover:border-[#7dad4c]'
                }`}
              >
                <div className="text-3xl mb-2 text-center">{lang.flag}</div>
                <div className="text-sm font-medium text-gray-700 text-center">{lang.label}</div>
                {language === lang.id && (
                  <div className="flex justify-center mt-2">
                    <Check className="w-5 h-5 text-[#4a7a2a]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Sound Settings */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            {soundEnabled ? (
              <Volume2 className="w-6 h-6 text-[#4a7a2a]" />
            ) : (
              <VolumeX className="w-6 h-6 text-gray-600" />
            )}
            {t('settings.sound')}
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{t('settings.soundDescription')}</span>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                soundEnabled ? 'bg-[#4a7a2a]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  soundEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Version Info */}
        <div className="mt-8 text-center text-gray-600 text-sm">{t('settings.version')}</div>
      </div>
    </div>
  );
}
