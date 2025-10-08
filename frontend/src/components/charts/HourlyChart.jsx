import React from "react";
import { Line } from "react-chartjs-2";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "react-i18next";

const HourlyChart = ({ data }) => {
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
        {t("crimes_by_hour")}
      </h3>
      {data && (
        <Line
          data={{
            labels: data.map((h) => `${h.hour}:00`),
            datasets: [
              {
                label: t("crimes_by_hour"),
                data: data.map((h) => h.count),
                borderColor: "rgb(75, 192, 192)",
                tension: 0.1,
              },
            ],
          }}
          options={chartOptions}
        />
      )}
    </div>
  );
};

export default HourlyChart;
