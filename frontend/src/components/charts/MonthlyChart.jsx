import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "react-i18next";
import { useCrimeDataSets } from "../../hooks/useCrimeData";

const MonthlyChart = ({ filters = {} }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [selectedYears, setSelectedYears] = useState([]);
  const [localFilters, setLocalFilters] = useState(filters);
  const [cities, setCities] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [risps, setRisps] = useState([]);

  // Use the crime data hook to get filtered temporal data
  const { temporalData } = useCrimeDataSets(localFilters, false);

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

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [citiesRes, unidadesRes, rispsRes] = await Promise.all([
          fetch("/api/locations/cities"),
          fetch("/api/police/unidades"),
          fetch("/api/police/risps"),
        ]);

        if (citiesRes.ok) {
          const citiesData = await citiesRes.json();
          setCities(citiesData.map((city) => ({ label: city, value: city })));
        }

        if (unidadesRes.ok) {
          const unidadesData = await unidadesRes.json();
          setUnidades(
            unidadesData.map((unidade) => ({ label: unidade, value: unidade }))
          );
        }

        if (rispsRes.ok) {
          const rispsData = await rispsRes.json();
          setRisps(rispsData.map((risp) => ({ label: risp, value: risp })));
        }
      } catch (error) {
        console.error("Error loading filter options:", error);
      }
    };

    loadFilterOptions();
  }, []);

  // Initialize selected years when temporalData changes
  useEffect(() => {
    if (temporalData && temporalData.monthly_by_year) {
      const availableYears = Object.keys(temporalData.monthly_by_year).sort(
        (a, b) => parseInt(b) - parseInt(a)
      );
      setSelectedYears(availableYears); // Default to all years selected
    }
  }, [temporalData]);

  // Process data for stacked bars
  const processData = () => {
    if (!temporalData || !temporalData.monthly_by_year) return null;

    const years = Object.keys(temporalData.monthly_by_year).sort(
      (a, b) => parseInt(b) - parseInt(a)
    ); // Most recent first

    // Filter years based on selection
    const filteredYears = years.filter((year) => selectedYears.includes(year));

    // Create datasets for each selected year
    const datasets = filteredYears.map((year, index) => {
      const yearData = temporalData.monthly_by_year[year] || [];
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
    temporalData && temporalData.monthly_by_year
      ? Object.keys(temporalData.monthly_by_year).sort(
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
      <div className="mb-4">
        <h3
          className={`text-xl font-semibold mb-4 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {t("monthly_crime_trends_by_year")}
        </h3>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              🏙️ {t("city")}
            </label>
            <select
              value={localFilters.city || ""}
              onChange={(e) => setLocalFilters({ ...localFilters, city: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                  : "bg-white border-gray-300 focus:border-blue-500"
              }`}
            >
              <option value="">{t("all_cities")}</option>
              {cities.map((city) => (
                <option key={city.value} value={city.value}>
                  {city.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              👮 {t("unidade")}
            </label>
            <select
              value={localFilters.unidade || ""}
              onChange={(e) => setLocalFilters({ ...localFilters, unidade: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                  : "bg-white border-gray-300 focus:border-blue-500"
              }`}
            >
              <option value="">{t("all_unidades")}</option>
              {unidades.map((unidade) => (
                <option key={unidade.value} value={unidade.value}>
                  {unidade.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              🏛️ {t("risp")}
            </label>
            <select
              value={localFilters.risp || ""}
              onChange={(e) => setLocalFilters({ ...localFilters, risp: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                  : "bg-white border-gray-300 focus:border-blue-500"
              }`}
            >
              <option value="">{t("all_risps")}</option>
              {risps.map((risp) => (
                <option key={risp.value} value={risp.value}>
                  {risp.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              📅 {t("years")}
            </label>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={handleSelectAll}
                className={`px-2 py-1 text-xs rounded ${
                  isDark
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                {t("all")}
              </button>
              <button
                onClick={handleClearAll}
                className={`px-2 py-1 text-xs rounded ${
                  isDark
                    ? "bg-gray-600 hover:bg-gray-700 text-white"
                    : "bg-gray-500 hover:bg-gray-600 text-white"
                }`}
              >
                {t("none")}
              </button>
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
                className={`px-2 py-1 text-xs rounded border ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                size={Math.min(availableYears.length, 3)}
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
