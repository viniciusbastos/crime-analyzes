import React, { useState, Suspense, lazy } from "react";
import DashboardHeader from "./DashboardHeader";
import FilterPanel from "./FilterPanel";
import CollapsibleFilterBar from "./CollapsibleFilterBar";
import Sidebar from "./Sidebar";
import CacheStatus from "./CacheStatus";
import LoadingSpinner from "./LoadingSpinner";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "react-i18next";
import {
  useCrimeDataSets,
  useInvalidateQueries,
  useGeoJsonData,
} from "../hooks/useCrimeData";

// Lazy load heavy components
const CrimeMap = lazy(() => import("./CrimeMap"));
const ClusterMap = lazy(() => import("./ClusterMap"));
const StatisticsPanel = lazy(() => import("./StatisticsPanel"));
const DashboardStatistics = lazy(() => import("./DashboardStatistics"));
const ChartsGrid = lazy(() => import("./ChartsGrid"));
const ChatInterface = lazy(() => import("./ChatInterface"));
const ExportPanel = lazy(() => import("./ExportPanel"));
const DataUpload = lazy(() => import("./DataUpload"));
const CrimeManagement = lazy(() => import("./CrimeManagement"));

const CrimeDashboard = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [filters, setFilters] = useState({});
  const [uploadStatus, setUploadStatus] = useState({ message: "", type: "" });
  const [mapCenter, setMapCenter] = useState([40.7128, -74.006]);
  const [mapZoom, setMapZoom] = useState(10);
  const [showContours, setShowContours] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [mapType, setMapType] = useState("heatmap"); // "heatmap" or "cluster"

  // Determine if map data should be loaded (only when map section is active or dashboard with maps)
  const shouldLoadMapData =
    activeSection === "map" || activeSection === "dashboard";

  // Use React Query hooks for data fetching with lazy loading
  const {
    heatmapData,
    densityData,
    summaryData,
    temporalData,
    spatialData,
    yearOverYearData,
    growthRatesData,
    movingAveragesData,
    weeklyMovingAveragesData,
    forecastData,
    cityData,
    semesterComparisonData,
    crimeTypes,
    isLoadingEssential,
    refetchAll,
  } = useCrimeDataSets(filters, shouldLoadMapData);

  // Get GeoJSON data for cluster map
  const { data: geoJsonData, isLoading: geoJsonLoading } =
    useGeoJsonData(filters);

  useInvalidateQueries();

  // Update map view based on data
  React.useEffect(() => {
    const updateMapView = () => {
      if (densityData && densityData.bounds) {
        const bounds = densityData.bounds;
        const centerLat = (bounds.min_lat + bounds.max_lat) / 2;
        const centerLng = (bounds.min_lng + bounds.max_lng) / 2;
        setMapCenter([centerLat, centerLng]);

        const latRange = bounds.max_lat - bounds.min_lat;
        const lngRange = bounds.max_lng - bounds.min_lng;
        const maxRange = Math.max(latRange, lngRange);

        let zoom = 10;
        if (maxRange < 0.01) zoom = 15;
        else if (maxRange < 0.1) zoom = 12;
        else if (maxRange < 1) zoom = 10;
        else if (maxRange < 5) zoom = 8;
        else zoom = 6;

        setMapZoom(zoom);
      } else if (heatmapData && heatmapData.length > 0) {
        const avgLat =
          heatmapData.reduce((sum, point) => sum + point[0], 0) /
          heatmapData.length;
        const avgLng =
          heatmapData.reduce((sum, point) => sum + point[1], 0) /
          heatmapData.length;
        setMapCenter([avgLat, avgLng]);

        const lats = heatmapData.map((point) => point[0]);
        const lngs = heatmapData.map((point) => point[1]);
        const latRange = Math.max(...lats) - Math.min(...lats);
        const lngRange = Math.max(...lngs) - Math.min(...lngs);
        const maxRange = Math.max(latRange, lngRange);

        let zoom = 10;
        if (maxRange < 0.01) zoom = 15;
        else if (maxRange < 0.1) zoom = 12;
        else if (maxRange < 1) zoom = 10;
        else if (maxRange < 5) zoom = 8;
        else zoom = 6;

        setMapZoom(zoom);
      } else {
        setMapCenter([40.7128, -74.006]);
        setMapZoom(10);
      }
    };

    updateMapView();
  }, [heatmapData, densityData]);

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const resetFilters = () => {
    setFilters({});
  };

  const handleUploadStatus = (message, type) => {
    setUploadStatus({ message, type });
    if (type === "success") {
      // React Query will automatically refetch after successful upload
      setTimeout(() => refetchAll(), 1000);
    }
  };

  // Show loading for essential data first
  if (isLoadingEssential) {
    return (
      <div
        className={`flex justify-center items-center h-screen ${
          isDark ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        <div className="text-center">
          <LoadingSpinner message={t("loading_essential_data")} />
          <p className="mt-2 text-sm opacity-75">{t("loading_dashboard")}</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-6">
            {/* Collapsible Filter Bar at top */}
            <CollapsibleFilterBar
              filters={filters}
              crimeTypes={crimeTypes}
              onApplyFilters={applyFilters}
              onResetFilters={resetFilters}
            />

            {/* Dashboard Statistics Grid */}
            <Suspense
              fallback={<LoadingSpinner message={t("loading_statistics")} />}
            >
              <DashboardStatistics
                summaryData={summaryData}
                temporalData={temporalData}
                trendData={{
                  yearOverYearData,
                  growthRatesData,
                  movingAveragesData,
                  weeklyMovingAveragesData,
                  forecastData,
                }}
              />
            </Suspense>

            {/* Main Dashboard Content */}
            <div className="flex flex-col lg:flex-row ">
              <div className="lg">
                {/* Map Type Toggle */}
                <div className="mb-4 flex gap-2">
                  <button
                    onClick={() => setMapType("heatmap")}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${
                      mapType === "heatmap"
                        ? "bg-blue-600 text-white"
                        : isDark
                        ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {t("crime_density_map")}
                  </button>
                  <button
                    onClick={() => setMapType("cluster")}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${
                      mapType === "cluster"
                        ? "bg-blue-600 text-white"
                        : isDark
                        ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {t("cluster_map_title")}
                  </button>
                </div>

                {mapType === "heatmap" ? (
                  <Suspense
                    fallback={<LoadingSpinner message={t("loading_map")} />}
                  >
                    <CrimeMap
                      heatmapData={heatmapData}
                      densityData={densityData}
                      spatialData={spatialData}
                      mapCenter={mapCenter}
                      mapZoom={mapZoom}
                      showContours={showContours}
                      onToggleContours={() => setShowContours(!showContours)}
                    />
                  </Suspense>
                ) : (
                  <Suspense
                    fallback={<LoadingSpinner message={t("loading_map")} />}
                  >
                    <ClusterMap
                      geoJsonData={geoJsonData}
                      isLoading={geoJsonLoading}
                    />
                  </Suspense>
                )}

                <Suspense
                  fallback={<LoadingSpinner message={t("loading_charts")} />}
                >
                  <ChartsGrid
                    temporalData={temporalData}
                    trendData={{
                      yearOverYearData,
                      growthRatesData,
                      movingAveragesData,
                      forecastData,
                    }}
                    summaryData={summaryData}
                    cityData={cityData}
                    semesterComparisonData={semesterComparisonData}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        );
      case "statistics":
        return (
          <div className="space-y-6">
            <CollapsibleFilterBar
              filters={filters}
              crimeTypes={crimeTypes}
              onApplyFilters={applyFilters}
              onResetFilters={resetFilters}
            />
            <Suspense
              fallback={<LoadingSpinner message={t("loading_statistics")} />}
            >
              <DashboardStatistics
                summaryData={summaryData}
                temporalData={temporalData}
                trendData={{
                  yearOverYearData,
                  growthRatesData,
                  movingAveragesData,
                  weeklyMovingAveragesData,
                  forecastData,
                }}
              />
            </Suspense>
          </div>
        );
      case "map":
        return (
          <div className="space-y-6">
            <CollapsibleFilterBar
              filters={filters}
              crimeTypes={crimeTypes}
              onApplyFilters={applyFilters}
              onResetFilters={resetFilters}
            />

            {/* Map Type Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setMapType("heatmap")}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  mapType === "heatmap"
                    ? "bg-blue-600 text-white"
                    : isDark
                    ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {t("crime_density_map")}
              </button>
              <button
                onClick={() => setMapType("cluster")}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  mapType === "cluster"
                    ? "bg-blue-600 text-white"
                    : isDark
                    ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {t("cluster_map_title")}
              </button>
            </div>

            {mapType === "heatmap" ? (
              <Suspense
                fallback={<LoadingSpinner message={t("loading_map")} />}
              >
                <CrimeMap
                  heatmapData={heatmapData}
                  densityData={densityData}
                  spatialData={spatialData}
                  mapCenter={mapCenter}
                  mapZoom={mapZoom}
                  showContours={showContours}
                  onToggleContours={() => setShowContours(!showContours)}
                />
              </Suspense>
            ) : (
              <Suspense
                fallback={<LoadingSpinner message={t("loading_map")} />}
              >
                <ClusterMap
                  geoJsonData={geoJsonData}
                  isLoading={geoJsonLoading}
                />
              </Suspense>
            )}
          </div>
        );
      case "charts":
        return (
          <div className="space-y-6">
            <CollapsibleFilterBar
              filters={filters}
              crimeTypes={crimeTypes}
              onApplyFilters={applyFilters}
              onResetFilters={resetFilters}
            />
            <Suspense
              fallback={<LoadingSpinner message={t("loading_charts")} />}
            >
              <ChartsGrid
                temporalData={temporalData}
                trendData={{
                  yearOverYearData,
                  growthRatesData,
                  movingAveragesData,
                  weeklyMovingAveragesData,
                  forecastData,
                }}
                summaryData={summaryData}
              />
            </Suspense>
          </div>
        );
      case "chat":
        return (
          <div className="space-y-6">
            <CollapsibleFilterBar
              filters={filters}
              crimeTypes={crimeTypes}
              onApplyFilters={applyFilters}
              onResetFilters={resetFilters}
            />
            <div className="h-[calc(100vh-200px)]">
              <Suspense
                fallback={
                  <LoadingSpinner message={t("loading_ai_assistant")} />
                }
              >
                <ChatInterface filters={filters} />
              </Suspense>
            </div>
          </div>
        );
      case "filters":
        return (
          <Suspense
            fallback={<LoadingSpinner message={t("loading_filters")} />}
          >
            <FilterPanel
              filters={filters}
              crimeTypes={crimeTypes}
              onApplyFilters={applyFilters}
              onResetFilters={resetFilters}
            />
          </Suspense>
        );
      case "upload":
        return (
          <Suspense fallback={<LoadingSpinner message={t("loading_upload")} />}>
            <DataUpload
              onUpload={handleUploadStatus}
              uploadStatus={uploadStatus}
            />
          </Suspense>
        );
      case "export":
        return (
          <Suspense fallback={<LoadingSpinner message={t("loading_export")} />}>
            <ExportPanel />
          </Suspense>
        );
      case "cache":
        return <CacheStatus />;
      case "crimes":
        return (
          <Suspense
            fallback={
              <LoadingSpinner message={t("loading_crime_management")} />
            }
          >
            <CrimeManagement />
          </Suspense>
        );
      default:
        return (
          <div className="space-y-6">
            {/* Collapsible Filter Bar at top */}
            <CollapsibleFilterBar
              filters={filters}
              crimeTypes={crimeTypes}
              onApplyFilters={applyFilters}
              onResetFilters={resetFilters}
            />

            {/* Dashboard Statistics Grid */}
            <DashboardStatistics
              summaryData={summaryData}
              temporalData={temporalData}
              trendData={{
                yearOverYearData,
                growthRatesData,
                movingAveragesData,
                forecastData,
              }}
            />

            {/* Main Dashboard Content */}
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg">
                {/* Map Type Toggle */}
                <div className="mb-4 flex gap-2">
                  <button
                    onClick={() => setMapType("heatmap")}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${
                      mapType === "heatmap"
                        ? "bg-blue-600 text-white"
                        : isDark
                        ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {t("crime_density_map")}
                  </button>
                  <button
                    onClick={() => setMapType("cluster")}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${
                      mapType === "cluster"
                        ? "bg-blue-600 text-white"
                        : isDark
                        ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {t("cluster_map_title")}
                  </button>
                </div>

                {mapType === "heatmap" ? (
                  <CrimeMap
                    heatmapData={heatmapData}
                    densityData={densityData}
                    spatialData={spatialData}
                    mapCenter={mapCenter}
                    mapZoom={mapZoom}
                    showContours={showContours}
                    onToggleContours={() => setShowContours(!showContours)}
                  />
                ) : (
                  <ClusterMap
                    geoJsonData={geoJsonData}
                    isLoading={geoJsonLoading}
                  />
                )}

                <ChartsGrid
                  temporalData={temporalData}
                  trendData={{
                    yearOverYearData,
                    growthRatesData,
                    movingAveragesData,
                    forecastData,
                  }}
                  summaryData={summaryData}
                />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className={`min-h-screen flex ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <div className="flex-1 flex flex-col lg:ml-0">
        <DashboardHeader />
        <main className="flex-1 overflow-auto pt-16 lg:pt-0">
          <div className="p-4 lg:p-6">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

export default CrimeDashboard;
