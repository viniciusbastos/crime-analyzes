import React from "react";
import { Line } from "react-chartjs-2";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "react-i18next";

const MovingAveragesChart = ({ data }) => {
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
        {t("crime_trends_with_moving_averages")}
      </h3>
      {data && data.monthly_trends && data.monthly_trends.length > 0 && (
        <Line
          data={{
            labels: data.monthly_trends.map((item) => item.year_month),
            datasets: [
              {
                label: t("actual_crimes"),
                data: data.monthly_trends.map((item) => item.count),
                borderColor: "rgb(75, 192, 192)",
                backgroundColor: "rgba(75, 192, 192, 0.1)",
                tension: 0.1,
              },
              {
                label: t("3_month_ma"),
                data: data.monthly_trends.map((item) => item.ma_3),
                borderColor: "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.1)",
                tension: 0.1,
                borderDash: [5, 5],
              },
              {
                label: t("6_month_ma"),
                data: data.monthly_trends.map((item) => item.ma_6),
                borderColor: "rgb(255, 205, 86)",
                backgroundColor: "rgba(255, 205, 86, 0.1)",
                tension: 0.1,
                borderDash: [10, 5],
              },
            ],
          }}
          options={chartOptions}
        />
      )}
    </div>
  );
};

export default MovingAveragesChart;
