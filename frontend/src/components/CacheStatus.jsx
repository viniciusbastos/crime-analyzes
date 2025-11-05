import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "../hooks/useTheme";
import axios from "axios";
import { useTranslation } from "react-i18next";

const CacheStatus = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  // Query to get cache statistics from backend
  const {
    data: cacheStats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["cacheStats"],
    queryFn: async () => {
      const response = await axios.get("/api/cache/stats");
      return response.data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 0, // Always consider stale to get fresh stats
  });

  if (isLoading) return <div>{t("loading_cache_stats")}</div>;
  if (error)
    return (
      <div>
        {t("error_loading_cache_stats")}: {error.message}
      </div>
    );

  const calculateHitRate = () => {
    const hits = cacheStats?.keyspace_hits || 0;
    const misses = cacheStats?.keyspace_misses || 0;
    const total = hits + misses;
    return total > 0 ? ((hits / total) * 100).toFixed(2) : "0.00";
  };

  return (
    <div
      className={`p-6 rounded-lg shadow-md ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } border`}
    >
      <h3
        className={`text-lg font-semibold mb-4 ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        🚀 {t("cache_performance_status")}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-lg ${isDark ? "bg-blue-900" : "bg-blue-50"}`}
        >
          <div
            className={`text-2xl font-bold ${
              isDark ? "text-blue-200" : "text-blue-800"
            }`}
          >
            {calculateHitRate()}%
          </div>
          <div
            className={`text-sm ${isDark ? "text-blue-300" : "text-blue-600"}`}
          >
            {t("cache_hit_rate")}
          </div>
        </div>

        <div
          className={`p-4 rounded-lg ${
            isDark ? "bg-green-900" : "bg-green-50"
          }`}
        >
          <div
            className={`text-2xl font-bold ${
              isDark ? "text-green-200" : "text-green-800"
            }`}
          >
            {cacheStats?.connected_clients || 0}
          </div>
          <div
            className={`text-sm ${
              isDark ? "text-green-300" : "text-green-600"
            }`}
          >
            {t("active_connections")}
          </div>
        </div>

        <div
          className={`p-4 rounded-lg ${
            isDark ? "bg-purple-900" : "bg-purple-50"
          }`}
        >
          <div
            className={`text-2xl font-bold ${
              isDark ? "text-purple-200" : "text-purple-800"
            }`}
          >
            {cacheStats?.used_memory_human || "0B"}
          </div>
          <div
            className={`text-sm ${
              isDark ? "text-purple-300" : "text-purple-600"
            }`}
          >
            {t("memory_usage")}
          </div>
        </div>

        <div
          className={`p-4 rounded-lg ${
            isDark ? "bg-orange-900" : "bg-orange-50"
          }`}
        >
          <div
            className={`text-2xl font-bold ${
              isDark ? "text-orange-200" : "text-orange-800"
            }`}
          >
            {cacheStats?.total_commands_processed || 0}
          </div>
          <div
            className={`text-sm ${
              isDark ? "text-orange-300" : "text-orange-600"
            }`}
          >
            {t("total_commands")}
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-white">
        <h4 className="font-semibold mb-2">
          ✨ {t("performance_improvements")}
        </h4>
        <ul className="text-sm space-y-1">
          <li>🚀 {t("redis_caching_improves_performance")}</li>
          <li>🔄 {t("react_query_intelligent_refetching")}</li>
          <li>⚡ {t("stale_data_served_instantly")}</li>
          <li>🎯 {t("duplicate_requests_deduplicated")}</li>
          <li>📱 {t("offline_query_caching")}</li>
        </ul>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            // Clear all React Query cache
            window.location.reload(); // Simple way to demonstrate cache clearing
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
        >
          {t("clear_react_query_cache")}
        </button>

        <button
          onClick={async () => {
            try {
              await axios.post("/api/system/cache/clear");
              alert(t("redis_cache_cleared_successfully"));
            } catch (error) {
              alert(`${t("error_clearing_cache")}: ${error.message}`);
            }
          }}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm"
        >
          {t("clear_redis_cache")}
        </button>
      </div>
    </div>
  );
};

export default CacheStatus;
