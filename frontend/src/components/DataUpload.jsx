import React from "react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { useUploadData } from "../hooks/useCrimeData";
import { useTranslation } from "react-i18next";

const DataUpload = ({ onUpload, uploadStatus }) => {
  const { isDark } = useTheme();
  const { role } = useAuth();
  const { t } = useTranslation();
  const uploadMutation = useUploadData();

  if (role !== 'admin') {
    return (
      <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
        <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('upload_crime_data')}
        </h3>
        <p className={`text-red-500 ${isDark ? 'text-red-400' : ''}`}>
          {t('access_denied_admin_role_required')}
        </p>
      </div>
    );
  }
  const handleFileUpload = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    const fileInput = event.target.querySelector('input[type="file"]');

    if (!fileInput || !fileInput.files[0]) {
      onUpload(t('please_select_a_file'), "error");
      return;
    }

    formData.append("file", fileInput.files[0]);
    onUpload(t('uploading_and_processing'), "loading");

    uploadMutation.mutate(formData, {
      onSuccess: (data) => {
        onUpload(data.message, "success");
        setTimeout(() => window.location.reload(), 1000);
      },
      onError: (error) => {
        onUpload(error.response?.data?.error || t('upload_failed'), "error");
      },
    });
  };

  return (
    <div className={`rounded-lg shadow p-6 ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border`}>
      <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {t('upload_crime_data')}
      </h3>
      <form onSubmit={handleFileUpload} className="flex gap-4 items-center">
        <input
          type="file"
          name="file"
          accept=".csv,.xlsx,.xls"
          required
          className={`px-3 py-2 border rounded-md transition-colors ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
              : 'border-gray-300 focus:border-blue-500'
          }`}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          {t('upload_and_process')}
        </button>
      </form>
      {uploadStatus && (
        <div
          className={`mt-4 p-3 rounded-md ${
            uploadStatus.type === "success"
              ? isDark
                ? "bg-green-900 text-green-200"
                : "bg-green-100 text-green-800"
              : uploadStatus.type === "error"
              ? isDark
                ? "bg-red-900 text-red-200"
                : "bg-red-100 text-red-800"
              : isDark
                ? "bg-blue-900 text-blue-200"
                : "bg-blue-100 text-blue-800"
          }`}
        >
          {uploadStatus.message}
        </div>
      )}
    </div>
  );
};

export default DataUpload;
