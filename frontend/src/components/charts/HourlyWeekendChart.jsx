import React from "react";
import { Line } from "react-chartjs-2";
import { useTheme } from "../ThemeContext";

const HourlyWeekendChart = ({ data }) => {
  const { isDark } = useTheme();

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
        Weekend Hourly Pattern
      </h3>
      {data && Array.isArray(data) && data.length > 0 && (
        <Line
          data={{
            labels: data.map((h) => `${h.hour}:00`),
            datasets: [
              {
                label: "Weekend Crimes",
                data: data.map((h) => h.count),
                borderColor: "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.1)",
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

export default HourlyWeekendChart;
