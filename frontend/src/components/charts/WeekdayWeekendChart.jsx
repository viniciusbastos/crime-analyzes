import React from "react";
import { Bar } from "react-chartjs-2";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "react-i18next";

const WeekdayWeekendChart = ({ data }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
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
        {t("weekday_vs_weekend_chart")}
      </h3>
      {data && Array.isArray(data) && data.length > 0 && (
        <Bar
          data={{
            labels: data.map((item) => item.period),
            datasets: [
              {
                label: t("total_crimes_label"),
                data: data.map((item) => item.count),
                backgroundColor: [
                  "rgba(54, 162, 235, 0.6)", // Weekday - blue
                  "rgba(255, 99, 132, 0.6)", // Weekend - red
                ],
                borderColor: ["rgba(54, 162, 235, 1)", "rgba(255, 99, 132, 1)"],
                borderWidth: 1,
              },
            ],
          }}
          options={chartOptions}
        />
      )}
    </div>
  );
};

export default WeekdayWeekendChart;
