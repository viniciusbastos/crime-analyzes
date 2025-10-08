import React, { useState } from 'react';
import { useTheme } from './ThemeContext';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ activeSection, onSectionChange }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false); // Start expanded
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: '📊' },
    { id: 'statistics', label: t('statistics'), icon: '📈' },
    { id: 'map', label: t('crime_map'), icon: '🗺️' },
    { id: 'charts', label: t('charts'), icon: '📊' },
    { id: 'chat', label: 'AI Assistant', icon: '🤖' },
    { id: 'filters', label: t('filters'), icon: '🔍' },
    { id: 'upload', label: t('data_upload'), icon: '📤' },
    { id: 'export', label: t('export'), icon: '📥' },
    { id: 'crimes', label: 'Crime Records', icon: '📋' },
    { id: 'cache', label: 'Cache Status', icon: '🚀' },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className={`p-2 rounded-md shadow-lg transition-colors ${
            isDark
              ? 'bg-gray-800 text-white border border-gray-700'
              : 'bg-white text-gray-900 border border-gray-200'
          }`}
        >
          {isMobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        h-full transition-all duration-300 ease-in-out shadow-xl
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        border-r
        fixed lg:relative z-40
        ${isMobileOpen ? 'left-0' : '-left-64 lg:left-0'}
      `}>
      {/* Header */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
        {!isCollapsed && (
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('navigation')}
          </h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-md transition-colors ${
            isDark
              ? 'text-gray-400 hover:text-white hover:bg-gray-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center p-3 rounded-md transition-all duration-200 ${
                  activeSection === item.id
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-100 text-blue-900'
                    : isDark
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        {!isCollapsed && (
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('crime_analysis_version')}
          </div>
        )}
      </div>
      </div>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;