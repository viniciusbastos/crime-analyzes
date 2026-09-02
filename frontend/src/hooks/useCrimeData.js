import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Custom hook for API calls with React Query
const api = axios.create({
  baseURL: "/api",
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Query Keys
export const QUERY_KEYS = {
  heatmap: "heatmap",
  density: "density",
  summary: "summary",
  temporal: "temporal",
  spatial: "spatial",
  yearOverYear: "yearOverYear",
  growthRates: "growthRates",
  movingAverages: "movingAverages",
  weeklyMovingAverages: "weeklyMovingAverages",
  forecast: "forecast",
  cities: "cities",
  crimes: "crimes",
  crimeTypes: "crimeTypes",
  lastUpload: "lastUpload",
};

// Helper function to create query key with filters
const createQueryKey = (baseKey, filters) => [baseKey, filters];

// Custom hooks for each endpoint
export const useHeatmapData = (filters = {}, enabled = true, useSampling = true) => {
  return useQuery({
    queryKey: createQueryKey(QUERY_KEYS.heatmap, { ...filters, sampled: useSampling }),
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      // Add limit and sampling for performance
      params.set('limit', '5000');
      if (useSampling) {
        params.set('sample', 'true');
      }
      const response = await api.get(`/heatmap?${params}`);
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: enabled,
  });
};

export const useGeoJsonData = (filters = {}, enabled = false) => {
  return useQuery({
    queryKey: createQueryKey("geoJson", filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/heatmap/geojson?${params}`);
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: enabled,
  });
};

export const useDensityData = (filters = {}, enabled = true) => {
  return useQuery({
    queryKey: createQueryKey(QUERY_KEYS.density, filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      // Add limit for performance
      params.set('limit', '10000');
      const response = await api.get(`/density?${params}`);
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: enabled,
  });
};

export const useSummaryData = (filters = {}) => {
  return useQuery({
    queryKey: createQueryKey(QUERY_KEYS.summary, filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/summary?${params}`);
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - increased for better caching
  });
};

export const useTemporalData = (filters = {}) => {
  return useQuery({
    queryKey: createQueryKey(QUERY_KEYS.temporal, filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/temporal?${params}`);
      return response.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

export const useSpatialData = (filters = {}, enabled = true) => {
  return useQuery({
    queryKey: createQueryKey(QUERY_KEYS.spatial, filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      // Add limit for performance
      params.set('limit', '10000');
      const response = await api.get(`/spatial?${params}`);
      return response.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    enabled: enabled,
  });
};

export const useYearOverYearData = (filters = {}, enabled = true) => {
  return useQuery({
    queryKey: createQueryKey(QUERY_KEYS.yearOverYear, filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/trends/year-over-year?${params}`);
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    enabled: enabled,
  });
};

export const useGrowthRatesData = (filters = {}, enabled = true) => {
  return useQuery({
    queryKey: createQueryKey(QUERY_KEYS.growthRates, filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/trends/growth-rates?${params}`);
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    enabled: enabled,
  });
};

export const useMovingAveragesData = (filters = {}, enabled = true) => {
  return useQuery({
    queryKey: createQueryKey(QUERY_KEYS.movingAverages, filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/trends/moving-averages?${params}`);
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    enabled: enabled,
  });
};

export const useWeeklyMovingAveragesData = (filters = {}, enabled = true) => {
  return useQuery({
    queryKey: createQueryKey(QUERY_KEYS.weeklyMovingAverages, filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/trends/weekly-moving-averages?${params}`);
      return response.data;
    },
    staleTime: 45 * 60 * 1000, // 45 minutes - increased for better caching
    enabled: enabled,
  });
};

export const useForecastData = (filters = {}, enabled = true) => {
  return useQuery({
    queryKey: createQueryKey(QUERY_KEYS.forecast, filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/trends/forecast?${params}`);
      return response.data;
    },
    staleTime: 2 * 60 * 60 * 1000, // 2 hours - increased for better caching
    enabled: enabled,
  });
};

export const useCityData = (filters = {}, enabled = true) => {
  return useQuery({
    queryKey: createQueryKey(QUERY_KEYS.cities, filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/cities?${params}`);
      return response.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - increased for better caching
    enabled: enabled,
  });
};

export const useSemesterComparison = (filters = {}, enabled = true) => {
  return useQuery({
    queryKey: createQueryKey("semesterComparison", filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/semester-comparison?${params}`);
      return response.data;
    },
    staleTime: 20 * 60 * 1000, // 20 minutes - increased for better caching
    enabled: enabled,
  });
};

