import React from "react";
import { useTranslation } from "react-i18next";

const YearOverYearStat = ({ yearOverYearData, isDark }) => {
  const { t } = useTranslation();
  if (!yearOverYearData?.year_over_year?.length) return null;

  const latest = yearOverYearData.year_over_year.slice(-1)[0];
  const change = latest.change_percent;
  const color =
    change > 0
      ? "text-red-500"
      : change < 0
      ? "text-green-500"
      : "text-gray-500";

  return (
    <div className={isDark ? "text-gray-300" : "text-gray-700"}>
      <strong className={isDark ? "text-white" : "text-gray-900"}>
        {t("latest_year_over_year_change")}
      </strong>{" "}
      <span className={color}>
        {change > 0 ? "+" : ""}
        {change}%
      </span>
    </div>
  );
};

export default YearOverYearStat;