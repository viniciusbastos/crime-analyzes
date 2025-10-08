import React from "react";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { useLastUpload } from "../hooks/useCrimeData";

const DashboardHeader = () => {
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();
  const { data: lastUpload, isLoading: isLoadingLastUpload } = useLastUpload();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "pt-BR" : "en";
    i18n.changeLanguage(newLang);
  };

  const formatLastUpdate = (uploadTime) => {
    if (!uploadTime) return t("no_data_available");

    try {
      const date = new Date(uploadTime);
      return date.toLocaleString(i18n.language, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return t("invalid_date");
    }
  };

  return (
    <header
      className={`shadow-sm p-6 ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } border-b`}
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1
            className={`text-3xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {t("crime_analysis_dashboard")}
          </h1>
          <p
            className={`text-sm mt-1 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {isLoadingLastUpload
              ? t("loading") + "..."
              : lastUpload?.upload_time
              ? `${t("last_update")}: ${formatLastUpdate(
                  lastUpload.upload_time
                )}`
              : t("no_uploads_yet")}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-md transition-colors ${
              isDark
                ? "text-gray-400 hover:text-white hover:bg-gray-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
            title={
              isDark ? t("switch_to_light_mode") : t("switch_to_dark_mode")
            }
          >
            {isDark ? "☀️" : "🌙"}
          </button>
          <button
            onClick={toggleLanguage}
            className={`p-2 rounded-md transition-colors ${
              isDark
                ? "text-gray-400 hover:text-white hover:bg-gray-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
            title={t("change_language")}
          >
            {i18n.language.toUpperCase()}
          </button>
          <a
            href="/data"
            className={`px-4 py-2 rounded-md transition-colors ${
              isDark
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {t("data")}
          </a>
          <button
            onClick={logout}
            className={`px-4 py-2 rounded-md transition-colors ${
              isDark
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {t("logout")}
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
