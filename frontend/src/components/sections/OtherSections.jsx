import React, { Suspense, lazy } from "react";
import LoadingSpinner from "../LoadingSpinner";

// Lazy load components for code splitting
const FilterPanel = lazy(() => import("../FilterPanel"));
const DataUpload = lazy(() => import("../DataUpload"));
const ExportPanel = lazy(() => import("../ExportPanel"));
const CacheStatus = lazy(() => import("../CacheStatus"));
const CrimeManagement = lazy(() => import("../CrimeManagement"));
const UserManagement = lazy(() => import("../UserManagement"));

const OtherSections = ({
  activeSection,
  filters,
  crimeTypes,
  onApplyFilters,
  onResetFilters,
  onUpload,
  uploadStatus,
}) => {
  const renderSection = () => {
    switch (activeSection) {
      case "filters":
        return (
          <Suspense
            fallback={<LoadingSpinner message="Loading filters..." />}
          >
            <FilterPanel
              filters={filters}
              crimeTypes={crimeTypes}
              onApplyFilters={onApplyFilters}
              onResetFilters={onResetFilters}
            />
          </Suspense>
        );
      case "upload":
        return (
          <Suspense
            fallback={<LoadingSpinner message="Loading upload..." />}
          >
            <DataUpload
              onUpload={onUpload}
              uploadStatus={uploadStatus}
            />
          </Suspense>
        );
      case "export":
        return (
          <Suspense
            fallback={<LoadingSpinner message="Loading export..." />}
          >
            <ExportPanel />
          </Suspense>
        );
      case "cache":
        return <CacheStatus />;
      case "crimes":
        return (
          <Suspense
            fallback={<LoadingSpinner message="Loading crime management..." />}
          >
            <CrimeManagement />
          </Suspense>
        );
      case "users":
        return (
          <Suspense
            fallback={<LoadingSpinner message="Loading user management..." />}
          >
            <UserManagement />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return renderSection();
};

export default OtherSections;