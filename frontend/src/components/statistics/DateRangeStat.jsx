import React from "react";
import { useTranslation } from "react-i18next";

const DateRangeStat = ({ summaryData, isDark }) => {
  const { t } = useTranslation();
  if (!summaryData?.date_range) return null;

  const { start, end } = summaryData.date_range;

  return (
    <div className={isDark ? "text-gray-300" : "text-gray-700"}>
      <strong className={isDark ? "text-white" : "text-gray-900"}>
        {t("date_range")}
      </strong>{" "}
      {start && end ? (
        <>
          {new Date(start).toLocaleDateString()} -{" "}
          {new Date(end).toLocaleDateString()}
        </>
      ) : (
        t("loading")
      )}
    </div>
  );
};

export default DateRangeStat;