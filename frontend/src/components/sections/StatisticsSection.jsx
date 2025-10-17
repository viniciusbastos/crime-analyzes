import React, { Suspense, lazy } from "react";
import LoadingSpinner from "../LoadingSpinner";

// Lazy load components for code splitting
const CollapsibleFilterBar = lazy(() => import("../CollapsibleFilterBar"));
const DashboardStatistics = lazy(() => import("../DashboardStatistics"));

const StatisticsSection = ({
  filters,
  crimeTypes,
  onApplyFilters,
  onResetFilters,
  summaryData,
  temporalData,
  trendData,
}) => {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={<LoadingSpinner message="Loading filters..." />}
      >
        <CollapsibleFilterBar
          filters={filters}
          crimeTypes={crimeTypes}
          onApplyFilters={onApplyFilters}
          onResetFilters={onResetFilters}
        />
      </Suspense>
      <Suspense
        fallback={<LoadingSpinner message="Loading statistics..." />}
      >
        <DashboardStatistics
          summaryData={summaryData}
          temporalData={temporalData}
          trendData={trendData}
        />
      </Suspense>
    </div>
  );
};

export default StatisticsSection;