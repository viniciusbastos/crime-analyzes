import React from "react";
import { useTheme } from "../hooks/useTheme";
import {
  TotalCrimesStat,
  DateRangeStat,
  YearOverYearStat,
  MonthlyGrowthStat,
  TrendDirectionStat,
  TopCrimeTypesStat,
} from "./statistics";

const StatisticsPanel = ({
  summaryData,
  yearOverYearData,
  growthRatesData,
  movingAveragesData,
}) => {
  const { isDark } = useTheme();

  return (
    <div
      className={`rounded-lg shadow p-6 mb-6 ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } border`}
    >
      <h3
        className={`text-xl font-semibold mb-4 ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Statistics
      </h3>
      {summaryData && (
        <div className="space-y-2">
          <TotalCrimesStat summaryData={summaryData} isDark={isDark} />
          <DateRangeStat summaryData={summaryData} isDark={isDark} />
          <YearOverYearStat
            yearOverYearData={yearOverYearData}
            isDark={isDark}
          />
          <MonthlyGrowthStat
            growthRatesData={growthRatesData}
            isDark={isDark}
          />
          <TrendDirectionStat
            movingAveragesData={movingAveragesData}
            isDark={isDark}
          />
          <TopCrimeTypesStat summaryData={summaryData} isDark={isDark} />
        </div>
      )}
    </div>
  );
};

export default StatisticsPanel;
