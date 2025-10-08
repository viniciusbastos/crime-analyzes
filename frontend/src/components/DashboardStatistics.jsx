import React from "react";
import { useTheme } from "./ThemeContext";

const DashboardStatistics = ({ summaryData, trendData, temporalData }) => {
  const { isDark } = useTheme();

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
    if (volatility > 100) return { level: "Extreme", color: "purple" };
    if (volatility > 75) return { level: "Critical", color: "red" };
    if (volatility > 50) return { level: "High", color: "red" };
    if (volatility > 25) return { level: "Medium", color: "orange" };
    return { level: "Low", color: "green" };
  };

  return (
    <div className="space-y-6">
      <h2
        className={`text-2xl font-bold ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        📊 Crime Analytics Dashboard
      </h2>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Crimes"
          value={summaryData?.total_crimes?.toLocaleString() || "0"}
          subtitle="All recorded incidents"
          icon="🚨"
          color="red"
        />

        <StatCard
          title="Weekend Activity"
          value={`${calculateWeekendPercentage() || 0}%`}
          subtitle="Crimes occurring on weekends"
          icon="📅"
          color="purple"
        />

        <StatCard
          title="Night Crimes"
          value={`${calculateHighRiskHours() || 0}%`}
          subtitle="22:00 - 04:00 time window"
          icon="🌙"
          color="orange"
        />

        <StatCard
          title="Top Crime Type"
          value={`${getTopCrimeTypePercentage() || 0}%`}
          subtitle={summaryData?.crime_types?.[0]?.crime_type || "Loading..."}
          icon="📋"
          color="teal"
        />
      </div>

      {/* Trends Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Monthly Growth"
          value={`${getAverageGrowthTrend()?.toFixed(1) || 0}%`}
          subtitle="Average month-over-month change"
          trend={getAverageGrowthTrend()}
          icon="📈"
          color="blue"
        />

        <StatCard
          title="Trend Direction"
          value={
            movingAveragesData?.trend_indicators?.direction?.replace(
              "_",
              " "
            ) || "Stable"
          }
          subtitle="Current crime trend pattern"
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
          title="Volatility"
          value={getVolatilityLevel()?.level || "Unknown"}
          subtitle={`${
            growthRatesData?.growth_rates?.volatility?.toFixed(1) || 0
          } volatility index`}
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
              📅 Year-over-Year Analysis
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
                    {yearData.current_count} crimes
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
            🎯 Crime Type Distribution
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
                      {type.count.toLocaleString()} incidents
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardStatistics;
