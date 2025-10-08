import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Card, useTheme } from "react-native-paper";
import StatCard from "./StatCard";

const DashboardStatistics = ({ summaryData, trendData, temporalData }) => {
  const theme = useTheme();
  const { yearOverYearData, growthRatesData, movingAveragesData } =
    trendData || {};

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

    if (volatility > 100) return { level: "Extreme", color: "purple" };
    if (volatility > 75) return { level: "Critical", color: "red" };
    if (volatility > 50) return { level: "High", color: "red" };
    if (volatility > 25) return { level: "Medium", color: "orange" };
    return { level: "Low", color: "green" };
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Key Metrics Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Key Metrics
        </Text>
        <View style={styles.cardsList}>
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
        </View>
      </View>

      {/* Trends Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Trends & Analysis
        </Text>
        <View style={styles.cardsList}>
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
                : movingAveragesData?.trend_indicators?.direction ===
                  "decreasing"
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
        </View>
      </View>

      {/* Year-over-Year Comparison */}
      {yearOverYearData?.year_over_year &&
        yearOverYearData.year_over_year.length > 0 && (
          <Card
            style={[
              styles.yearOverYearCard,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <Card.Content>
              <Text
                style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
              >
                📅 Year-over-Year Analysis
              </Text>
              <View style={styles.yearGrid}>
                {yearOverYearData.year_over_year.slice(-3).map((yearData) => (
                  <View
                    key={yearData.year}
                    style={[
                      styles.yearCard,
                      { backgroundColor: theme.colors.surface },
                    ]}
                  >
                    <Text
                      style={[
                        styles.yearTitle,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {yearData.year}
                    </Text>
                    <Text
                      style={[
                        styles.yearValue,
                        {
                          color:
                            yearData.change_percent > 0
                              ? theme.colors.error
                              : yearData.change_percent < 0
                              ? theme.colors.primary
                              : theme.colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {yearData.change_percent > 0 ? "+" : ""}
                      {yearData.change_percent}%
                    </Text>
                    <Text
                      style={[
                        styles.yearSubtitle,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {yearData.current_count} crimes
                    </Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

      {/* Top Crime Types Visual */}
      {summaryData?.crime_types && summaryData.crime_types.length > 0 && (
        <Card
          style={[
            styles.crimeTypesCard,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Card.Content>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              🎯 Crime Type Distribution
            </Text>
            <View style={styles.crimeTypesList}>
              {summaryData.crime_types.slice(0, 5).map((type, index) => {
                const percentage =
                  summaryData.total_crimes > 0
                    ? ((type.count / summaryData.total_crimes) * 100).toFixed(1)
                    : 0;
                const colors = [
                  "#dc2626",
                  "#ea580c",
                  "#ca8a04",
                  "#16a34a",
                  "#2563eb",
                ];

                return (
                  <View key={type.crime_type} style={styles.crimeTypeItem}>
                    <View
                      style={[
                        styles.colorIndicator,
                        { backgroundColor: colors[index % colors.length] },
                      ]}
                    />
                    <View style={styles.crimeTypeContent}>
                      <View style={styles.crimeTypeHeader}>
                        <Text
                          style={[
                            styles.crimeTypeName,
                            { color: theme.colors.onSurface },
                          ]}
                        >
                          {type.crime_type}
                        </Text>
                        <Text
                          style={[
                            styles.crimeTypePercentage,
                            { color: theme.colors.onSurface },
                          ]}
                        >
                          {percentage}%
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.progressBar,
                          { backgroundColor: theme.colors.surfaceVariant },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${percentage}%`,
                              backgroundColor: colors[index % colors.length],
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.crimeTypeCount,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        {type.count.toLocaleString()} incidents
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  cardsList: {
    gap: 12,
  },
  yearOverYearCard: {
    marginBottom: 24,
  },
  yearGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  yearCard: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  yearTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  yearValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  yearSubtitle: {
    fontSize: 12,
  },
  crimeTypesCard: {
    marginBottom: 24,
  },
  crimeTypesList: {
    gap: 16,
  },
  crimeTypeItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  crimeTypeContent: {
    flex: 1,
  },
  crimeTypeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  crimeTypeName: {
    fontSize: 14,
    fontWeight: "600",
  },
  crimeTypePercentage: {
    fontSize: 14,
    fontWeight: "bold",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  crimeTypeCount: {
    fontSize: 12,
  },
});

export default DashboardStatistics;
