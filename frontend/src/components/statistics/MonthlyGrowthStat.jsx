import React from "react";

const MonthlyGrowthStat = ({ growthRatesData, isDark }) => {
  if (!growthRatesData?.growth_rates?.average_mom_growth) return null;

  const growth = growthRatesData.growth_rates.average_mom_growth;
  const color =
    growth > 0
      ? "text-red-500"
      : growth < 0
      ? "text-green-500"
      : "text-gray-500";

  return (
    <div className={isDark ? "text-gray-300" : "text-gray-700"}>
      <strong className={isDark ? "text-white" : "text-gray-900"}>
        Avg Monthly Growth:
      </strong>{" "}
      <span className={color}>
        {growth > 0 ? "+" : ""}
        {growth.toFixed(1)}%
      </span>
    </div>
  );
};

export default MonthlyGrowthStat;