export const useCrimeTypes = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.crimeTypes],
    queryFn: async () => {
      // Dedicated lightweight endpoint — returns a sorted string[] of distinct
      // crime types instead of pulling every crime row to derive them.
      const response = await api.get("/crimes/types");
      return response.data.crime_types || response.data || [];
    },
    staleTime: 4 * 60 * 60 * 1000, // 4 hours - crime types don't change often
  });
};

export const useLastUpload = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.lastUpload],
    queryFn: async () => {
      const response = await api.get("/last-upload");
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - refresh relatively often
  });
};

// Combined hook for all data - this replaces the loadInitialData function
export const useCrimeDataSets = (
  filters = {},
  loadMapData = false,
  loadTrendData = true
) => {
  // Always load essential data for dashboard (prioritized loading)
  const summaryQuery = useSummaryData(filters);
  const temporalQuery = useTemporalData(filters);
  const crimeTypesQuery = useCrimeTypes();

  // Load trend data only for sections that render it (dashboard / statistics / charts)
  const yearOverYearQuery = useYearOverYearData(filters, loadTrendData);
  const growthRatesQuery = useGrowthRatesData(filters, loadTrendData);
  const movingAveragesQuery = useMovingAveragesData(filters, loadTrendData);
  const weeklyMovingAveragesQuery = useWeeklyMovingAveragesData(
    filters,
    loadTrendData
  );
  const forecastQuery = useForecastData(filters, loadTrendData);
  const cityQuery = useCityData(filters, loadTrendData);
  const semesterComparisonQuery = useSemesterComparison(filters, loadTrendData);

  // Only load map-heavy data when needed (lazy loading with sampling for performance)
  const heatmapQuery = useHeatmapData(filters, loadMapData, true); // Use sampling for initial loads
  const densityQuery = useDensityData(filters, loadMapData);
  const spatialQuery = useSpatialData(filters, loadMapData);

  // Progressive loading: essential data loads first, then trends, then map data
  const essentialQueries = [
    summaryQuery,
    temporalQuery,
    crimeTypesQuery,
  ];

  const trendQueries = [
    yearOverYearQuery,
    growthRatesQuery,
    movingAveragesQuery,
    weeklyMovingAveragesQuery,
    forecastQuery,
    cityQuery,
    semesterComparisonQuery,
  ];

  const mapQueries = [
    heatmapQuery,
    densityQuery,
    spatialQuery,
  ];

  const isLoadingEssential = essentialQueries.some((query) => query.isLoading);
  const isLoadingTrends = trendQueries.some((query) => query.isLoading);
  const isLoadingMap = mapQueries.some((query) => query.isLoading);
  const isLoading = isLoadingEssential || isLoadingTrends || (loadMapData && isLoadingMap);

  const isError = [
    heatmapQuery,
    densityQuery,
    summaryQuery,
    temporalQuery,
    spatialQuery,
    yearOverYearQuery,
    growthRatesQuery,
    movingAveragesQuery,
    weeklyMovingAveragesQuery,
    forecastQuery,
    cityQuery,
    semesterComparisonQuery,
    crimeTypesQuery,
  ].some((query) => query.isError);

  return {
    // Data
    heatmapData: heatmapQuery.data || [],
    densityData: densityQuery.data,
    summaryData: summaryQuery.data,
    temporalData: temporalQuery.data,
    spatialData: spatialQuery.data,
    yearOverYearData: yearOverYearQuery.data,
    growthRatesData: growthRatesQuery.data,
    movingAveragesData: movingAveragesQuery.data,
    weeklyMovingAveragesData: weeklyMovingAveragesQuery.data,
    forecastData: forecastQuery.data,
    cityData: cityQuery.data,
    semesterComparisonData: semesterComparisonQuery.data,
    crimeTypes: crimeTypesQuery.data || [],

    // Loading states
    isLoading,
    isLoadingEssential,
    isLoadingTrends,
    isLoadingMap,
    isError,

    // Individual loading states for fine-grained control
    loadingStates: {
      heatmap: heatmapQuery.isLoading,
      density: densityQuery.isLoading,
      summary: summaryQuery.isLoading,
      temporal: temporalQuery.isLoading,
      spatial: spatialQuery.isLoading,
      yearOverYear: yearOverYearQuery.isLoading,
      growthRates: growthRatesQuery.isLoading,
      movingAverages: movingAveragesQuery.isLoading,
      weeklyMovingAverages: weeklyMovingAveragesQuery.isLoading,
      forecast: forecastQuery.isLoading,
      cities: cityQuery.isLoading,
      semesterComparison: semesterComparisonQuery.isLoading,
      crimeTypes: crimeTypesQuery.isLoading,
    },

    // Refetch functions
    refetchAll: () => {
      heatmapQuery.refetch();
      densityQuery.refetch();
      summaryQuery.refetch();
      temporalQuery.refetch();
      spatialQuery.refetch();
      yearOverYearQuery.refetch();
      growthRatesQuery.refetch();
      movingAveragesQuery.refetch();
      weeklyMovingAveragesQuery.refetch();
      forecastQuery.refetch();
      cityQuery.refetch();
      semesterComparisonQuery.refetch();
      crimeTypesQuery.refetch();
    },
  };
};

