import React, { useState, useEffect } from "react";
import { useTheme } from "../hooks/useTheme";

const FilterPanel = ({
  filters,
  crimeTypes,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
}) => {
  const { isDark } = useTheme();

  // Local state for pending filter changes
  const [pendingFilters, setPendingFilters] = useState(filters);

  // Sync pendingFilters with incoming filters prop
  useEffect(() => {
    setPendingFilters(filters);
  }, [filters]);

  const quickDateRanges = [
    { label: "Last 7 days", value: "7d" },
    { label: "Last 30 days", value: "30d" },
    { label: "Last 3 months", value: "3m" },
    { label: "Last 6 months", value: "6m" },
    { label: "Last year", value: "1y" },
    { label: "All time", value: "all" },
  ];

  const timeRanges = [
    { label: "All Hours", value: "" },
    { label: "Early Morning (00:00-06:00)", value: "00-06" },
    { label: "Morning (06:00-12:00)", value: "06-12" },
    { label: "Afternoon (12:00-18:00)", value: "12-18" },
    { label: "Evening (18:00-24:00)", value: "18-24" },
  ];

  const daysOfWeek = [
    { label: "All Days", value: "" },
    { label: "Weekdays", value: "weekdays" },
    { label: "Weekends", value: "weekends" },
    { label: "Monday", value: "monday" },
    { label: "Tuesday", value: "tuesday" },
    { label: "Wednesday", value: "wednesday" },
    { label: "Thursday", value: "thursday" },
    { label: "Friday", value: "friday" },
    { label: "Saturday", value: "saturday" },
    { label: "Sunday", value: "sunday" },
  ];

  const months = [
    { label: "All Months", value: "" },
    { label: "January", value: "01" },
    { label: "February", value: "02" },
    { label: "March", value: "03" },
    { label: "April", value: "04" },
    { label: "May", value: "05" },
    { label: "June", value: "06" },
    { label: "July", value: "07" },
    { label: "August", value: "08" },
    { label: "September", value: "09" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" },
  ];

  // City filter options will be populated from API
  const [cities, setCities] = React.useState([]);

  // Police organizational filter options
  const [unidades, setUnidades] = React.useState([]);
  const [aisps, setAisps] = React.useState([]);
  const [risps, setRisps] = React.useState([]);

  // Load filter options on component mount
  React.useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        // Load cities
        const citiesResponse = await fetch("/api/locations/cities");
        if (citiesResponse.ok) {
          const citiesData = await citiesResponse.json();
          setCities(citiesData.map((city) => ({ label: city, value: city })));
        }

        // Load police organizational options
        const [unidadesRes, aispsRes, rispsRes] = await Promise.all([
          fetch("/api/police/unidades"),
          fetch("/api/police/aisps"),
          fetch("/api/police/risps"),
        ]);

        if (unidadesRes.ok) {
          const unidadesData = await unidadesRes.json();
          setUnidades(
            unidadesData.map((unidade) => ({ label: unidade, value: unidade }))
          );
        }

        if (aispsRes.ok) {
          const aispsData = await aispsRes.json();
          setAisps(
            aispsData.map((aisp) => ({ label: aisp.toString(), value: aisp.toString() }))
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

  const handleQuickDateSelect = (range) => {
    const today = new Date();
    let startDate = null;

    switch (range) {
      case "7d":
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3m":
        startDate = new Date(
          today.getFullYear(),
          today.getMonth() - 3,
          today.getDate()
        );
        break;
      case "6m":
        startDate = new Date(
          today.getFullYear(),
          today.getMonth() - 6,
          today.getDate()
        );
        break;
      case "1y":
        startDate = new Date(
          today.getFullYear() - 1,
          today.getMonth(),
          today.getDate()
        );
        break;
      case "all":
        startDate = null;
        break;
      default:
        return;
    }

    const startDateStr = startDate ? startDate.toISOString().split("T")[0] : "";
    const endDateStr = today.toISOString().split("T")[0];

    setPendingFilters({
      ...pendingFilters,
      start_date: startDateStr,
      end_date: endDateStr,
      quick_date: range,
    });
  };

  return (
    <div
      className={`p-6 rounded-lg shadow-md ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } border`}
    >
      <h3
        className={`text-lg font-semibold mb-4 ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Enhanced Temporal Filters
      </h3>

      {/* Quick Date Ranges */}
      <div className="mb-4">
        <label
          className={`block text-sm font-medium mb-2 ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          Quick Date Ranges
        </label>
        <div className="flex flex-wrap gap-2">
          {quickDateRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => handleQuickDateSelect(range.value)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                pendingFilters.quick_date === range.value
                  ? "bg-blue-600 text-white"
                  : isDark
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Crime Type Filter */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Crime Type
          </label>
          <select
            value={pendingFilters.crime_type || ""}
            onChange={(e) =>
              setPendingFilters({
                ...pendingFilters,
                crime_type: e.target.value,
              })
            }
            className={`w-full px-3 py-2 border rounded-md transition-colors ${
              isDark
                ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                : "border-gray-300 focus:border-blue-500"
            }`}
          >
            <option value="">All Crime Types</option>
            {crimeTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Time Range Filter */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Time of Day
          </label>
          <select
            value={pendingFilters.time_range || ""}
            onChange={(e) =>
              setPendingFilters({
                ...pendingFilters,
                time_range: e.target.value,
              })
            }
            className={`w-full px-3 py-2 border rounded-md transition-colors ${
              isDark
                ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                : "border-gray-300 focus:border-blue-500"
            }`}
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Day of Week Filter */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Day of Week
          </label>
          <select
            value={pendingFilters.day_of_week || ""}
            onChange={(e) =>
              setPendingFilters({
                ...pendingFilters,
                day_of_week: e.target.value,
              })
            }
            className={`w-full px-3 py-2 border rounded-md transition-colors ${
              isDark
                ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                : "border-gray-300 focus:border-blue-500"
            }`}
          >
            {daysOfWeek.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>

        {/* Month Filter */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Month
          </label>
          <select
            value={pendingFilters.month || ""}
            onChange={(e) =>
              setPendingFilters({ ...pendingFilters, month: e.target.value })
            }
            className={`w-full px-3 py-2 border rounded-md transition-colors ${
              isDark
                ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                : "border-gray-300 focus:border-blue-500"
            }`}
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Start Date
          </label>
          <input
            type="date"
            value={pendingFilters.start_date || ""}
            onChange={(e) =>
              setPendingFilters({ ...pendingFilters, start_date: e.target.value })
            }
            className={`w-full px-3 py-2 border rounded-md transition-colors ${
              isDark
                ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                : "border-gray-300 focus:border-blue-500"
            }`}
          />
        </div>

        {/* End Date */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            End Date
          </label>
          <input
            type="date"
            value={pendingFilters.end_date || ""}
            onChange={(e) =>
              setPendingFilters({ ...pendingFilters, end_date: e.target.value })
            }
            className={`w-full px-3 py-2 border rounded-md transition-colors ${
              isDark
                ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                : "border-gray-300 focus:border-blue-500"
            }`}
          />
        </div>

        {/* City Filter */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            City
          </label>
          <select
            value={pendingFilters.city || ""}
            onChange={(e) =>
              setPendingFilters({ ...pendingFilters, city: e.target.value })
            }
            className={`w-full px-3 py-2 border rounded-md transition-colors ${
              isDark
                ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                : "border-gray-300 focus:border-blue-500"
            }`}
          >
            <option value="">All Cities</option>
            {cities.map((city) => (
              <option key={city.value} value={city.value}>
                {city.label}
              </option>
            ))}
          </select>
        </div>

        {/* Police Organizational Filters */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Unidade (Police Unit)
          </label>
          <select
            value={pendingFilters.unidade || ""}
            onChange={(e) =>
              setPendingFilters({ ...pendingFilters, unidade: e.target.value })
            }
            className={`w-full px-3 py-2 border rounded-md transition-colors ${
              isDark
                ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                : "border-gray-300 focus:border-blue-500"
            }`}
          >
            <option value="">All Unidades</option>
            {unidades.map((unidade) => (
              <option key={unidade.value} value={unidade.value}>
                {unidade.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            AISP (Regional Area)
          </label>
          <select
            value={pendingFilters.aisp || ""}
            onChange={(e) =>
              setPendingFilters({ ...pendingFilters, aisp: e.target.value })
            }
            className={`w-full px-3 py-2 border rounded-md transition-colors ${
              isDark
                ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                : "border-gray-300 focus:border-blue-500"
            }`}
          >
            <option value="">All AISPs</option>
            {aisps.map((aisp) => (
              <option key={aisp.value} value={aisp.value}>
                {aisp.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            RISP (Regional Department)
          </label>
          <select
            value={pendingFilters.risp || ""}
            onChange={(e) =>
              setPendingFilters({ ...pendingFilters, risp: e.target.value })
            }
            className={`w-full px-3 py-2 border rounded-md transition-colors ${
              isDark
                ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                : "border-gray-300 focus:border-blue-500"
            }`}
          >
            <option value="">All RISPs</option>
            {risps.map((risp) => (
              <option key={risp.value} value={risp.value}>
                {risp.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => {
            onFilterChange(pendingFilters);
            onApplyFilters();
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Apply Filters
        </button>
        <button
          onClick={() => {
            setPendingFilters({});
            onResetFilters();
          }}
          className={`px-6 py-2 rounded-md transition-colors font-medium ${
            isDark
              ? "bg-gray-600 text-white hover:bg-gray-700"
              : "bg-gray-600 text-white hover:bg-gray-700"
          }`}
        >
          Reset All Filters
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
