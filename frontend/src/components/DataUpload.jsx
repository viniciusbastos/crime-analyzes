import React from "react";
import { useTheme } from "./ThemeContext";

const DataUpload = ({ onUpload, uploadStatus }) => {
  const { isDark } = useTheme();
  const handleFileUpload = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    const fileInput = event.target.querySelector('input[type="file"]');

    if (!fileInput || !fileInput.files[0]) {
      onUpload("Please select a file", "error");
      return;
    }

    formData.append("file", fileInput.files[0]);
    onUpload("Uploading and processing...", "loading");

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        onUpload(result.message, "success");
        // Reload data after successful upload
        setTimeout(() => window.location.reload(), 1000);
      } else {
        onUpload(result.error || "Upload failed", "error");
      }
    } catch {
      onUpload("Network error occurred", "error");
    }
  };

  return (
    <div className={`rounded-lg shadow p-6 ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border`}>
      <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Upload Crime Data
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
          Upload and Process
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
