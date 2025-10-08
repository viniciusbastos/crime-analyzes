import React, { useRef } from "react";
import { useTheme } from "../ThemeContext";
import { useChartExport } from "../../hooks/useChartExport";

const CrimeInsights = ({ temporalData }) => {
  const chartRef = useRef(null);
  const { exportChartAsPNG, exportChartAsJPG } = useChartExport();
  const { isDark } = useTheme();

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
          Crime Insights
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => exportChartAsPNG(chartRef, 'crime-insights')}
            className="chart-export-button px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            title="Export as PNG"
          >
            📷 PNG
          </button>
          <button
            onClick={() => exportChartAsJPG(chartRef, 'crime-insights')}
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
                Weekday vs Weekend
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
                    return `${weekdayPercent}% of crimes occur on weekdays vs ${weekendPercent}% on weekends`;
                  } else {
                    return `${weekendPercent}% of crimes occur on weekends vs ${weekdayPercent}% on weekdays`;
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
                Peak Hours
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

                  return `Weekday peak: ${weekdayPeak.hour}:00 (${weekdayPeak.count} crimes) | Weekend peak: ${weekendPeak.hour}:00 (${weekendPeak.count} crimes)`;
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
                Crime Trends Analysis
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
                    return "Insufficient data for trend analysis";

                  const weekdayRate = weekday / 5; // 5 weekdays
                  const weekendRate = weekend / 2; // 2 weekend days
                  const ratio = weekendRate / weekdayRate;

                  if (ratio > 1.2) {
                    return `High weekend activity (${(ratio * 100).toFixed(
                      0
                    )}% more crimes per day on weekends). Consider increased patrols during weekends.`;
                  } else if (ratio < 0.8) {
                    return `Higher weekday activity. Focus security measures on business hours and weekdays.`;
                  } else {
                    return `Balanced crime distribution between weekdays and weekends.`;
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
                Risk Assessment
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
                    return `High risk during late night/early morning hours (${peakHour}:00). Enhanced lighting and patrols recommended after dark.`;
                  } else if (peakHour >= 17 && peakHour <= 21) {
                    return `Evening hours show increased activity. Consider extended business security measures.`;
                  } else if (peakHour >= 8 && peakHour <= 17) {
                    return `Daytime peaks suggest opportunity crimes. Focus on workplace and commercial area security.`;
                  } else {
                    return `Crime patterns vary by time. Monitor all periods for optimal safety.`;
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
                Safety Recommendations
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
                    recommendations.push("Increase weekend security presence");
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
                    recommendations.push(
                      "Enhance evening lighting in high-traffic areas"
                    );
                  }

                  if (weekdayPeak.hour <= 6 || weekendPeak.hour <= 6) {
                    recommendations.push("Improve early morning surveillance");
                  }

                  if (recommendations.length === 0) {
                    recommendations.push("Maintain current security measures");
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
                Crime Pattern Summary
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
                    return "No crime data available for analysis";

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

                  return `Overall, ${weekdayPercent}% of crimes occur on weekdays and ${weekendPercent}% on weekends. Peak activity times are ${weekdayPeak.hour}:00 on weekdays and ${weekendPeak.hour}:00 on weekends. This data helps inform resource allocation and prevention strategies.`;
                })()}
              </p>
            </div>
          </div>
        )}
    </div>
  );
};

export default CrimeInsights;
