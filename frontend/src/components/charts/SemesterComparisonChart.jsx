import React from "react";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "react-i18next";

const SemesterComparisonChart = ({ data }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  if (!data || !data.length) {
    return (
      <div
        className={`rounded-lg shadow p-4 ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } border`}
      >
        <h3
          className={`text-lg font-semibold mb-4 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {t("semester_comparison")}
        </h3>
        <div
          className={`text-center py-8 ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {t("no_semester_comparison_data_available")}
        </div>
      </div>
    );
  }

  // Only the most recent year-over-year comparison
  const latestYear = data
    .map((d) => d.current_year)
    .sort((a, b) => String(b).localeCompare(String(a)))[0];
  const latest = data.filter((d) => d.current_year === latestYear);

  // Group data by semester
  const semesterData = latest.reduce((acc, item) => {
    if (!acc[item.semester]) {
      acc[item.semester] = [];
    }
    acc[item.semester].push(item);
    return acc;
  }, {});

  const getChangeColor = (change) => {
    if (change > 0) return "text-red-600";
    if (change < 0) return "text-green-600";
    return "text-gray-600";
  };

  const getChangeBgColor = (change) => {
    if (change > 0) return isDark ? "bg-red-900" : "bg-red-50";
    if (change < 0) return isDark ? "bg-green-900" : "bg-green-50";
    return isDark ? "bg-gray-700" : "bg-gray-50";
  };

  return (
    <div
      className={`rounded-lg shadow p-4 ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } border`}
    >
      <h3
        className={`text-lg font-semibold mb-4 ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        {t("semester_comparison")}
      </h3>

      {/* Compact semester grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* Semester 1 (Jan-Jun) */}
        {semesterData.S1 && semesterData.S1.length > 0 && (
          <div
            className={`p-3 rounded-lg ${getChangeBgColor(
              semesterData.S1[0].change
            )} border ${isDark ? "border-gray-600" : "border-gray-200"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-sm font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {t("jan_jun")}
              </span>
              <span
                className={`text-lg font-bold ${getChangeColor(
                  semesterData.S1[0].change
                )}`}
              >
                {semesterData.S1[0].change > 0 ? "+" : ""}
                {semesterData.S1[0].change_percent}%
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-center">
                <div
                  className={`text-xs font-medium ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {semesterData.S1[0].current_year}
                </div>
                <div
                  className={`text-xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {semesterData.S1[0].current_count}
                </div>
              </div>

              <div
                className={`text-xs font-medium mx-2 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {t("vs")}
              </div>

              <div className="text-center">
                <div
                  className={`text-xs font-medium ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {semesterData.S1[0].previous_year}
                </div>
                <div
                  className={`text-xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {semesterData.S1[0].previous_count}
                </div>
              </div>
            </div>

            <div
              className={`mt-2 text-xs ${
                isDark ? "text-gray-300" : "text-gray-600"
              } text-center`}
            >
              {Math.abs(semesterData.S1[0].change)}{" "}
              {semesterData.S1[0].change > 0
                ? "↑"
                : semesterData.S1[0].change < 0
                ? "↓"
                : "→"}
            </div>
          </div>
        )}

        {/* Semester 2 (Jul-Dec) */}
        {semesterData.S2 && semesterData.S2.length > 0 && (
          <div
            className={`p-3 rounded-lg ${getChangeBgColor(
              semesterData.S2[0].change
            )} border ${isDark ? "border-gray-600" : "border-gray-200"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-sm font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {t("jul_dec")}
              </span>
              <span
                className={`text-lg font-bold ${getChangeColor(
                  semesterData.S2[0].change
                )}`}
              >
                {semesterData.S2[0].change > 0 ? "+" : ""}
                {semesterData.S2[0].change_percent}%
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-center">
                <div
                  className={`text-xs font-medium ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {semesterData.S2[0].current_year}
                </div>
                <div
                  className={`text-xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {semesterData.S2[0].current_count}
                </div>
              </div>

              <div
                className={`text-xs font-medium mx-2 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {t("vs")}
              </div>

              <div className="text-center">
                <div
                  className={`text-xs font-medium ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {semesterData.S2[0].previous_year}
                </div>
                <div
                  className={`text-xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {semesterData.S2[0].previous_count}
                </div>
              </div>
            </div>

            <div
              className={`mt-2 text-xs ${
                isDark ? "text-gray-300" : "text-gray-600"
              } text-center`}
            >
              {Math.abs(semesterData.S2[0].change)}{" "}
              {semesterData.S2[0].change > 0
                ? "↑"
                : semesterData.S2[0].change < 0
                ? "↓"
                : "→"}
            </div>
          </div>
        )}
      </div>

      {/* Compact summary */}
      <div
        className={`pt-3 border-t ${
          isDark ? "border-gray-600" : "border-gray-200"
        }`}
      >
        <div className="flex justify-between items-center text-sm">
          <span
            className={`font-medium ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {t("total_label")}
          </span>
          <div className="flex gap-4">
            <span className={isDark ? "text-white" : "text-gray-900"}>
              {latest.reduce((sum, d) => sum + d.current_count, 0)} (
              {latest[0]?.current_year || "Current"})
            </span>
            <span
              className={`font-medium ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {t("vs")}
            </span>
            <span className={isDark ? "text-white" : "text-gray-900"}>
              {latest.reduce((sum, d) => sum + d.previous_count, 0)} (
              {latest[0]?.previous_year || "Previous"})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SemesterComparisonChart;
