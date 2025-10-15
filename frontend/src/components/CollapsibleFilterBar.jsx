import React, { useState, useEffect } from "react";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "react-i18next";

const CollapsibleFilterBar = ({
  filters,
  crimeTypes,
  onApplyFilters,
  onResetFilters,
}) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

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
        console.error(t("error_loading_filter_options"), error);
      }
    };

    loadFilterOptions();
  }, [t]);

  const handleFilterChange = (newFilters) => {
    setLocalFilters(newFilters);
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
  };

  const handleReset = () => {
    setLocalFilters({});
    onResetFilters();
  };

  const quickDateRanges = [
    { label: t("last_7_days"), value: "7d" },
    { label: t("last_30_days"), value: "30d" },
    { label: t("last_3_months"), value: "3m" },
    { label: t("last_6_months"), value: "6m" },
    { label: t("last_year"), value: "1y" },
    { label: t("all_time"), value: "all" },
  ];

  const timeRanges = [
    { label: t("all_hours"), value: "" },
    { label: t("early_morning"), value: "00-06" },
    { label: t("morning"), value: "06-12" },
    { label: t("afternoon"), value: "12-18" },
    { label: t("evening"), value: "18-24" },
  ];

  const daysOfWeek = [
    { label: t("all_days"), value: "" },
    { label: t("weekdays"), value: "weekdays" },
    { label: t("weekends"), value: "weekends" },
    { label: t("monday"), value: "monday" },
    { label: t("tuesday"), value: "tuesday" },
    { label: t("wednesday"), value: "wednesday" },
    { label: t("thursday"), value: "thursday" },
    { label: t("friday"), value: "friday" },
    { label: t("saturday"), value: "saturday" },
    { label: t("sunday"), value: "sunday" },
  ];

  const months = [
    { label: t("all_months"), value: "" },
    { label: t("january"), value: "01" },
    { label: t("february"), value: "02" },
    { label: t("march"), value: "03" },
    { label: t("april"), value: "04" },
    { label: t("may"), value: "05" },
    { label: t("june"), value: "06" },
    { label: t("july"), value: "07" },
    { label: t("august"), value: "08" },
    { label: t("september"), value: "09" },
    { label: t("october"), value: "10" },
    { label: t("november"), value: "11" },
    { label: t("december"), value: "12" },
  ];

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

    handleFilterChange({
      ...localFilters,
      start_date: startDateStr,
      end_date: endDateStr,
      quick_date: range,
    });
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some((value) => value && value !== "");
  };

  return (
    <div
      className={`w-full mb-6 rounded-lg shadow-lg border transition-all duration-300 ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      {/* Collapsed Filter Bar */}
      <div
        className={`p-4 cursor-pointer transition-colors ${
          isDark ? "hover:bg-gray-750" : "hover:bg-gray-50"
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🔍</span>
              <h3
                className={`text-lg font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {t("filters_and_search")}
              </h3>
            </div>

            {/* Quick Filter Tags */}
            <div className="flex flex-wrap gap-2">
              {filters.crime_type && (
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    isDark
                      ? "bg-blue-900 text-blue-200"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {t("crime")}: {filters.crime_type}
                </span>
              )}
              {filters.category_parent && (
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    isDark
                      ? "bg-red-900 text-red-200"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {t("category")}: {filters.category_parent}
                </span>
              )}
              {filters.quick_date && (
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    isDark
                      ? "bg-green-900 text-green-200"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {
                    quickDateRanges.find((r) => r.value === filters.quick_date)
                      ?.label
                  }
                </span>
              )}
              {filters.time_range && (
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    isDark
                      ? "bg-purple-900 text-purple-200"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {
                    timeRanges.find((r) => r.value === filters.time_range)
                      ?.label
                  }
                </span>
              )}
              {filters.day_of_week && (
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    isDark
                      ? "bg-orange-900 text-orange-200"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {
                    daysOfWeek.find((d) => d.value === filters.day_of_week)
                      ?.label
                  }
                </span>
              )}
              {filters.month && (
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    isDark
                      ? "bg-teal-900 text-teal-200"
                      : "bg-teal-100 text-teal-800"
                  }`}
                >
                  {months.find((m) => m.value === filters.month)?.label}
                </span>
              )}
              {filters.city && (
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    isDark
                      ? "bg-indigo-900 text-indigo-200"
                      : "bg-indigo-100 text-indigo-800"
                  }`}
                >
                  🏙️ {filters.city}
                </span>
              )}
              {filters.unidade && (
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    isDark
                      ? "bg-cyan-900 text-cyan-200"
                      : "bg-cyan-100 text-cyan-800"
                  }`}
                >
                  👮 {filters.unidade}
                </span>
              )}
              {filters.aisp && (
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    isDark
                      ? "bg-emerald-900 text-emerald-200"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  🏢 AISP {filters.aisp}
                </span>
              )}
              {filters.risp && (
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    isDark
                      ? "bg-violet-900 text-violet-200"
                      : "bg-violet-100 text-violet-800"
                  }`}
                >
                  🏛️ {filters.risp}
                </span>
              )}
              {!hasActiveFilters() && (
                <span
                  className={`px-2 py-1 text-xs ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {t("no_filters_applied")}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {hasActiveFilters() && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  isDark
                    ? "bg-red-900 text-red-200 hover:bg-red-800"
                    : "bg-red-100 text-red-800 hover:bg-red-200"
                }`}
              >
                {t("clear_all")}
              </button>
            )}
            <span
              className={`text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {isExpanded ? t("hide_advanced") : t("show_advanced")}
            </span>
            <span
              className={`transform transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              } ${isDark ? "text-gray-300" : "text-gray-600"}`}
            >
              ▼
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div
          className={`border-t p-6 transition-all duration-300 ${
            isDark
              ? "border-gray-700 bg-gray-750"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="mb-6">
            <h4
              className={`text-md font-semibold mb-3 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              🚀 {t("quick_date_ranges")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {quickDateRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => handleQuickDateSelect(range.value)}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 transform hover:scale-105 ${
                    localFilters.quick_date === range.value
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                      : isDark
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 mb-6">
            {/* Crime Type Filter */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                🚨 {t("crime_type")}
              </label>
              <select
                value={localFilters.crime_type || ""}
                onChange={(e) =>
                  handleFilterChange({
                    ...localFilters,
                    crime_type: e.target.value,
                  })
                }
                className={`w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                }`}
              >
                <option value="">{t("all_crime_types")}</option>
                {crimeTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Parent Filter */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                📂 {t("category_parent")}
              </label>
              <select
                value={localFilters.category_parent || ""}
                onChange={(e) =>
                  handleFilterChange({
                    ...localFilters,
                    category_parent: e.target.value,
                  })
                }
                className={`w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                }`}
              >
                <option value="">{t("all_categories")}</option>
                <option value="CVLI">{t("cvli")}</option>
                <option value="CVP">{t("cvp")}</option>
              </select>
            </div>

            {/* Time Range Filter */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                🕒 {t("time_of_day")}
              </label>
              <select
                value={localFilters.time_range || ""}
                onChange={(e) =>
                  handleFilterChange({
                    ...localFilters,
                    time_range: e.target.value,
                  })
                }
                className={`w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
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
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                📅 {t("day_of_week")}
              </label>
              <select
                value={localFilters.day_of_week || ""}
                onChange={(e) =>
                  handleFilterChange({
                    ...localFilters,
                    day_of_week: e.target.value,
                  })
                }
                className={`w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
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
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                🗓️ {t("month")}
              </label>
              <select
                value={localFilters.month || ""}
                onChange={(e) =>
                  handleFilterChange({ ...localFilters, month: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
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
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                📅 {t("start_date")}
              </label>
              <input
                type="date"
                value={localFilters.start_date || ""}
                onChange={(e) =>
                  handleFilterChange({
                    ...localFilters,
                    start_date: e.target.value,
                    quick_date: "",
                  })
                }
                className={`w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                }`}
              />
            </div>

            {/* End Date */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                📅 {t("end_date")}
              </label>
              <input
                type="date"
                value={localFilters.end_date || ""}
                onChange={(e) =>
                  handleFilterChange({
                    ...localFilters,
                    end_date: e.target.value,
                    quick_date: "",
                  })
                }
                className={`w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                }`}
              />
            </div>

            {/* City Filter */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                🏙️ {t("city")}
              </label>
              <select
                value={localFilters.city || ""}
                onChange={(e) =>
                  handleFilterChange({ ...localFilters, city: e.target.value })
                }
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

            {/* Police Organizational Filters */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                👮 Unidade
              </label>
              <select
                value={localFilters.unidade || ""}
                onChange={(e) =>
                  handleFilterChange({ ...localFilters, unidade: e.target.value })
                }
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
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                🏢 AISP
              </label>
              <select
                value={localFilters.aisp || ""}
                onChange={(e) =>
                  handleFilterChange({ ...localFilters, aisp: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                }`}
              >
                <option value="">{t("all_aisps")}</option>
                {aisps.map((aisp) => (
                  <option key={aisp.value} value={aisp.value}>
                    {aisp.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                🏛️ RISP
              </label>
              <select
                value={localFilters.risp || ""}
                onChange={(e) =>
                  handleFilterChange({ ...localFilters, risp: e.target.value })
                }
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
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleApply}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg transform hover:scale-105"
            >
              ✨ {t("apply_filters")}
            </button>
            <button
              onClick={handleReset}
              className={`px-6 py-2 rounded-lg transition-all duration-200 font-medium shadow-lg transform hover:scale-105 ${
                isDark
                  ? "bg-gray-600 text-white hover:bg-gray-500"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              🔄 {t("reset_all")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleFilterBar;
