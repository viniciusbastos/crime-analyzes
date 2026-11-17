import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  Suspense,
  lazy,
} from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "../hooks/useTheme";
import { useInvalidateQueries } from "../hooks/useCrimeData";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "./LoadingSpinner";

const CollapsibleFilterBar = lazy(() => import("./CollapsibleFilterBar"));

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const PER_PAGE = 25;

const INITIAL_FORM_DATA = {
  crime_type: "",
  date_time: "",
  latitude: "",
  longitude: "",
  address: "",
  city: "",
  severity: "",
  description: "",
};

const INITIAL_LOCAL_FILTERS = {
  crime_type: "",
  severity: "",
  category_parent: "",
  city: "",
  start_date: "",
  end_date: "",
};

const SEVERITY_BADGE_CLASSES = {
  Critical: "bg-red-100 text-red-800",
  High: "bg-orange-100 text-orange-800",
  Medium: "bg-yellow-100 text-yellow-800",
  Low: "bg-green-100 text-green-800",
};

const getAuthHeaders = (includeJson = false) => {
  const headers = {};
  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }
  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const hasValidCoords = (crime) => {
  if (!crime) return false;
  const lat = Number(crime.latitude);
  const lng = Number(crime.longitude);
  return (
    crime.latitude !== null &&
    crime.latitude !== "" &&
    crime.longitude !== null &&
    crime.longitude !== "" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  );
};

