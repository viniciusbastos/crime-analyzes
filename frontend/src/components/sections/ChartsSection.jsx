import React, { Suspense, lazy } from "react";
import LoadingSpinner from "../LoadingSpinner";

// Lazy load components for code splitting
const CollapsibleFilterBar = lazy(() => import("../CollapsibleFilterBar"));
const ChartsGrid = lazy(() => import("../ChartsGrid"));

const ChartsSection = ({
  filters,
  crimeTypes,
  onApplyFilters,
  onResetFilters,
  temporalData,
  trendData,
  summaryData,
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
        fallback={<LoadingSpinner message="Loading charts..." />}
      >
        <ChartsGrid
          temporalData={temporalData}
          trendData={trendData}
          summaryData={summaryData}
        />
      </Suspense>
    </div>
  );
};

export default ChartsSection;