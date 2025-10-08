import React from "react";
import { Line } from "react-chartjs-2";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "react-i18next";

const CrimeTrendsWeeklyChart = ({ data }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: isDark ? "#e5e7eb" : "#374151",
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: isDark ? "#e5e7eb" : "#374151",
        },
        grid: {
          color: isDark ? "#374151" : "#e5e7eb",
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: isDark ? "#e5e7eb" : "#374151",
        },
        grid: {
          color: isDark ? "#374151" : "#e5e7eb",
        },
      },
    },
  };

  return (
    <div
      className={`rounded-lg shadow p-6 ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } border`}
    >
      <h3
        className={`text-xl font-semibold mb-4 ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        {t("crime_trends_with_moving_averages_weekly")}
      </h3>
      {data && data.weekly_trends && data.weekly_trends.length > 0 && (
        <Line
          data={{
            labels: data.weekly_trends.map((item) => item.date),
            datasets: [
              {
                label: t("actual_crimes"),
                data: data.weekly_trends.map((item) => item.count),
                borderColor: "rgb(75, 192, 192)",
                backgroundColor: "rgba(75, 192, 192, 0.1)",
                tension: 0.1,
              },
              {
                label: t("7_day_ma"),
                data: data.weekly_trends.map((item) => item.ma_7),
                borderColor: "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.1)",
                tension: 0.1,
                borderDash: [5, 5],
              },
              {
                label: t("15_day_ma"),
                data: data.weekly_trends.map((item) => item.ma_15),
                borderColor: "rgb(255, 205, 86)",
                backgroundColor: "rgba(255, 205, 86, 0.1)",
                tension: 0.1,
                borderDash: [10, 5],
              },
              {
                label: t("30_day_ma"),
                data: data.weekly_trends.map((item) => item.ma_30),
                borderColor: "rgb(153, 102, 255)",
                backgroundColor: "rgba(153, 102, 255, 0.1)",
                tension: 0.1,
                borderDash: [15, 5],
              },
            ],
          }}
          options={chartOptions}
        />
      )}
    </div>
  );
};

export default CrimeTrendsWeeklyChart;
