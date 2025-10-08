import React from "react";

const TotalCrimesStat = ({ summaryData, isDark }) => {
  if (!summaryData?.total_crimes) return null;

  return (
    <div className={isDark ? "text-gray-300" : "text-gray-700"}>
      <strong className={isDark ? "text-white" : "text-gray-900"}>
        Total Crimes:
      </strong>{" "}
      {summaryData.total_crimes.toLocaleString()}
    </div>
  );
};

export default TotalCrimesStat;