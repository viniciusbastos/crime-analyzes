import React, { useRef } from "react";
import { useTheme } from "../../hooks/useTheme";
import { useChartExport } from "../../hooks/useChartExport";
import { useTranslation } from "react-i18next";

const CrimeInsights = ({ temporalData }) => {
  const chartRef = useRef(null);
  const { exportChartAsPNG, exportChartAsJPG } = useChartExport();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <div
      ref={chartRef}
      className={`rounded-lg shadow p-6 ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } border`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3
          className={`text-xl font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {t("crime_insights")}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => exportChartAsPNG(chartRef, "crime-insights")}
            className="chart-export-button px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            title="Export as PNG"
          >
            📷 PNG
          </button>
          <button
            onClick={() => exportChartAsJPG(chartRef, "crime-insights")}
            className="chart-export-button px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            title="Export as JPG"
          >
            🖼️ JPG
          </button>
        </div>
      </div>
      {temporalData &&
        Array.isArray(temporalData.weekend_comparison) &&
        temporalData.weekend_comparison.length > 0 && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg ${
                isDark ? "bg-blue-900" : "bg-blue-50"
              }`}
            >
              <h4
                className={`font-semibold ${
                  isDark ? "text-blue-200" : "text-blue-800"
                }`}
              >
                {t("weekday_vs_weekend")}
              </h4>
              <p
                className={`text-sm ${
                  isDark ? "text-blue-300" : "text-blue-600"
                }`}
              >
                {(() => {
                  const weekday =
                    temporalData.weekend_comparison.find(
                      (item) => item.period === "Weekday"
                    )?.count || 0;
                  const weekend =
                    temporalData.weekend_comparison.find(
                      (item) => item.period === "Weekend"
                    )?.count || 0;
                  const total = weekday + weekend;
                  const weekdayPercent =
                    total > 0 ? ((weekday / total) * 100).toFixed(1) : 0;
                  const weekendPercent =
                    total > 0 ? ((weekend / total) * 100).toFixed(1) : 0;

                  if (weekday > weekend) {
                    return t("crimes_on_weekdays_vs_weekends", { weekdayPercent, weekendPercent });
                  } else {
                    return t("crimes_on_weekends_vs_weekdays", { weekendPercent, weekdayPercent });
                  }
                })()}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg ${
                isDark ? "bg-green-900" : "bg-green-50"
              }`}
            >
              <h4
                className={`font-semibold ${
                  isDark ? "text-green-200" : "text-green-800"
                }`}
              >
                {t("peak_hours")}
              </h4>
              <p
                className={`text-sm ${
                  isDark ? "text-green-300" : "text-green-600"
                }`}
              >
                {(() => {
                  const weekdayPeak = temporalData.hourly_weekday?.reduce(
                    (max, hour) => (hour.count > max.count ? hour : max),
                    { hour: 0, count: 0 }
                  );
                  const weekendPeak = temporalData.hourly_weekend?.reduce(
                    (max, hour) => (hour.count > max.count ? hour : max),
                    { hour: 0, count: 0 }
                  );

                  return `${t('weekday_peak')}: ${weekdayPeak.hour}:00 (${weekdayPeak.count} ${t('crimes_label').toLowerCase()}) | ${t('weekend_peak')}: ${weekendPeak.hour}:00 (${weekendPeak.count} ${t('crimes_label').toLowerCase()})`;
                })()}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg ${
                isDark ? "bg-purple-900" : "bg-purple-50"
              }`}
            >
              <h4
                className={`font-semibold ${
                  isDark ? "text-purple-200" : "text-purple-800"
                }`}
              >
                {t("crime_trends_analysis")}
              </h4>
              <p
                className={`text-sm ${
                  isDark ? "text-purple-300" : "text-purple-600"
                }`}
              >
                {(() => {
                  const weekday =
                    temporalData.weekend_comparison.find(
                      (item) => item.period === "Weekday"
                    )?.count || 0;
                  const weekend =
                    temporalData.weekend_comparison.find(
                      (item) => item.period === "Weekend"
                    )?.count || 0;
                  const total = weekday + weekend;

                  if (total === 0)
                    return t("no_crime_data_available_for_analysis");

                  const weekdayRate = weekday / 5; // 5 weekdays
                  const weekendRate = weekend / 2; // 2 weekend days
                  const ratio = weekendRate / weekdayRate;

                  if (ratio > 1.2) {
                    return t("high_weekend_activity", { ratio: (ratio * 100).toFixed(0) });
                  } else if (ratio < 0.8) {
                    return t("higher_weekday_activity");
                  } else {
                    return t("balanced_crime_distribution");
                  }
                })()}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg ${
                isDark ? "bg-orange-900" : "bg-orange-50"
              }`}
            >
              <h4
                className={`font-semibold ${
                  isDark ? "text-orange-200" : "text-orange-800"
                }`}
              >
                {t("risk_assessment")}
              </h4>
              <p
                className={`text-sm ${
                  isDark ? "text-orange-300" : "text-orange-600"
                }`}
              >
                {(() => {
                  const weekdayPeak = temporalData.hourly_weekday?.reduce(
                    (max, hour) => (hour.count > max.count ? hour : max),
                    { hour: 0, count: 0 }
                  );
                  const weekendPeak = temporalData.hourly_weekend?.reduce(
                    (max, hour) => (hour.count > max.count ? hour : max),
                    { hour: 0, count: 0 }
                  );

                  const peakHour = Math.max(weekdayPeak.hour, weekendPeak.hour);

                  if (peakHour >= 22 || peakHour <= 4) {
                    return t("high_risk_late_night", { peakHour });
                  } else if (peakHour >= 17 && peakHour <= 21) {
                    return t("evening_hours_increased_activity");
                  } else if (peakHour >= 8 && peakHour <= 17) {
                    return t("daytime_peaks_opportunity_crimes");
                  } else {
                    return t("crime_patterns_vary");
                  }
                })()}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg ${
                isDark ? "bg-red-900" : "bg-red-50"
              }`}
            >
              <h4
                className={`font-semibold ${
                  isDark ? "text-red-200" : "text-red-800"
                }`}
              >
                {t("safety_recommendations")}
              </h4>
              <ul
                className={`text-sm list-disc list-inside space-y-1 ${
                  isDark ? "text-red-300" : "text-red-600"
                }`}
              >
                {(() => {
                  const recommendations = [];
                  const weekday =
                    temporalData.weekend_comparison.find(
                      (item) => item.period === "Weekday"
                    )?.count || 0;
                  const weekend =
                    temporalData.weekend_comparison.find(
                      (item) => item.period === "Weekend"
                    )?.count || 0;

                  if (weekend > weekday * 0.6) {
                    recommendations.push(t("increase_weekend_security"));
                  }

                  const weekdayPeak = temporalData.hourly_weekday?.reduce(
                    (max, hour) => (hour.count > max.count ? hour : max),
                    { hour: 0, count: 0 }
                  );
                  const weekendPeak = temporalData.hourly_weekend?.reduce(
                    (max, hour) => (hour.count > max.count ? hour : max),
                    { hour: 0, count: 0 }
                  );

                  if (weekdayPeak.hour >= 17 || weekendPeak.hour >= 17) {
                    recommendations.push(t("enhance_evening_lighting"));
                  }

                  if (weekdayPeak.hour <= 6 || weekendPeak.hour <= 6) {
                    recommendations.push(t("improve_early_morning_surveillance"));
                  }

                  if (recommendations.length === 0) {
                    recommendations.push(t("maintain_current_security"));
                  }

                  return recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ));
                })()}
              </ul>
            </div>

            <div
              className={`p-4 rounded-lg ${
                isDark ? "bg-teal-900" : "bg-teal-50"
              }`}
            >
              <h4
                className={`font-semibold ${
                  isDark ? "text-teal-200" : "text-teal-800"
                }`}
              >
                {t("crime_pattern_summary")}
              </h4>
              <p
                className={`text-sm ${
                  isDark ? "text-teal-300" : "text-teal-600"
                }`}
              >
                {(() => {
                  const weekday =
                    temporalData.weekend_comparison.find(
                      (item) => item.period === "Weekday"
                    )?.count || 0;
                  const weekend =
                    temporalData.weekend_comparison.find(
                      (item) => item.period === "Weekend"
                    )?.count || 0;
                  const total = weekday + weekend;

                  if (total === 0)
                    return t("no_crime_data_available_for_analysis");

                  const weekdayPercent = ((weekday / total) * 100).toFixed(1);
                  const weekendPercent = ((weekend / total) * 100).toFixed(1);

                  const weekdayPeak = temporalData.hourly_weekday?.reduce(
                    (max, hour) => (hour.count > max.count ? hour : max),
                    { hour: 0, count: 0 }
                  );
                  const weekendPeak = temporalData.hourly_weekend?.reduce(
                    (max, hour) => (hour.count > max.count ? hour : max),
                    { hour: 0, count: 0 }
                  );

                  return t("overall_crime_distribution", {
                    weekdayPercent,
                    weekendPercent,
                    weekdayPeak: weekdayPeak.hour,
                    weekendPeak: weekendPeak.hour
                  });
                })()}
              </p>
            </div>
          </div>
        )}
    </div>
  );
};

export default CrimeInsights;
