import React from "react";
import { Line } from "react-chartjs-2";
import { useTheme } from "../ThemeContext";

const ForecastChart = ({ data }) => {
  console.log("Forecast data", data);
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
        Crime Forecast (Next 3 Months)
      </h3>
      {data && data?.forecast?.length > 0 && (
        <Line
          data={{
            labels: data.forecast.map((item) => item.period),
            datasets: [
              {
                label: "Forecast",
                data: data.forecast.map((item) => item.combined_forecast),
                borderColor: "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.1)",
                tension: 0.1,
                borderDash: [5, 5],
              },
              {
                label: "Confidence Upper",
                data: data.forecast.map(
                  (item) => item.confidence_interval.upper
                ),
                borderColor: "rgba(255, 99, 132, 0.3)",
                backgroundColor: "rgba(255, 99, 132, 0.05)",
                tension: 0.1,
                borderDash: [2, 2],
                fill: false,
                pointRadius: 0,
              },
              {
                label: "Confidence Lower",
                data: data.forecast.map(
                  (item) => item.confidence_interval.lower
                ),
                borderColor: "rgba(255, 99, 132, 0.3)",
                backgroundColor: "rgba(255, 99, 132, 0.05)",
                tension: 0.1,
                borderDash: [2, 2],
                fill: "+1",
                pointRadius: 0,
              },
            ],
          }}
          options={chartOptions}
        />
      )}
    </div>
  );
};

export default ForecastChart;
