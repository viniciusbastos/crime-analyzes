import React from "react";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "react-i18next";

const ExportPanel = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format) => {
    try {
      const response = await fetch(`/api/export?format=${format}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(t('export_failed'));
      }

      if (format === "json") {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        downloadBlob(blob, "crime_data.json");
      } else {
        const blob = await response.blob();
        downloadBlob(blob, `crime_data.${format}`);
      }
    } catch (error) {
      console.error("Export error:", error);
      alert(t('export_failed'));
    }
  };

  return (
    <div className={`rounded-lg shadow p-6 ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border`}>
      <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {t('export_data')}
      </h3>
      <div className="space-y-2">
        <button
          onClick={() => handleExport("json")}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          {t('export_json')}
        </button>
        <button
          onClick={() => handleExport("csv")}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          {t('export_csv')}
        </button>
        <button
          onClick={() => handleExport("excel")}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          {t('export_excel')}
        </button>
      </div>
    </div>
  );
};

export default ExportPanel;
