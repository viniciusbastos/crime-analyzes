import React from "react";
import { useTranslation } from "react-i18next";

const TotalCrimesStat = ({ summaryData, isDark }) => {
  const { t } = useTranslation();
  if (!summaryData?.total_crimes) return null;

  return (
    <div className={isDark ? "text-gray-300" : "text-gray-700"}>
      <strong className={isDark ? "text-white" : "text-gray-900"}>
        {t("total_crimes")}
      </strong>{" "}
      {summaryData.total_crimes.toLocaleString()}
    </div>
  );
};

export default TotalCrimesStat;