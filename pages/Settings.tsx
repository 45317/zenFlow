
import React, { useState } from 'react';
import { ProductivityState, AppLanguage, AppTheme } from '../types';
import { Globe, Shield, User, Bell, ChevronRight, Check, Search, Moon, Sun, Palette } from 'lucide-react';
import { t } from '../utils/translations.ts';

const SettingsPage: React.FC<{ 
  state: ProductivityState, 
  updateState: (updater: (prev: ProductivityState) => ProductivityState) => void 
}> = ({ state, updateState }) => {
  const currentLang = state.language || 'en';
  const currentTheme = state.theme || 'light';
  const [langSearch, setLangSearch] = useState('');

  const languages: { code: AppLanguage, label: string, flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'jp', label: '日本語', flag: '🇯🇵' },
    { code: 'zh', label: '中文 (简体)', flag: '🇨🇳' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl', label: 'Polski', flag: '🇵🇱' },
    { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
    { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'th', label: 'ไทย', flag: '🇹🇭' },
    { code: 'he', label: 'עברית', flag: '🇮🇱' },
    { code: 'el', label: 'Ελληνικά', flag: '🇬🇷' },
    { code: 'fa', label: 'فارسی', flag: '🇮🇷' },
    { code: 'ur', label: 'اردو', flag: '🇵🇰' },
    { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
    { code: 'uk', label: 'Українська', flag: '🇺🇦' },
    { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
    { code: 'da', label: 'Dansk', flag: '🇩🇰' },
    { code: 'fi', label: 'Suomi', flag: '🇫🇮' },
    { code: 'no', label: 'Norsk', flag: '🇳🇴' },
    { code: 'hu', label: 'Magyar', flag: '🇭🇺' },
    { code: 'ro', label: 'Română', flag: '🇷🇴' },
    { code: 'ms', label: 'Bahasa Melayu', flag: '🇲🇾' },
    { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
    { code: 'az', label: 'Azərbaycanca', flag: '🇦🇿' },
    { code: 'hr', label: 'Hrvatski', flag: '🇭🇷' },
    { code: 'sk', label: 'Slovenčina', flag: '🇸🇰' },
    { code: 'sl', label: 'Slovenščina', flag: '🇸🇮' },
    { code: 'et', label: 'Eesti', flag: '🇪🇪' },
    { code: 'lv', label: 'Latviešu', flag: '🇱🇻' },
    { code: 'lt', label: 'Lietuvių', flag: '🇱🇹' },
    { code: 'sq', label: 'Shqip', flag: '🇦🇱' },
    { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
    { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
    { code: 'gu', label: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', label: 'മലയാളം', flag: '🇮🇳' },
    { code: 'pa', label: 'ਪੰਜਾਬِي', flag: '🇮🇳' },
  ];

  const filteredLangs = languages.filter(l => 
    l.label.toLowerCase().includes(langSearch.toLowerCase()) || 
    l.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  const handleLanguageChange = (code: AppLanguage) => {
    updateState(prev => ({ ...prev, language: code }));
  };

  const handleThemeChange = (theme: AppTheme) => {
    updateState(prev => ({ ...prev, theme }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t('settings', currentLang)}</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium">{t('settingsSubtitle', currentLang)}</p>
      </header>

      <div className="grid gap-8">
        {/* Appearance Section */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Palette size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Appearance</h3>
              <p className="text-sm text-slate-500 dark:text-slate-500">Choose your preferred workspace theme.</p>
            </div>
          </div>
          
          <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/20 dark:bg-slate-950/20">
            <button
              onClick={() => handleThemeChange('light')}
              className={`flex items-center gap-4 p-6 rounded-3xl border-2 transition-all ${
                currentTheme === 'light' 
                  ? 'border-indigo-600 bg-white dark:bg-slate-800 ring-4 ring-indigo-500/5' 
                  : 'border-transparent bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 shadow-sm'
              }`}
            >
              <div className={`p-3 rounded-2xl ${currentTheme === 'light' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                <Sun size={24} />
              </div>
              <div className="flex-1 text-left">
                <p className={`font-bold ${currentTheme === 'light' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>Light Mode</p>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-black">Clean & Bright</p>
              </div>
              {currentTheme === 'light' && <Check size={20} className="text-indigo-600 dark:text-indigo-400" />}
            </button>

            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex items-center gap-4 p-6 rounded-3xl border-2 transition-all ${
                currentTheme === 'dark' 
                  ? 'border-indigo-600 bg-white dark:bg-slate-800 ring-4 ring-indigo-500/5' 
                  : 'border-transparent bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 shadow-sm'
              }`}
            >
              <div className={`p-3 rounded-2xl ${currentTheme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                <Moon size={24} />
              </div>
              <div className="flex-1 text-left">
                <p className={`font-bold ${currentTheme === 'dark' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>Dark Mode</p>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-black">Deep & Focused</p>
              </div>
              {currentTheme === 'dark' && <Check size={20} className="text-indigo-600 dark:text-indigo-400" />}
            </button>
          </div>
        </section>

        {/* Language Section */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Globe size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('language', currentLang)}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-500">{t('selectLanguage', currentLang)}</p>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder={t('searchLanguages', currentLang)}
                value={langSearch}
                onChange={e => setLangSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-full sm:w-64"
              />
            </div>
          </div>
          
          <div className="p-6 max-h-[400px] overflow-y-auto scrollbar-hide grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-50/20 dark:bg-slate-950/20">
            {filteredLangs.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  currentLang === lang.code 
                    ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-500/5 ring-4 ring-indigo-500/5' 
                    : 'border-transparent bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{lang.flag}</span>
                  <span className={`text-sm font-bold truncate ${currentLang === lang.code ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}>
                    {lang.label}
                  </span>
                </div>
                {currentLang === lang.code && <Check size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
              </button>
            ))}
          </div>
        </section>

        {/* Other Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SettingsCard 
            icon={<User size={20} />} 
            title={t('profileLabel', currentLang)} 
            description={t('profileDescription', currentLang)} 
          />
          <SettingsCard 
            icon={<Bell size={20} />} 
            title={t('notificationsLabel', currentLang)} 
            description={t('notificationsDescription', currentLang)} 
          />
          <SettingsCard 
            icon={<Shield size={20} />} 
            title={t('privacyLabel', currentLang)} 
            description={t('privacyDescription', currentLang)} 
          />
          <SettingsCard 
            icon={<Globe size={20} />} 
            title={t('regionalLabel', currentLang)} 
            description={t('regionalDescription', currentLang)} 
          />
        </div>
      </div>
    </div>
  );
};

const SettingsCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
  <button className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] hover:shadow-md transition-all group text-left">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-slate-800 dark:text-slate-100">{title}</h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-500 truncate max-w-[120px]">{description}</p>
      </div>
    </div>
    <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
  </button>
);

export default SettingsPage;
