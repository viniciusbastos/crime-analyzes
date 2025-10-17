import React, { useState, Suspense, lazy } from "react";
import DashboardHeader from "./DashboardHeader";
import Sidebar from "./Sidebar";
import LoadingSpinner from "./LoadingSpinner";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "react-i18next";
import {
  useCrimeDataSets,
  useInvalidateQueries,
  useGeoJsonData,
} from "../hooks/useCrimeData";

// Lazy load section components for code splitting
const DashboardSection = lazy(() => import("./sections/DashboardSection"));
const StatisticsSection = lazy(() => import("./sections/StatisticsSection"));
const MapSection = lazy(() => import("./sections/MapSection"));
const ChartsSection = lazy(() => import("./sections/ChartsSection"));
const ChatSection = lazy(() => import("./sections/ChatSection"));
const OtherSections = lazy(() => import("./sections/OtherSections"));

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
          <Suspense
            fallback={<LoadingSpinner message={t("loading_dashboard")} />}
          >
            <DashboardSection
              filters={filters}
              crimeTypes={crimeTypes}
              onApplyFilters={applyFilters}
              onResetFilters={resetFilters}
              summaryData={summaryData}
              temporalData={temporalData}
              trendData={{
                yearOverYearData,
                growthRatesData,
                movingAveragesData,
                weeklyMovingAveragesData,
                forecastData,
              }}
              heatmapData={heatmapData}
              densityData={densityData}
              spatialData={spatialData}
              geoJsonData={geoJsonData}
              isGeoJsonLoading={geoJsonLoading}
              mapCenter={mapCenter}
              mapZoom={mapZoom}
              showContours={showContours}
              onToggleContours={() => setShowContours(!showContours)}
              mapType={mapType}
              setMapType={setMapType}
            />
          </Suspense>
        );
      case "statistics":
        return (
          <Suspense
            fallback={<LoadingSpinner message={t("loading_statistics")} />}
          >
            <StatisticsSection
              filters={filters}
              crimeTypes={crimeTypes}
              onApplyFilters={applyFilters}
              onResetFilters={resetFilters}
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
        );
      case "map":
        return (
          <Suspense fallback={<LoadingSpinner message={t("loading_map")} />}>
            <MapSection
              filters={filters}
              crimeTypes={crimeTypes}
              onApplyFilters={applyFilters}
              onResetFilters={resetFilters}
              heatmapData={heatmapData}
              densityData={densityData}
              spatialData={spatialData}
              geoJsonData={geoJsonData}
              isGeoJsonLoading={geoJsonLoading}
              mapCenter={mapCenter}
              mapZoom={mapZoom}
              showContours={showContours}
              onToggleContours={() => setShowContours(!showContours)}
              mapType={mapType}
              setMapType={setMapType}
            />
          </Suspense>
        );
      case "charts":
        return (
          <Suspense fallback={<LoadingSpinner message={t("loading_charts")} />}>
            <ChartsSection
              filters={filters}
              crimeTypes={crimeTypes}
              onApplyFilters={applyFilters}
              onResetFilters={resetFilters}
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
        );
      case "chat":
        return (
          <Suspense
            fallback={<LoadingSpinner message={t("loading_ai_assistant")} />}
          >
            <ChatSection
              filters={filters}
              crimeTypes={crimeTypes}
              onApplyFilters={applyFilters}
              onResetFilters={resetFilters}
            />
          </Suspense>
        );
      default:
        return (
          <Suspense
            fallback={<LoadingSpinner message={t("loading_section")} />}
          >
            <OtherSections
              activeSection={activeSection}
              filters={filters}
              crimeTypes={crimeTypes}
              onApplyFilters={applyFilters}
              onResetFilters={resetFilters}
              onUpload={handleUploadStatus}
              uploadStatus={uploadStatus}
            />
          </Suspense>
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
