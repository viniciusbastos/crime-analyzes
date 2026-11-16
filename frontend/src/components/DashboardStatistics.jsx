import React, { useState, useMemo } from "react";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "react-i18next";

// Color mappings for StatCard
const COLOR_CLASSES = {
  blue: {
    dark: "bg-blue-900/60 border-blue-700 text-blue-200",
    light: "bg-blue-50 border-blue-200 text-blue-800",
  },
  green: {
    dark: "bg-green-900/60 border-green-700 text-green-200",
    light: "bg-green-50 border-green-200 text-green-800",
  },
  red: {
    dark: "bg-red-900/60 border-red-700 text-red-200",
    light: "bg-red-50 border-red-200 text-red-800",
  },
  purple: {
    dark: "bg-purple-900/60 border-purple-700 text-purple-200",
    light: "bg-purple-50 border-purple-200 text-purple-800",
  },
  orange: {
    dark: "bg-orange-900/60 border-orange-700 text-orange-200",
    light: "bg-orange-50 border-orange-200 text-orange-800",
  },
  teal: {
    dark: "bg-teal-900/60 border-teal-700 text-teal-200",
    light: "bg-teal-50 border-teal-200 text-teal-800",
  },
};

// Subcomponent extracted outside DashboardStatistics to avoid recreating DOM on every render
const StatCard = React.memo(
  ({
    title,
    value,
    subtitle,
    trend,
    icon,
    color = "blue",
    isDark = false,
  }) => {
    const colorStyle =
      COLOR_CLASSES[color]?.[isDark ? "dark" : "light"] ||
      COLOR_CLASSES.blue[isDark ? "dark" : "light"];

    const hasTrend = typeof trend === "number" && !isNaN(trend);

    return (
      <div
        className={`p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 ${colorStyle}`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl" aria-hidden="true">
            {icon}
          </span>
          {hasTrend && (
            <span
              className={`text-sm font-semibold px-2 py-0.5 rounded ${
                trend > 0
                  ? isDark
                    ? "bg-red-900/80 text-red-300"
                    : "bg-red-100 text-red-700"
                  : trend < 0
                  ? isDark
                    ? "bg-green-900/80 text-green-300"
                    : "bg-green-100 text-green-700"
                  : isDark
                  ? "bg-gray-800 text-gray-300"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {trend > 0 ? "↗️" : trend < 0 ? "↘️" : "➡️"}{" "}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
        <div>
          <div className="text-3xl font-bold mb-1 tracking-tight">{value}</div>
          <div className="text-sm font-medium opacity-90">{title}</div>
          {subtitle && (
            <div
              className={`text-xs mt-1 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
    );
  }
);
StatCard.displayName = "StatCard";

const BAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-indigo-500",
];

const DashboardStatistics = ({
  summaryData,
  trendData,
  temporalData,
  filters,
  cityData,
}) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const [showAllCrimeTypes, setShowAllCrimeTypes] = useState(false);
  const [showAllCities, setShowAllCities] = useState(false);

  const { yearOverYearData, growthRatesData, movingAveragesData } =
    trendData || {};

  // Formatted date range from summaryData
  const dateRangeText = useMemo(() => {
    const start = summaryData?.date_range?.start;
    const end = summaryData?.date_range?.end;
    if (!start || !end) return null;
    try {
      const startDate = new Date(start).toLocaleDateString();
      const endDate = new Date(end).toLocaleDateString();
      return `${startDate} — ${endDate}`;
    } catch {
      return null;
    }
  }, [summaryData?.date_range]);

  // Weekend crime percentage
  const weekendPercentage = useMemo(() => {
    if (!temporalData?.weekend_comparison) return null;
    const weekday =
      temporalData.weekend_comparison.find((item) => item.period === "Weekday")
        ?.count || 0;
    const weekend =
      temporalData.weekend_comparison.find((item) => item.period === "Weekend")
        ?.count || 0;
    const total = weekday + weekend;
    return total > 0 ? ((weekend / total) * 100).toFixed(1) : "0.0";
  }, [temporalData?.weekend_comparison]);

  // High risk night hours (22:00 - 04:00)
  const highRiskHours = useMemo(() => {
    if (!temporalData?.hourly || temporalData.hourly.length === 0) return null;
    const totalCrimes = temporalData.hourly.reduce(
      (sum, hour) => sum + hour.count,
      0
    );
    const nightCrimes = temporalData.hourly
      .filter((hour) => hour.hour >= 22 || hour.hour <= 4)
      .reduce((sum, hour) => sum + hour.count, 0);
    return totalCrimes > 0 ? ((nightCrimes / totalCrimes) * 100).toFixed(1) : "0.0";
  }, [temporalData?.hourly]);

  // Peak hour operational insight
  const peakHourInfo = useMemo(() => {
    if (!temporalData?.hourly || temporalData.hourly.length === 0) return null;
    const sorted = [...temporalData.hourly].sort((a, b) => b.count - a.count);
    if (!sorted[0] || sorted[0].count === 0) return null;
    return {
      hour: `${String(sorted[0].hour).padStart(2, "0")}:00`,
      count: sorted[0].count,
    };
  }, [temporalData?.hourly]);

  // Top crime type percentage & name with proper empty-state handling
  const topCrimeTypeInfo = useMemo(() => {
    if (!summaryData?.crime_types || summaryData.crime_types.length === 0) {
      return {
        percentage: "0.0",
        name:
          summaryData?.total_crimes === 0
            ? t("no_crimes_found", "Nenhuma ocorrência")
            : t("no_data_available", "Sem dados"),
      };
    }
    const topCrime = summaryData.crime_types[0];
    const total = summaryData.total_crimes || 0;
    const percentage =
      total > 0 ? ((topCrime.count / total) * 100).toFixed(1) : "0.0";
    return {
      percentage,
      name: topCrime.crime_type,
    };
  }, [summaryData?.crime_types, summaryData?.total_crimes, t]);

  // Average month-over-month growth trend
  const averageGrowthTrend = useMemo(() => {
    if (!growthRatesData?.growth_rates) return null;
    const val = growthRatesData.growth_rates.average_mom_growth;
    return typeof val === "number" && !isNaN(val) ? val : null;
  }, [growthRatesData?.growth_rates]);

  // Volatility evaluation with safe validation (no false "low" when data is missing)
  const volatilityInfo = useMemo(() => {
    if (!growthRatesData?.growth_rates) {
      return { level: t("unknown", "Desconhecido"), color: "blue", value: null };
    }
    const volatility = growthRatesData.growth_rates.volatility;
    if (typeof volatility !== "number" || isNaN(volatility)) {
      return { level: t("unknown", "Desconhecido"), color: "blue", value: null };
    }
    if (volatility > 100) return { level: t("extreme", "Extrema"), color: "purple", value: volatility };
    if (volatility > 75) return { level: t("critical", "Crítica"), color: "red", value: volatility };
    if (volatility > 50) return { level: t("high", "Alta"), color: "red", value: volatility };
    if (volatility > 25) return { level: t("medium", "Média"), color: "orange", value: volatility };
    return { level: t("low", "Baixa"), color: "green", value: volatility };
  }, [growthRatesData?.growth_rates, t]);

  // Total city crimes memoized
  const totalCityCrimes = useMemo(() => {
    if (!cityData || cityData.length === 0) return 0;
    return cityData.reduce((sum, item) => sum + (item.total_crimes || 0), 0);
  }, [cityData]);

  // Active filters list to display context pills
  const activeFilters = useMemo(() => {
    if (!filters) return [];
    const list = [];
    if (filters.crime_type) list.push({ label: t("crime_type", "Crime"), value: filters.crime_type });
    if (filters.unidade) list.push({ label: t("unidade", "Unidade"), value: filters.unidade });
    if (filters.city) list.push({ label: t("city", "Cidade"), value: filters.city });
    if (filters.neighborhood) list.push({ label: t("neighborhood", "Bairro"), value: filters.neighborhood });
    if (filters.start_date || filters.end_date) {
      list.push({
        label: t("period", "Filtro Data"),
        value: `${filters.start_date || "—"} a ${filters.end_date || "—"}`,
      });
    }
    return list;
  }, [filters, t]);

  const crimeTypesList = summaryData?.crime_types || [];
  const visibleCrimeTypes = showAllCrimeTypes
    ? crimeTypesList
    : crimeTypesList.slice(0, 5);

  const visibleCities = cityData
    ? showAllCities
      ? cityData
      : cityData.slice(0, 6)
    : [];

  return (
    <div className="space-y-6">
      {/* Header with Title and Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2
            className={`text-2xl font-bold flex items-center gap-2 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            <span aria-hidden="true">📊</span> {t("crime_analysis_dashboard", "Painel de Análise de Crimes")}
          </h2>
          {dateRangeText && (
            <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              📅 {t("period_analyzed", "Período analisado")}: <span className="font-semibold">{dateRangeText}</span>
              {peakHourInfo && (
                <span className="ml-3">
                  ⏰ {t("peak_hour", "Horário de pico")}: <span className="font-semibold">{peakHourInfo.hour} ({peakHourInfo.count} {t("incidents", "ocorrências")})</span>
                </span>
              )}
            </p>
          )}
        </div>

        {/* Active Filters Badges */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {t("active_filters", "Filtros")}:
            </span>
            {activeFilters.map((f, i) => (
              <span
                key={i}
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  isDark
                    ? "bg-gray-800 text-blue-300 border border-gray-700"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {f.label}: <strong className="font-semibold">{f.value}</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Empty State Banner when 0 crimes found */}
      {summaryData && summaryData.total_crimes === 0 && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 ${
            isDark
              ? "bg-amber-950/40 border-amber-800 text-amber-200"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          <span className="text-xl" aria-hidden="true">ℹ️</span>
          <div className="text-sm">
            <span className="font-semibold">{t("no_crimes_found", "Nenhuma ocorrência encontrada")}</span>{" "}
            {t("no_crimes_description", "com os filtros selecionados. Tente ajustar os parâmetros de busca.")}
          </div>
        </div>
      )}

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t("total_crimes_stat", "Total de Crimes")}
          value={summaryData?.total_crimes?.toLocaleString() || "0"}
          subtitle={t("all_recorded_incidents", "Todas as ocorrências registradas")}
          icon="🚨"
          color="red"
          isDark={isDark}
        />

        <StatCard
          title={t("weekend_activity", "Atividade no Fim de Semana")}
          value={`${weekendPercentage || "0.0"}%`}
          subtitle={t("crimes_occurring_on_weekends", "Ocorrências no fim de semana")}
          icon="📅"
          color="purple"
          isDark={isDark}
        />

        <StatCard
          title={t("night_crimes", "Crimes Noturnos")}
          value={`${highRiskHours || "0.0"}%`}
          subtitle={t("night_crimes_subtitle", "Janela das 22:00 às 04:00")}
          icon="🌙"
          color="orange"
          isDark={isDark}
        />

        <StatCard
          title={t("top_crime_type", "Principal Tipo de Crime")}
          value={`${topCrimeTypeInfo.percentage}%`}
          subtitle={topCrimeTypeInfo.name}
          icon="📋"
          color="teal"
          isDark={isDark}
        />
      </div>

      {/* Trends Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title={t("monthly_growth", "Crescimento Mensal")}
          value={`${
            typeof averageGrowthTrend === "number"
              ? averageGrowthTrend.toFixed(1)
              : "0.0"
          }%`}
          subtitle={t("average_month_over_month_change", "Média de variação mês a mês")}
          trend={averageGrowthTrend}
          icon="📈"
          color="blue"
          isDark={isDark}
        />

        <StatCard
          title={t("trend_direction_stat", "Direção da Tendência")}
          value={
            movingAveragesData?.trend_indicators?.direction
              ? t(
                  movingAveragesData.trend_indicators.direction,
                  movingAveragesData.trend_indicators.direction.replace("_", " ")
                )
              : t("stable", "Estável")
          }
          subtitle={t("current_crime_trend_pattern", "Padrão da tendência recente")}
          icon="🎯"
          color={
            movingAveragesData?.trend_indicators?.direction === "increasing"
              ? "red"
              : movingAveragesData?.trend_indicators?.direction === "decreasing"
              ? "green"
              : "blue"
          }
          isDark={isDark}
        />

        <StatCard
          title={t("volatility", "Volatilidade")}
          value={volatilityInfo.level}
          subtitle={
            volatilityInfo.value !== null
              ? `${t("volatility_index", "Índice de volatilidade")}: ${volatilityInfo.value.toFixed(1)}`
              : t("no_data_available", "Sem dados suficientes")
          }
          icon="📊"
          color={volatilityInfo.color}
          isDark={isDark}
        />
      </div>

      {/* Year-over-Year Comparison */}
      {yearOverYearData?.year_over_year &&
        yearOverYearData.year_over_year.length > 0 && (
          <div
            className={`p-6 rounded-xl border-2 ${
              isDark
                ? "bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600"
                : "bg-gradient-to-r from-white to-gray-50 border-gray-200"
            }`}
          >
            <h3
              className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              <span aria-hidden="true">📅</span> {t("year_over_year_analysis", "Análise Ano a Ano")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {yearOverYearData.year_over_year.map((yearData) => {
                const hasChange =
                  typeof yearData.change_percent === "number" &&
                  !isNaN(yearData.change_percent);
                return (
                  <div
                    key={yearData.year}
                    className={`p-4 rounded-lg shadow-md transition-shadow hover:shadow-lg ${
                      isDark ? "bg-gray-700/80 border border-gray-600" : "bg-white border border-gray-100"
                    }`}
                  >
                    <div
                      className={`text-lg font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {yearData.year}
                    </div>
                    <div
                      className={`text-2xl font-bold my-1 ${
                        hasChange
                          ? yearData.change_percent > 0
                            ? "text-red-500"
                            : yearData.change_percent < 0
                            ? "text-green-500"
                            : "text-gray-500"
                          : "text-gray-400"
                      }`}
                    >
                      {hasChange
                        ? `${yearData.change_percent > 0 ? "+" : ""}${yearData.change_percent}%`
                        : "—"}
                    </div>
                    <div
                      className={`text-sm ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {yearData.current_count?.toLocaleString() || 0} {t("crimes", "crimes")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Top Crime Types Visual */}
      {crimeTypesList.length > 0 && (
        <div
          className={`p-6 rounded-xl border-2 ${
            isDark
              ? "bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600"
              : "bg-gradient-to-r from-white to-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className={`text-lg font-semibold flex items-center gap-2 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              <span aria-hidden="true">🎯</span> {t("crime_type_distribution", "Distribuição por Tipo de Crime")}
            </h3>
            {crimeTypesList.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllCrimeTypes((prev) => !prev)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  isDark
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-500"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                }`}
              >
                {showAllCrimeTypes
                  ? t("show_less", "Mostrar menos (Top 5)")
                  : `${t("show_all", "Ver todos")} (${crimeTypesList.length})`}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {visibleCrimeTypes.map((type, index) => {
              const percentage =
                summaryData.total_crimes > 0
                  ? ((type.count / summaryData.total_crimes) * 100).toFixed(1)
                  : 0;
              const color = BAR_COLORS[index % BAR_COLORS.length];

              return (
                <div
                  key={type.crime_type}
                  className="flex items-center space-x-4"
                >
                  <div
                    className={`w-4 h-4 rounded-full flex-shrink-0 ${color}`}
                    aria-hidden="true"
                  />
                  <div className="flex-1">
                    <div
                      className={`flex justify-between items-center ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      <span className="font-medium text-sm sm:text-base">
                        {type.crime_type}
                      </span>
                      <span className="font-bold text-sm sm:text-base">
                        {percentage}%
                      </span>
                    </div>
                    <div
                      className={`w-full ${
                        isDark ? "bg-gray-700" : "bg-gray-200"
                      } rounded-full h-2.5 mt-1 overflow-hidden`}
                    >
                      <div
                        role="progressbar"
                        aria-valuenow={percentage}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        className={`${color} h-2.5 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                      />
                    </div>
                    <div
                      className={`text-xs mt-0.5 ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {type.count.toLocaleString()} {t("incidents", "ocorrências")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* City Statistics — shown when cityData exists */}
      {cityData && cityData.length > 0 && (
        <div
          className={`p-6 rounded-xl border-2 ${
            isDark
              ? "bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600"
              : "bg-gradient-to-r from-white to-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3
              className={`text-lg font-semibold flex items-center gap-2 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              <span aria-hidden="true">🏙️</span> {t("crime_distribution_by_city_and_year", "Distribuição por Cidade")}
            </h3>
            {cityData.length > 6 && (
              <button
                type="button"
                onClick={() => setShowAllCities((prev) => !prev)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  isDark
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-500"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                }`}
              >
                {showAllCities
                  ? t("show_less", "Mostrar menos")
                  : `${t("show_all", "Ver todas")} (${cityData.length})`}
              </button>
            )}
          </div>

          {filters?.unidade && (
            <p
              className={`text-xs mb-4 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {t("unidade_filter_label", "Unidade")}:{" "}
              <strong>{filters.unidade}</strong>
            </p>
          )}

          <div
            className={`space-y-3 ${
              showAllCities && cityData.length > 10 ? "max-h-96 overflow-y-auto pr-2" : ""
            }`}
          >
            {visibleCities.map((item, index) => {
              const pct =
                totalCityCrimes > 0
                  ? ((item.total_crimes / totalCityCrimes) * 100).toFixed(1)
                  : 0;
              const color = BAR_COLORS[index % BAR_COLORS.length];
              return (
                <div key={item.city} className="flex items-center space-x-4">
                  <div
                    className={`w-4 h-4 rounded-full flex-shrink-0 ${color}`}
                    aria-hidden="true"
                  />
                  <div className="flex-1">
                    <div
                      className={`flex justify-between items-center ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      <span className="font-medium text-sm sm:text-base">
                        {item.city}
                      </span>
                      <span className="font-bold text-sm sm:text-base">
                        {pct}%
                      </span>
                    </div>
                    <div
                      className={`w-full ${
                        isDark ? "bg-gray-700" : "bg-gray-200"
                      } rounded-full h-2.5 mt-1 overflow-hidden`}
                    >
                      <div
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        className={`${color} h-2.5 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                      />
                    </div>
                    <div
                      className={`text-xs mt-0.5 ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {item.total_crimes.toLocaleString()}{" "}
                      {t("incidents", "ocorrências")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className={`mt-4 pt-3 border-t text-xs flex flex-wrap justify-between ${
              isDark
                ? "border-gray-700 text-gray-400"
                : "border-gray-200 text-gray-500"
            }`}
          >
            <span>
              {t("total_cities", "Total de cidades")}:{" "}
              <strong>{cityData.length}</strong>
            </span>
            <span>
              {t("total_crimes", "Total de crimes")}:{" "}
              <strong>{totalCityCrimes.toLocaleString()}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardStatistics;
