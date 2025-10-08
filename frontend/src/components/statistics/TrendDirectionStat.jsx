import React from "react";
import { useTranslation } from "react-i18next";

const TrendDirectionStat = ({ movingAveragesData, isDark }) => {
  const { t } = useTranslation();
  if (!movingAveragesData?.trend_indicators?.direction) return null;

  const direction = movingAveragesData.trend_indicators.direction;
  const color =
    direction === "increasing"
      ? "text-red-500"
      : direction === "Decreasing"
      ? "text-green-500"
      : "text-gray-500";

  return (
    <div className={isDark ? "text-gray-300" : "text-gray-700"}>
      <strong className={isDark ? "text-white" : "text-gray-900"}>
        {t("trend_direction")}
      </strong>{" "}
      <span className={`capitalize ${color}`}>
        {direction.replace("_", " ")}
      </span>
    </div>
  );
};

export default TrendDirectionStat;
