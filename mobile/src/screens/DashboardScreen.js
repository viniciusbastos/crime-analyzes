import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import { useCrimeDataSets } from "../hooks/useCrimeData";
import DashboardStatistics from "../components/DashboardStatistics";
import FiltersDashboard from "../components/FiltersDashboard";

const DashboardScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [filters, setFilters] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // Use React Query hooks for data fetching
  const {
    summaryData,
    temporalData,
    yearOverYearData,
    growthRatesData,
    movingAveragesData,
    weeklyMovingAveragesData,
    forecastData,
    isLoading,
    refetchAll,
  } = useCrimeDataSets(filters);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchAll();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            {t("loading", "Loading...")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
           Crime Analytics Dashboard
        </Text>
        <FiltersDashboard
          filters={filters}
          onFiltersChange={setFilters}
          isRefreshing={refreshing}
        />
        <DashboardStatistics
          summaryData={summaryData}
          temporalData={temporalData}
          trendData={{
            yearOverYearData,
            growthRatesData,
            movingAveragesData,
            weeklyMovingAveragesData,
            forecastData,
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    paddingTop: 20,
    paddingHorizontal: 20,
  },
});

export default DashboardScreen;