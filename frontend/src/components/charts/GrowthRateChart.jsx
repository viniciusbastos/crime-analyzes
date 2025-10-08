import React, { useRef } from "react";
import { Line } from "react-chartjs-2";
import { useTheme } from "../ThemeContext";
import { useChartExport } from "../../hooks/useChartExport";

const GrowthRateChart = ({ data }) => {
  const chartRef = useRef(null);
  const { exportChartAsPNG, exportChartAsJPG } = useChartExport();
  // Parse data if it's a string
  let parsedData = data;
  if (typeof data === "string") {
    try {
      parsedData = JSON.parse(data);
    } catch (error) {
      console.error("Error parsing data string:", error);
      parsedData = null;
    }
  }

  // Now use parsedData instead of data
  const { isDark } = useTheme();

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
          callback: function (value) {
            return value + "%";
          },
        },
        grid: {
          color: isDark ? "#374151" : "#e5e7eb",
        },
      },
    },
  };

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
          Growth Rate Analysis
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => exportChartAsPNG(chartRef, "growth-rate-chart")}
            className="chart-export-button px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            title="Export as PNG"
          >
            📷 PNG
          </button>
          <button
            onClick={() => exportChartAsJPG(chartRef, "growth-rate-chart")}
            className="chart-export-button px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            title="Export as JPG"
          >
            🖼️ JPG
          </button>
        </div>
      </div>
      {parsedData &&
        parsedData.monthly_counts &&
        parsedData.monthly_counts.length > 0 && (
          <Line
            data={{
              labels: parsedData.monthly_counts.map((item) => item.year_month),
              datasets: [
                {
                  label: "MoM Growth %",
                  data: parsedData.monthly_counts.map(
                    (item) => item.mom_growth
                  ),
                  borderColor: "rgb(153, 102, 255)",
                  backgroundColor: "rgba(153, 102, 255, 0.1)",
                  tension: 0.1,
                },
                {
                  label: "YoY Growth %",
                  data: parsedData.monthly_counts.map(
                    (item) => item.yoy_growth
                  ),
                  borderColor: "rgb(255, 159, 64)",
                  backgroundColor: "rgba(255, 159, 64, 0.1)",
                  tension: 0.1,
                  borderDash: [5, 5],
                },
              ],
            }}
            options={chartOptions}
          />
        )}
    </div>
  );
};

export default GrowthRateChart;
