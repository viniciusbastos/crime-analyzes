import React, { Suspense, lazy } from "react";
import LoadingSpinner from "../LoadingSpinner";

// Lazy load components for code splitting
const CollapsibleFilterBar = lazy(() => import("../CollapsibleFilterBar"));
const ChatInterface = lazy(() => import("../ChatInterface"));

const ChatSection = ({ filters, crimeTypes, onApplyFilters, onResetFilters }) => {
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
      <div className="h-[calc(100vh-200px)]">
        <Suspense
          fallback={<LoadingSpinner message="Loading AI assistant..." />}
        >
          <ChatInterface filters={filters} />
        </Suspense>
      </div>
    </div>
  );
};

export default ChatSection;