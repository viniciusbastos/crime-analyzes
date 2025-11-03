import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "react-i18next";

const MonthlyChart = ({ data }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [selectedYears, setSelectedYears] = useState([]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: isDark ? "#e5e7eb" : "#374151",
          usePointStyle: true,
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: isDark ? "#e5e7eb" : "#374151",
        },
        grid: {
          color: isDark ? "#374151" : "#e5e7eb",
        },
      },
      y: {
        stacked: true,
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

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Year colors - different colors for each year
  const yearColors = isDark
    ? [
        { bg: "rgba(59, 130, 246, 0.8)", border: "rgba(59, 130, 246, 1)" }, // Blue
        { bg: "rgba(239, 68, 68, 0.8)", border: "rgba(239, 68, 68, 1)" }, // Red
        { bg: "rgba(34, 197, 94, 0.8)", border: "rgba(34, 197, 94, 1)" }, // Green
        { bg: "rgba(251, 191, 36, 0.8)", border: "rgba(251, 191, 36, 1)" }, // Yellow
        { bg: "rgba(168, 85, 247, 0.8)", border: "rgba(168, 85, 247, 1)" }, // Purple
        { bg: "rgba(236, 72, 153, 0.8)", border: "rgba(236, 72, 153, 1)" }, // Pink
      ]
    : [
        { bg: "rgba(37, 99, 235, 0.8)", border: "rgba(37, 99, 235, 1)" }, // Blue
        { bg: "rgba(220, 38, 38, 0.8)", border: "rgba(220, 38, 38, 1)" }, // Red
        { bg: "rgba(5, 150, 105, 0.8)", border: "rgba(5, 150, 105, 1)" }, // Green
        { bg: "rgba(217, 119, 6, 0.8)", border: "rgba(217, 119, 6, 1)" }, // Yellow
        { bg: "rgba(124, 58, 237, 0.8)", border: "rgba(124, 58, 237, 1)" }, // Purple
        { bg: "rgba(219, 39, 119, 0.8)", border: "rgba(219, 39, 119, 1)" }, // Pink
      ];

  // Initialize selected years when data changes
  useEffect(() => {
    if (data && data.monthly_by_year) {
      const availableYears = Object.keys(data.monthly_by_year).sort(
        (a, b) => parseInt(b) - parseInt(a)
      );
      setSelectedYears(availableYears); // Default to all years selected
    }
  }, [data]);

  // Process data for stacked bars
  const processData = () => {
    if (!data || !data.monthly_by_year) return null;

    const years = Object.keys(data.monthly_by_year).sort(
      (a, b) => parseInt(b) - parseInt(a)
    ); // Most recent first

    // Filter years based on selection
    const filteredYears = years.filter((year) => selectedYears.includes(year));

    // Create datasets for each selected year
    const datasets = filteredYears.map((year, index) => {
      const yearData = data.monthly_by_year[year] || [];
      const monthlyCounts = Array(12).fill(0);

      // Fill in the counts for each month
      yearData.forEach((monthData) => {
        monthlyCounts[monthData.month - 1] = monthData.count;
      });

      const colorIndex = index % yearColors.length;

      return {
        label: year,
        data: monthlyCounts,
        backgroundColor: yearColors[colorIndex].bg,
        borderColor: yearColors[colorIndex].border,
        borderWidth: 1,
      };
    });

    return {
      labels: monthNames,
      datasets: datasets,
    };
  };

  const chartData = processData();

  const availableYears =
    data && data.monthly_by_year
      ? Object.keys(data.monthly_by_year).sort(
          (a, b) => parseInt(b) - parseInt(a)
        )
      : [];


  const handleSelectAll = () => {
    setSelectedYears(availableYears);
  };

  const handleClearAll = () => {
    setSelectedYears([]);
  };

  return (
    <div
      className={`rounded-lg shadow p-6 ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } border`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3
          className={`text-xl font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {t("monthly_crime_trends_by_year")}
        </h3>
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          <button
            onClick={handleSelectAll}
            className={`px-3 py-1 text-xs rounded ${
              isDark
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {t("select_all")}
          </button>
          <button
            onClick={handleClearAll}
            className={`px-3 py-1 text-xs rounded ${
              isDark
                ? "bg-gray-600 hover:bg-gray-700 text-white"
                : "bg-gray-500 hover:bg-gray-600 text-white"
            }`}
          >
            {t("clear_all")}
          </button>
          <div className="relative">
            <select
              multiple
              value={selectedYears}
              onChange={(e) => {
                const values = Array.from(
                  e.target.selectedOptions,
                  (option) => option.value
                );
                setSelectedYears(values);
              }}
              className={`px-3 py-1 text-xs rounded border ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              size={Math.min(availableYears.length, 4)}
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {chartData ? (
        <Bar data={chartData} options={chartOptions} />
      ) : (
        <div
          className={`text-center py-8 ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {t("no_monthly_data_available")}
        </div>
      )}

      {chartData && chartData.datasets.length > 0 && (
        <div
          className={`mt-4 text-sm ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          <p>{t("stacked_bars_description")}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {chartData.datasets.map((dataset) => (
              <div key={dataset.label} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: dataset.backgroundColor }}
                ></div>
                <span>
                  {dataset.label}:{" "}
                  {dataset.data.reduce((sum, val) => sum + val, 0)}{" "}
                  {t("total_crimes_count")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyChart;
