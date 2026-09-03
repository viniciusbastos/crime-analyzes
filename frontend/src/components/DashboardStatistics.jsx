import React from "react";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "react-i18next";

const DashboardStatistics = ({ summaryData, trendData, temporalData, filters, cityData }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const { yearOverYearData, growthRatesData, movingAveragesData } =
    trendData || {};

  const StatCard = ({
    title,
    value,
    subtitle,
    trend,
    icon,
    color = "blue",
  }) => {
    const colorClasses = {
      blue: isDark
        ? "bg-blue-900 border-blue-700"
        : "bg-blue-50 border-blue-200",
      green: isDark
        ? "bg-green-900 border-green-700"
        : "bg-green-50 border-green-200",
      red: isDark ? "bg-red-900 border-red-700" : "bg-red-50 border-red-200",
      purple: isDark
        ? "bg-purple-900 border-purple-700"
        : "bg-purple-50 border-purple-200",
      orange: isDark
        ? "bg-orange-900 border-orange-700"
        : "bg-orange-50 border-orange-200",
      teal: isDark
        ? "bg-teal-900 border-teal-700"
        : "bg-teal-50 border-teal-200",
    };

    const textColors = {
      blue: isDark ? "text-blue-200" : "text-blue-800",
      green: isDark ? "text-green-200" : "text-green-800",
      red: isDark ? "text-red-200" : "text-red-800",
      purple: isDark ? "text-purple-200" : "text-purple-800",
      orange: isDark ? "text-orange-200" : "text-orange-800",
      teal: isDark ? "text-teal-200" : "text-teal-800",
    };

    return (
      <div
        className={`p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg transform hover:scale-105 ${colorClasses[color]}`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl">{icon}</span>
          {trend && (
            <span
              className={`text-sm font-medium ${
                trend > 0
                  ? "text-red-500"
                  : trend < 0
                  ? "text-green-500"
                  : "text-gray-500"
              }`}
            >
              {trend > 0 ? "↗️" : trend < 0 ? "↘️" : "➡️"}{" "}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
        <div>
          <div className={`text-3xl font-bold mb-1 ${textColors[color]}`}>
            {value}
          </div>
          <div className={`text-sm font-medium ${textColors[color]}`}>
            {title}
          </div>
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
  };

  const calculateWeekendPercentage = () => {
    if (!temporalData?.weekend_comparison) return null;
    const weekday =
      temporalData.weekend_comparison.find((item) => item.period === "Weekday")
        ?.count || 0;
    const weekend =
      temporalData.weekend_comparison.find((item) => item.period === "Weekend")
        ?.count || 0;
    const total = weekday + weekend;
    return total > 0 ? ((weekend / total) * 100).toFixed(1) : 0;
  };

  const calculateHighRiskHours = () => {
    if (!temporalData?.hourly) return null;
    const totalCrimes = temporalData.hourly.reduce(
      (sum, hour) => sum + hour.count,
      0
    );
    const nightCrimes = temporalData.hourly
      .filter((hour) => hour.hour >= 22 || hour.hour <= 4)
      .reduce((sum, hour) => sum + hour.count, 0);
    return totalCrimes > 0 ? ((nightCrimes / totalCrimes) * 100).toFixed(1) : 0;
  };

  const getTopCrimeTypePercentage = () => {
    if (!summaryData?.crime_types || summaryData.crime_types.length === 0)
      return null;
    const topCrime = summaryData.crime_types[0];
    const total = summaryData.total_crimes || 0;
    return total > 0 ? ((topCrime.count / total) * 100).toFixed(1) : 0;
  };

  const getAverageGrowthTrend = () => {
    if (!growthRatesData?.growth_rates) return null;
    return growthRatesData.growth_rates.average_mom_growth;
  };

  const getVolatilityLevel = () => {
    if (!growthRatesData?.growth_rates) return null;
    const volatility = growthRatesData.growth_rates.volatility;

    // Handle extreme volatility values
    if (volatility > 100) return { level: t('extreme'), color: "purple" };
    if (volatility > 75) return { level: t('critical'), color: "red" };
    if (volatility > 50) return { level: t('high'), color: "red" };
    if (volatility > 25) return { level: t('medium'), color: "orange" };
    return { level: t('low'), color: "green" };
  };

  return (
    <div className="space-y-6">
      <h2
        className={`text-2xl font-bold ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        📊 {t('crime_analysis_dashboard')}
      </h2>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('total_crimes_stat')}
          value={summaryData?.total_crimes?.toLocaleString() || "0"}
          subtitle={t('all_recorded_incidents')}
          icon="🚨"
          color="red"
        />

        <StatCard
          title={t('weekend_activity')}
          value={`${calculateWeekendPercentage() || 0}%`}
          subtitle={t('crimes_occurring_on_weekends')}
          icon="📅"
          color="purple"
        />

        <StatCard
          title={t('night_crimes')}
          value={`${calculateHighRiskHours() || 0}%`}
          subtitle={t('night_crimes_subtitle')}
          icon="🌙"
          color="orange"
        />

        <StatCard
          title={t('top_crime_type')}
          value={`${getTopCrimeTypePercentage() || 0}%`}
          subtitle={summaryData?.crime_types?.[0]?.crime_type || t('loading')}
          icon="📋"
          color="teal"
        />
      </div>

      {/* Trends Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title={t('monthly_growth')}
          value={`${getAverageGrowthTrend()?.toFixed(1) || 0}%`}
          subtitle={t('average_month_over_month_change')}
          trend={getAverageGrowthTrend()}
          icon="📈"
          color="blue"
        />

        <StatCard
          title={t('trend_direction_stat')}
          value={
            movingAveragesData?.trend_indicators?.direction?.replace(
              "_",
              " "
            ) || t('stable')
          }
          subtitle={t('current_crime_trend_pattern')}
          icon="🎯"
          color={
            movingAveragesData?.trend_indicators?.direction === "increasing"
              ? "red"
              : movingAveragesData?.trend_indicators?.direction === "decreasing"
              ? "green"
              : "blue"
          }
        />

        <StatCard
          title={t('volatility')}
          value={getVolatilityLevel()?.level || t('unknown')}
          subtitle={`${t('volatility_index')} ${
            growthRatesData?.growth_rates?.volatility?.toFixed(1) || 0
          }`}
          icon="📊"
          color={getVolatilityLevel()?.color || "blue"}
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
              className={`text-lg font-semibold mb-4 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              📅 {t('year_over_year_analysis')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {yearOverYearData.year_over_year.slice(-3).map((yearData) => (
                <div
                  key={yearData.year}
                  className={`p-4 rounded-lg ${
                    isDark ? "bg-gray-700" : "bg-white"
                  } shadow-md`}
                >
                  <div
                    className={`text-lg font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {yearData.year}
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      yearData.change_percent > 0
                        ? "text-red-500"
                        : yearData.change_percent < 0
                        ? "text-green-500"
                        : "text-gray-500"
                    }`}
                  >
                    {yearData.change_percent > 0 ? "+" : ""}
                    {yearData.change_percent}%
                  </div>
                  <div
                    className={`text-sm ${
                      isDark ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {yearData.current_count} {t('crimes')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Top Crime Types Visual */}
      {summaryData?.crime_types && summaryData.crime_types.length > 0 && (
        <div
          className={`p-6 rounded-xl border-2 ${
            isDark
              ? "bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600"
              : "bg-gradient-to-r from-white to-gray-50 border-gray-200"
          }`}
        >
          <h3
            className={`text-lg font-semibold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            🎯 {t('crime_type_distribution')}
          </h3>
          <div className="space-y-3">
            {summaryData.crime_types.slice(0, 5).map((type, index) => {
              const percentage =
                summaryData.total_crimes > 0
                  ? ((type.count / summaryData.total_crimes) * 100).toFixed(1)
                  : 0;
              const colors = [
                "bg-red-500",
                "bg-orange-500",
                "bg-yellow-500",
                "bg-green-500",
                "bg-blue-500",
              ];

              return (
                <div
                  key={type.crime_type}
                  className="flex items-center space-x-4"
                >
                  <div
                    className={`w-4 h-4 rounded-full ${
                      colors[index % colors.length]
                    }`}
                  ></div>
                  <div className="flex-1">
                    <div
                      className={`flex justify-between items-center ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      <span className="font-medium">{type.crime_type}</span>
                      <span className="font-bold">{percentage}%</span>
                    </div>
                    <div
                      className={`w-full ${
                        isDark ? "bg-gray-700" : "bg-gray-200"
                      } rounded-full h-2 mt-1`}
                    >
                      <div
                        className={`${
                          colors[index % colors.length]
                        } h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {type.count.toLocaleString()} {t('incidents')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* City Statistics — shown when filtering by Unidade */}
      {filters?.unidade && cityData && cityData.length > 0 && (
        <div
          className={`p-6 rounded-xl border-2 ${
            isDark
              ? "bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600"
              : "bg-gradient-to-r from-white to-gray-50 border-gray-200"
          }`}
        >
          <h3
            className={`text-lg font-semibold mb-2 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            🏙️ {t("crime_distribution_by_city_and_year", "Distribuição por Cidade")}
          </h3>
          <p className={`text-xs mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {t("unidade_filter_label", "Unidade")}: <strong>{filters.unidade}</strong>
          </p>
          <div className="space-y-3">
            {(() => {
              const totalAll = cityData.reduce((s, c) => s + c.total_crimes, 0);
              const barColors = [
                "bg-blue-500",
                "bg-purple-500",
                "bg-emerald-500",
                "bg-orange-500",
                "bg-rose-500",
                "bg-teal-500",
                "bg-indigo-500",
              ];
              return cityData.map((item, index) => {
                const pct = totalAll > 0 ? ((item.total_crimes / totalAll) * 100).toFixed(1) : 0;
                return (
                  <div key={item.city} className="flex items-center space-x-4">
                    <div
                      className={`w-4 h-4 rounded-full ${barColors[index % barColors.length]}`}
                    />
                    <div className="flex-1">
                      <div
                        className={`flex justify-between items-center ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        <span className="font-medium">{item.city}</span>
                        <span className="font-bold">{pct}%</span>
                      </div>
                      <div
                        className={`w-full ${
                          isDark ? "bg-gray-700" : "bg-gray-200"
                        } rounded-full h-2 mt-1`}
                      >
                        <div
                          className={`${
                            barColors[index % barColors.length]
                          } h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {item.total_crimes.toLocaleString()} {t("incidents", "incidentes")}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          <div
            className={`mt-4 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            {t("total_cities", "Total de cidades")}: {cityData.length} &nbsp;|&nbsp;
            {t("total_crimes", "Total de crimes")}:{" "}
            {cityData.reduce((s, c) => s + c.total_crimes, 0).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardStatistics;
