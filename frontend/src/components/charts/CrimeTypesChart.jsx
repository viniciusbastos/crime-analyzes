import React from "react";
import { Doughnut } from "react-chartjs-2";
import { useTheme } from "../ThemeContext";

const CrimeTypesChart = ({ data }) => {
  const { isDark } = useTheme();

  const chartOptions = {
    responsive: true,
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
        Crime Types Distribution
      </h3>
      {data && (
        <Doughnut
          data={{
            labels: data.map((t) => t.crime_type),
            datasets: [
              {
                data: data.map((t) => t.count),
                backgroundColor: [
                  "#FF6384",
                  "#36A2EB",
                  "#FFCE56",
                  "#4BC0C0",
                  "#9966FF",
                  "#FF9F40",
                ],
              },
            ],
          }}
          options={chartOptions}
        />
      )}
    </div>
  );
};

export default CrimeTypesChart;