const toDateTimeLocalInput = (dateTimeString) => {
  if (!dateTimeString) return "";
  const date = new Date(dateTimeString);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Location Picker Component
const LocationPicker = ({ latitude, longitude, onLocationChange, isDark }) => {
  const { t } = useTranslation();
  const [position, setPosition] = useState(
    latitude && longitude
      ? [parseFloat(latitude), parseFloat(longitude)]
      : [-11.492137, -37.927551]
  );

  useEffect(() => {
    if (latitude && longitude) {
      setPosition([parseFloat(latitude), parseFloat(longitude)]);
    }
  }, [latitude, longitude]);

  const handleMarkerDragEnd = (event) => {
    const marker = event.target;
    const newPosition = marker.getLatLng();
    setPosition([newPosition.lat, newPosition.lng]);
    onLocationChange(newPosition.lat, newPosition.lng);
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        setPosition([e.latlng.lat, e.latlng.lng]);
        onLocationChange(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {t("location_picker_label")}
      </label>
      <div
        style={{ height: "300px" }}
        className="border rounded-md overflow-hidden"
      >
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url={
              isDark
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
            attribution={
              isDark
                ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                : "© OpenStreetMap contributors"
            }
          />
          <MapClickHandler />
          <Marker
            position={position}
            draggable={true}
            eventHandlers={{
              dragend: handleMarkerDragEnd,
            }}
          />
        </MapContainer>
      </div>
      <div className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
        {t("coordinates")}: {position[0].toFixed(6)}, {position[1].toFixed(6)}
      </div>
    </div>
  );
};

const DetailField = ({ label, value, isDark, className = "" }) => (
  <div className={className}>
    <div
      className={`text-xs font-medium uppercase tracking-wider ${
        isDark ? "text-gray-400" : "text-gray-500"
      }`}
    >
      {label}
    </div>
    <div className="mt-1 text-sm font-medium break-words">{value}</div>
  </div>
);

const CrimeDetailsModal = ({
  crime,
  loadingDetails,
  isDark,
  t,
  formatDateTime,
  getSeverityLabel,
  onClose,
  onEdit,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!crime) return null;

  const coordsAvailable = hasValidCoords(crime);
  const lat = coordsAvailable ? Number(crime.latitude) : null;
  const lng = coordsAvailable ? Number(crime.longitude) : null;

  const aispDisplay =
    crime.aisp && crime.aisp_name
      ? `${crime.aisp} — ${crime.aisp_name}`
      : crime.aisp || crime.aisp_name || t("na");

  const geocodedDisplay =
    crime.geocoded === true
      ? t("yes")
      : crime.geocoded === false
      ? t("no")
      : t("na");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="crime-details-title"
    >
      <div
        className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl border ${
          isDark
            ? "bg-gray-800 border-gray-700 text-white"
            : "bg-white border-gray-200 text-gray-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`flex items-start justify-between gap-4 p-5 border-b ${
            isDark ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 id="crime-details-title" className="text-xl font-bold">
                {t("crime_record_details")} #{crime.id}
              </h3>
              <span
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                  SEVERITY_BADGE_CLASSES[crime.severity] ||
                  "bg-gray-100 text-gray-800"
                }`}
              >
                {getSeverityLabel(crime.severity)}
              </span>
              {crime.category_parent && (
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                    isDark
                      ? "bg-purple-900 text-purple-200"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {crime.category_parent}
                </span>
              )}
            </div>
            <p
              className={`text-sm ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {crime.crime_type} • {formatDateTime(crime.date_time)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className={`px-2.5 py-1 rounded-md text-lg leading-none transition-colors ${
              isDark
                ? "text-gray-400 hover:text-white hover:bg-gray-700"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-6">
          {loadingDetails && (
            <div className="text-xs opacity-75">{t("loading_details")}</div>
          )}

          {/* Occurrence Information */}
          <section className="space-y-3">
            <h4
              className={`text-sm font-semibold uppercase tracking-wider border-b pb-1 ${
                isDark
                  ? "text-blue-300 border-gray-700"
                  : "text-blue-700 border-gray-200"
              }`}
            >
              {t("occurrence_info")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailField
                label={t("crime_type")}
                value={crime.crime_type || t("na")}
                isDark={isDark}
              />
              <DetailField
                label={t("date_time")}
                value={formatDateTime(crime.date_time)}
                isDark={isDark}
              />
              <DetailField
                label={t("severity")}
                value={getSeverityLabel(crime.severity)}
                isDark={isDark}
              />
              <DetailField
                label={t("category_parent")}
                value={crime.category_parent || t("na")}
                isDark={isDark}
              />
              <DetailField
                label={t("bo_number")}
                value={crime.bo || t("na")}
                isDark={isDark}
              />
              <DetailField
                label={t("delegacia")}
                value={crime.delegacia || t("na")}
                isDark={isDark}
              />
            </div>
            <DetailField
              label={t("description")}
              value={
                <p className="whitespace-pre-wrap font-normal">
                  {crime.description || t("na")}
                </p>
              }
              isDark={isDark}
            />
          </section>

          {/* Police Organization & Victim */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="space-y-3">
              <h4
                className={`text-sm font-semibold uppercase tracking-wider border-b pb-1 ${
                  isDark
                    ? "text-blue-300 border-gray-700"
                    : "text-blue-700 border-gray-200"
                }`}
              >
                {t("police_organization")}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailField
                  label={t("unidade_opm")}
                  value={crime.unidade || t("na")}
                  isDark={isDark}
                />
                <DetailField
                  label={t("aisp")}
                  value={aispDisplay}
                  isDark={isDark}
                />
                <DetailField
                  label={t("risp")}
                  value={crime.risp || t("na")}
                  isDark={isDark}
                />
                <DetailField
                  label={t("coorpin")}
                  value={crime.coorpin || t("na")}
                  isDark={isDark}
                />
              </div>
            </section>

            <section className="space-y-3">
              <h4
                className={`text-sm font-semibold uppercase tracking-wider border-b pb-1 ${
                  isDark
                    ? "text-blue-300 border-gray-700"
                    : "text-blue-700 border-gray-200"
                }`}
              >
                {t("victim_details")}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <DetailField
                  label={t("gender")}
                  value={crime.sexo || t("na")}
                  isDark={isDark}
                />
                <DetailField
                  label={t("age")}
                  value={
                    crime.idade !== null && crime.idade !== undefined
                      ? crime.idade
                      : t("na")
                  }
                  isDark={isDark}
                />
              </div>
            </section>
          </div>

          {/* Location & Map */}
          <section className="space-y-3">
            <h4
              className={`text-sm font-semibold uppercase tracking-wider border-b pb-1 ${
                isDark
                  ? "text-blue-300 border-gray-700"
                  : "text-blue-700 border-gray-200"
              }`}
            >
              {t("location_details")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailField
                label={t("city")}
                value={crime.city || t("na")}
                isDark={isDark}
              />
              <DetailField
                label={t("region")}
                value={crime.regiao || t("na")}
                isDark={isDark}
              />
              <DetailField
                label={t("ibge_code")}
                value={crime.id_municipio || t("na")}
                isDark={isDark}
              />
              <DetailField
                label={t("address")}
                value={crime.address || t("na")}
                isDark={isDark}
                className="sm:col-span-2"
              />
              <DetailField
                label={t("geocoded")}
                value={geocodedDisplay}
                isDark={isDark}
              />
              <DetailField
                label={t("coordinates")}
                value={
                  coordsAvailable
                    ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                    : t("na")
                }
                isDark={isDark}
              />
            </div>

            {coordsAvailable ? (
              <div
                style={{ height: "220px" }}
                className={`border rounded-md overflow-hidden ${
                  isDark ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <MapContainer
                  key={`detail-map-${crime.id}-${lat}-${lng}`}
                  center={[lat, lng]}
                  zoom={15}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url={
                      isDark
                        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    }
                    attribution={
                      isDark
                        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        : "© OpenStreetMap contributors"
                    }
                  />
                  <Marker position={[lat, lng]} />
                </MapContainer>
              </div>
            ) : (
              <div
                className={`p-3 rounded-md text-sm ${
                  isDark
                    ? "bg-gray-700/60 text-gray-300"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {t("no_coordinates_available")}
              </div>
            )}
          </section>
        </div>

        {/* Modal Footer */}
        <div
          className={`flex justify-end gap-2 p-4 border-t ${
            isDark ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <button
            type="button"
            onClick={() => onEdit(crime)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            {t("edit")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
};

const CrimeManagement = ({
  filters = {},
  crimeTypes = [],
  onApplyFilters,
  onResetFilters,
}) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { invalidateByFilters } = useInvalidateQueries();

  const [crimes, setCrimes] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: PER_PAGE,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCrime, setEditingCrime] = useState(null);
  const [selectedCrime, setSelectedCrime] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [localFilters, setLocalFilters] = useState(INITIAL_LOCAL_FILTERS);
  const [page, setPage] = useState(1);

  const [cityOptions, setCityOptions] = useState([]);
  const [fallbackCrimeTypes, setFallbackCrimeTypes] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const prevGlobalFiltersRef = useRef(filters);

  // Debounce search input so server requests don't fire on every keystroke
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Load city (and fallback crime type) options for inline table filters
  useEffect(() => {
    let active = true;
    const loadFilterOptions = async () => {
      try {
        const requests = [
          fetch("/api/locations/cities", { headers: getAuthHeaders() }),
        ];
        if (!crimeTypes || crimeTypes.length === 0) {
          requests.push(
            fetch("/api/crimes/types", { headers: getAuthHeaders() })
          );
        }
        const [citiesRes, typesRes] = await Promise.all(requests);
        if (!active) return;

        if (citiesRes?.ok) {
          const data = await citiesRes.json();
          if (Array.isArray(data)) setCityOptions(data);
        }
        if (typesRes?.ok) {
          const typesData = await typesRes.json();
          if (Array.isArray(typesData)) setFallbackCrimeTypes(typesData);
        }
      } catch (err) {
        console.error(t("error_loading_city_options"), err);
      }
    };
    loadFilterOptions();
    return () => {
      active = false;
    };
  }, [crimeTypes, t]);

  // Reset to page 1 when filters are updated externally from CollapsibleFilterBar
  useEffect(() => {
    if (prevGlobalFiltersRef.current !== filters) {
      prevGlobalFiltersRef.current = filters;
      setPage(1);
    }
  }, [filters]);

  const availableCrimeTypes = useMemo(
    () => (crimeTypes && crimeTypes.length > 0 ? crimeTypes : fallbackCrimeTypes),
    [crimeTypes, fallbackCrimeTypes]
  );

  // Combine parent filters (when controlled) or local filters with debounced search
  const activeBarFilters = useMemo(
    () => (onApplyFilters ? filters || {} : localFilters),
    [onApplyFilters, filters, localFilters]
  );

  const effectiveFilters = useMemo(() => {
    const combined = { ...activeBarFilters };
    if (debouncedSearch) {
      combined.search = debouncedSearch;
    }
    return combined;
  }, [activeBarFilters, debouncedSearch]);

  const formatDateTime = useCallback(
    (dateTimeString) => {
      if (!dateTimeString) return t("na");
      const date = new Date(dateTimeString);
      if (Number.isNaN(date.getTime())) return t("na");
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    },
    [t]
  );

  const getSeverityLabel = useCallback(
    (severity) => {
      if (!severity) return t("na");
      const map = {
        Low: t("low"),
        Medium: t("medium"),
        High: t("high"),
        Critical: t("critical"),
      };
      return map[severity] || severity;
    },
    [t]
  );

  // Fetch crimes from the server with active filters and pagination
  const fetchCrimes = useCallback(
    async (signal) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        Object.entries(effectiveFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.set(key, value);
          }
        });
        params.set("page", String(page));
        params.set("per_page", String(PER_PAGE));

        const response = await fetch(`/api/crimes?${params.toString()}`, {
          headers: getAuthHeaders(),
          signal,
        });
        if (!response.ok) throw new Error(t("failed_to_fetch_crimes"));
        const data = await response.json();
        if (!Array.isArray(data.crimes)) {
          throw new Error(t("invalid_data_format"));
        }

        const formatted = data.crimes.map((crime) => ({
          ...crime,
          _formattedDateTime: formatDateTime(crime.date_time),
        }));

        setCrimes(formatted);
        if (data.pagination) {
          setPagination(data.pagination);
        } else {
          setPagination({
            page,
            per_page: PER_PAGE,
            total: formatted.length,
            pages: 1,
          });
        }
        setError(null);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [effectiveFilters, page, t, formatDateTime]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchCrimes(controller.signal);
    return () => controller.abort();
  }, [fetchCrimes]);

  const handleInlineFilterChange = (field, value) => {
    setPage(1);
    if (onApplyFilters) {
      const next = { ...(filters || {}), [field]: value };
      if (field === "start_date" || field === "end_date") {
        next.quick_date = "";
      }
      onApplyFilters(next);
    } else {
      setLocalFilters((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const hasAnyActiveFilter = useMemo(() => {
    const hasFilterValues = Object.values(activeBarFilters).some(
      (v) => v !== undefined && v !== null && v !== ""
    );
    return hasFilterValues || searchTerm.trim() !== "";
  }, [activeBarFilters, searchTerm]);

  const handleClearAllFilters = () => {
    setPage(1);
    setSearchTerm("");
    setDebouncedSearch("");
    setLocalFilters(INITIAL_LOCAL_FILTERS);
    if (onResetFilters) {
      onResetFilters();
    }
  };

  const handleViewDetails = async (crime) => {
    setSelectedCrime(crime);
    setLoadingDetails(true);
    try {
      const response = await fetch(`/api/crimes/${crime.id}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const detailedCrime = await response.json();
        setSelectedCrime((prev) =>
          prev && prev.id === crime.id ? detailedCrime : prev
        );
      }
    } catch {
      // Keep row data already visible in the modal if detail refresh fails
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingCrime
        ? `/api/crimes/${editingCrime.id}`
        : "/api/crimes";
      const method = editingCrime ? "PUT" : "POST";

      const payload = {
        ...formData,
        latitude:
          formData.latitude === "" ? null : parseFloat(formData.latitude),
        longitude:
          formData.longitude === "" ? null : parseFloat(formData.longitude),
      };

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(t("failed_to_save_crime"));

      invalidateByFilters();
      await fetchCrimes();
      setShowForm(false);
      setEditingCrime(null);
      setFormData(INITIAL_FORM_DATA);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle delete
  const handleDelete = async (crimeId) => {
    if (!window.confirm(t("confirm_delete"))) return;

    try {
      const response = await fetch(`/api/crimes/${crimeId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error(t("failed_to_delete_crime"));

      invalidateByFilters();
      if (selectedCrime?.id === crimeId) {
        setSelectedCrime(null);
      }
      await fetchCrimes();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle edit
  const handleEdit = (crime) => {
    setSelectedCrime(null);
    setEditingCrime(crime);
    setFormData({
      crime_type: crime.crime_type || "",
      date_time: toDateTimeLocalInput(crime.date_time),
      latitude:
        crime.latitude !== null && crime.latitude !== undefined
          ? String(crime.latitude)
          : "",
      longitude:
        crime.longitude !== null && crime.longitude !== undefined
          ? String(crime.longitude)
          : "",
      address: crime.address || "",
      city: crime.city || "",
      severity: crime.severity || "",
      description: crime.description || "",
    });
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const totalPages = Math.max(1, pagination.pages || 1);
  const currentPage = Math.min(page, totalPages);
  const totalCount = pagination.total ?? crimes.length;
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
  const rangeEnd = Math.min(currentPage * PER_PAGE, totalCount);

  const inputThemeClass = isDark
    ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
    : "bg-white border-gray-300 text-gray-900 focus:border-blue-500";

  return (
    <div className={`space-y-6 ${isDark ? "text-white" : "text-gray-900"}`}>
      {onApplyFilters && onResetFilters && (
        <Suspense fallback={<LoadingSpinner message="Loading filters..." />}>
          <CollapsibleFilterBar
            filters={filters}
            crimeTypes={availableCrimeTypes}
            onApplyFilters={onApplyFilters}
            onResetFilters={onResetFilters}
          />
        </Suspense>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("crime_records_management")}</h2>
          <p
            className={`text-sm mt-1 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {totalCount.toLocaleString()} {t("records_found")}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder={t("search_crime_records")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`px-3 py-2 border rounded-md flex-1 sm:w-72 ${inputThemeClass}`}
          />
          <button
            type="button"
            onClick={() => {
              setEditingCrime(null);
              setFormData(INITIAL_FORM_DATA);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            {t("add_new_crime")}
          </button>
        </div>
      </div>

      {/* Inline Quick Filters for Crime Records */}
      <div
        className={`rounded-lg shadow p-4 border ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1 opacity-80">
              {t("crime_type")}
            </label>
            <select
              value={activeBarFilters.crime_type || ""}
              onChange={(e) =>
                handleInlineFilterChange("crime_type", e.target.value)
              }
              className={`w-full px-2.5 py-2 text-sm border rounded-md ${inputThemeClass}`}
            >
              <option value="">{t("all_crime_types")}</option>
              {availableCrimeTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 opacity-80">
              {t("severity")}
            </label>
            <select
              value={activeBarFilters.severity || ""}
              onChange={(e) =>
                handleInlineFilterChange("severity", e.target.value)
              }
              className={`w-full px-2.5 py-2 text-sm border rounded-md ${inputThemeClass}`}
            >
              <option value="">{t("all_severities")}</option>
              <option value="Low">{t("low")}</option>
              <option value="Medium">{t("medium")}</option>
              <option value="High">{t("high")}</option>
              <option value="Critical">{t("critical")}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 opacity-80">
              {t("category_parent")}
            </label>
            <select
              value={activeBarFilters.category_parent || ""}
              onChange={(e) =>
                handleInlineFilterChange("category_parent", e.target.value)
              }
              className={`w-full px-2.5 py-2 text-sm border rounded-md ${inputThemeClass}`}
            >
              <option value="">{t("all_categories")}</option>
              <option value="CVLI">{t("cvli")}</option>
              <option value="CVP">{t("cvp")}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 opacity-80">
              {t("city")}
            </label>
            <select
              value={activeBarFilters.city || ""}
              onChange={(e) =>
                handleInlineFilterChange("city", e.target.value)
              }
              className={`w-full px-2.5 py-2 text-sm border rounded-md ${inputThemeClass}`}
            >
              <option value="">{t("all_cities")}</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 opacity-80">
              {t("start_date")}
            </label>
            <input
              type="date"
              value={activeBarFilters.start_date || ""}
              onChange={(e) =>
                handleInlineFilterChange("start_date", e.target.value)
              }
              className={`w-full px-2.5 py-2 text-sm border rounded-md ${inputThemeClass}`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 opacity-80">
              {t("end_date")}
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={activeBarFilters.end_date || ""}
                onChange={(e) =>
                  handleInlineFilterChange("end_date", e.target.value)
                }
                className={`w-full px-2.5 py-2 text-sm border rounded-md ${inputThemeClass}`}
              />
              {hasAnyActiveFilter && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  title={t("clear_filters")}
                  className={`px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    isDark
                      ? "bg-red-900 text-red-200 hover:bg-red-800"
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                  }`}
                >
                  {t("clear_filters")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          className={`p-4 rounded-md ${
            isDark ? "bg-red-900 text-red-200" : "bg-red-100 text-red-800"
          }`}
        >
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div
          className={`rounded-lg shadow p-6 ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          } border`}
        >
          <h3 className="text-xl font-semibold mb-4">
            {editingCrime ? t("edit_crime_record") : t("add_new_crime_record")}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("crime_type")} *
                </label>
                <input
                  type="text"
                  name="crime_type"
                  value={formData.crime_type}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-md ${inputThemeClass}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("date_time")} *
                </label>
                <input
                  type="datetime-local"
                  name="date_time"
                  value={formData.date_time}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-md ${inputThemeClass}`}
                />
              </div>
              <div className="md:col-span-2">
                <LocationPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationChange={(lat, lng) => {
                    setFormData((prev) => ({
                      ...prev,
                      latitude: lat.toString(),
                      longitude: lng.toString(),
                    }));
                  }}
                  isDark={isDark}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("city")}
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${inputThemeClass}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("severity")}
                </label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${inputThemeClass}`}
                >
                  <option value="">{t("select_severity")}</option>
                  <option value="Low">{t("low")}</option>
                  <option value="Medium">{t("medium")}</option>
                  <option value="High">{t("high")}</option>
                  <option value="Critical">{t("critical")}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("address")}
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${inputThemeClass}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("description")}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md ${inputThemeClass}`}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                {editingCrime ? t("update") : t("create")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCrime(null);
                  setFormData(INITIAL_FORM_DATA);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                {t("cancel")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Crimes Table */}
      <div
        className={`rounded-lg shadow overflow-hidden ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } border`}
      >
        {loading && (
          <div
            className={`px-4 py-2 text-xs font-medium border-b ${
              isDark
                ? "bg-gray-750 border-gray-700 text-blue-300"
                : "bg-blue-50 border-gray-200 text-blue-700"
            }`}
          >
            {t("loading_crimes")}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${isDark ? "bg-gray-700" : "bg-gray-50"}`}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  {t("id")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  {t("type")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  {t("date_time")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  {t("location")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  {t("severity")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDark ? "divide-gray-700" : "divide-gray-200"
              }`}
            >
              {crimes.map((crime) => (
                <tr
                  key={crime.id}
                  onClick={() => handleViewDetails(crime)}
                  className={`cursor-pointer transition-colors ${
                    isDark
                      ? "bg-gray-800 hover:bg-gray-700/60"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    #{crime.id}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="font-medium">{crime.crime_type}</div>
                    {(crime.category_parent || crime.bo) && (
                      <div
                        className={`text-xs mt-0.5 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {[crime.category_parent, crime.bo && `BO: ${crime.bo}`]
                          .filter(Boolean)
                          .join(" • ")}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {crime._formattedDateTime ?? formatDateTime(crime.date_time)}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div>{crime.city || t("na")}</div>
                    {crime.address && (
                      <div
                        className={`text-xs truncate max-w-xs ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                        title={crime.address}
                      >
                        {crime.address}
                      </div>
                    )}
                    {hasValidCoords(crime) && (
                      <div className="text-xs text-gray-500">
                        {Number(crime.latitude).toFixed(4)},{" "}
                        {Number(crime.longitude).toFixed(4)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        SEVERITY_BADGE_CLASSES[crime.severity] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {getSeverityLabel(crime.severity)}
                    </span>
                  </td>
                  <td
                    className="px-4 py-4 whitespace-nowrap text-sm space-x-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleViewDetails(crime)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-xs"
                    >
                      {t("details")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(crime)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs"
                    >
                      {t("edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(crime.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs"
                    >
                      {t("delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && crimes.length === 0 && (
          <div className="text-center py-8 text-gray-500 px-4">
            {hasAnyActiveFilter
              ? t("no_matching_records")
              : t("no_crime_records_found")}
          </div>
        )}

        {totalCount > 0 && (
          <div
            className={`flex items-center justify-between px-4 py-3 border-t ${
              isDark ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <span className="text-sm opacity-75">
              {t("showing_range", {
                from: rangeStart,
                to: rangeEnd,
                total: totalCount.toLocaleString(),
              })}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || loading}
                  className="px-3 py-1 rounded-md bg-gray-600 text-white text-xs disabled:opacity-40"
                >
                  {t("previous")}
                </button>
                <span className="text-sm px-1">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || loading}
                  className="px-3 py-1 rounded-md bg-gray-600 text-white text-xs disabled:opacity-40"
                >
                  {t("next")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedCrime && (
        <CrimeDetailsModal
          crime={selectedCrime}
          loadingDetails={loadingDetails}
          isDark={isDark}
          t={t}
          formatDateTime={formatDateTime}
          getSeverityLabel={getSeverityLabel}
          onClose={() => setSelectedCrime(null)}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
};

export default CrimeManagement;
