import React from 'react';
import { useTheme } from './ThemeContext';
import { useTranslation } from 'react-i18next';

const DashboardHeader = () => {
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'pt-BR' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className={`shadow-sm p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('crime_analysis_dashboard')}
        </h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-md transition-colors ${
              isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={toggleLanguage}
            className={`p-2 rounded-md transition-colors ${
              isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Change language"
          >
            {i18n.language.toUpperCase()}
          </button>
          <a
            href="/data"
            className={`px-4 py-2 rounded-md transition-colors ${
              isDark
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {t('data')}
          </a>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;