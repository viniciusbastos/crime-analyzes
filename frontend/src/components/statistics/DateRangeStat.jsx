import React from "react";

const DateRangeStat = ({ summaryData, isDark }) => {
  if (!summaryData?.date_range) return null;

  const { start, end } = summaryData.date_range;

  return (
    <div className={isDark ? "text-gray-300" : "text-gray-700"}>
      <strong className={isDark ? "text-white" : "text-gray-900"}>
        Date Range:
      </strong>{" "}
      {start && end ? (
        <>
          {new Date(start).toLocaleDateString()} -{" "}
          {new Date(end).toLocaleDateString()}
        </>
      ) : (
        "Loading..."
      )}
    </div>
  );
};

export default DateRangeStat;