// Mutation hooks for data modifications
export const useClearCache = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post("/cache/clear");
      return response.data;
    },
    onSuccess: () => {
      // Invalidate only the data-bearing query families, not crimeTypes
      // (which is essentially static) or lastUpload.
      const dataKeys = [
        QUERY_KEYS.summary,
        QUERY_KEYS.temporal,
        QUERY_KEYS.heatmap,
        QUERY_KEYS.density,
        QUERY_KEYS.spatial,
        QUERY_KEYS.yearOverYear,
        QUERY_KEYS.growthRates,
        QUERY_KEYS.movingAverages,
        QUERY_KEYS.weeklyMovingAverages,
        QUERY_KEYS.forecast,
        QUERY_KEYS.cities,
        "geoJson",
        "semesterComparison",
      ];
      dataKeys.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      );
    },
  });
};

export const useUploadData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      const response = await api.post("/upload", formData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all crime-data queries and crimeTypes after a new upload,
      // since the entire dataset may have changed.
      const dataKeys = [
        QUERY_KEYS.summary,
        QUERY_KEYS.temporal,
        QUERY_KEYS.heatmap,
        QUERY_KEYS.density,
        QUERY_KEYS.spatial,
        QUERY_KEYS.yearOverYear,
        QUERY_KEYS.growthRates,
        QUERY_KEYS.movingAverages,
        QUERY_KEYS.weeklyMovingAverages,
        QUERY_KEYS.forecast,
        QUERY_KEYS.cities,
        QUERY_KEYS.crimeTypes,
        QUERY_KEYS.crimes,
        QUERY_KEYS.lastUpload,
        "geoJson",
        "semesterComparison",
      ];
      dataKeys.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      );
    },
  });
};

// Hook to invalidate specific queries when filters change
export const useIncidentFreePeriods = (city = null, enabled = true) => {
  return useQuery({
    queryKey: createQueryKey("incidentFreePeriods", { city }),
    queryFn: async () => {
      if (!city) {
        return null;
      }
      const params = new URLSearchParams({ city });
      const response = await api.get(`/incident-free-periods?${params}`);
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    enabled: enabled && !!city,
  });
};

export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries(),
    invalidateByFilters: () => {
      // Invalidate all queries that depend on filters
      Object.values(QUERY_KEYS).forEach((key) => {
        if (key !== "crimeTypes") {
          // crimeTypes doesn't depend on filters
          queryClient.invalidateQueries({ queryKey: [key] });
        }
      });
    },
    invalidateSpecific: (queryKey) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  };
};
