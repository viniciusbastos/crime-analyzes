import React, { Suspense, lazy } from "react";
import LoadingSpinner from "../LoadingSpinner";

// Lazy load components for code splitting
const CollapsibleFilterBar = lazy(() => import("../CollapsibleFilterBar"));
const DashboardStatistics = lazy(() => import("../DashboardStatistics"));
const ChartsGrid = lazy(() => import("../ChartsGrid"));
const CrimeMap = lazy(() => import("../CrimeMap"));
const ClusterMap = lazy(() => import("../ClusterMap"));

const DashboardSection = ({
  filters,
  crimeTypes,
  onApplyFilters,
  onResetFilters,
  summaryData,
  temporalData,
  trendData,
  heatmapData,
  densityData,
  spatialData,
  geoJsonData,
  isGeoJsonLoading,
  mapCenter,
  mapZoom,
  showContours,
  onToggleContours,
  mapType,
  setMapType,
}) => {
  return (
    <div className="space-y-6">
      {/* Collapsible Filter Bar at top */}
      <div className="mb-6">
        <Suspense fallback={<LoadingSpinner message="Loading filters..." />}>
          <CollapsibleFilterBar
            filters={filters}
            crimeTypes={crimeTypes}
            onApplyFilters={onApplyFilters}
            onResetFilters={onResetFilters}
          />
        </Suspense>
      </div>

      {/* Dashboard Statistics Grid */}
      <Suspense fallback={<LoadingSpinner message="Loading statistics..." />}>
        <DashboardStatistics
          summaryData={summaryData}
          temporalData={temporalData}
          trendData={trendData}
        />
      </Suspense>

      {/* Main Dashboard Content */}
      <div className="flex flex-col lg:flex-row">
        <div className="lg:flex-1">
          {/* Map Type Toggle */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setMapType("heatmap")}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                mapType === "heatmap"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Crime Density Map
            </button>
            <button
              onClick={() => setMapType("cluster")}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                mapType === "cluster"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Cluster Map
            </button>
          </div>

          {mapType === "heatmap" ? (
            <Suspense fallback={<LoadingSpinner message="Loading map..." />}>
              <CrimeMap
                heatmapData={heatmapData}
                densityData={densityData}
                spatialData={spatialData}
                mapCenter={mapCenter}
                mapZoom={mapZoom}
                showContours={showContours}
                onToggleContours={onToggleContours}
              />
            </Suspense>
          ) : (
            <Suspense fallback={<LoadingSpinner message="Loading map..." />}>
              <ClusterMap
                geoJsonData={geoJsonData}
                isLoading={isGeoJsonLoading}
              />
            </Suspense>
          )}

          <Suspense fallback={<LoadingSpinner message="Loading charts..." />}>
            <ChartsGrid
              temporalData={temporalData}
              trendData={trendData}
              summaryData={summaryData}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default DashboardSection;
