import React, { useState, useEffect, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "../hooks/useTheme";
import { useInvalidateQueries } from "../hooks/useCrimeData";
import { useTranslation } from "react-i18next";

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

const CrimeManagement = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { invalidateByFilters } = useInvalidateQueries();
  const [crimes, setCrimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCrime, setEditingCrime] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;

  // Debounce the search box so filtering doesn't run on every keystroke
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(id);
  }, [searchTerm]);
  const [formData, setFormData] = useState({
    crime_type: "",
    date_time: "",
    latitude: "",
    longitude: "",
    address: "",
    city: "",
    severity: "",
    description: "",
  });

  // Format date as dd/mm/yyyy and time as 24h
  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Fetch crimes
  const fetchCrimes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/crimes?per_page=5000");
      if (!response.ok) throw new Error(t("failed_to_fetch_crimes"));
      const data = await response.json();
      // Ensure data.crimes is an array before sorting
      if (!Array.isArray(data.crimes)) {
        throw new Error(t("invalid_data_format"));
      }
      // Sort by date most recent first and pre-format the display date once,
      // so we don't build a Date object per row on every render.
      const sortedData = data.crimes
        .sort((a, b) => new Date(b.date_time) - new Date(a.date_time))
        .map((crime) => ({
          ...crime,
          _formattedDateTime: formatDateTime(crime.date_time),
        }));
      setCrimes(sortedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCrimes();
  }, [fetchCrimes]);

  // Filter once per (crimes, debounced search) change instead of every render
  const filteredCrimes = useMemo(() => {
    if (!debouncedSearch) return crimes;
    const searchLower = debouncedSearch.toLowerCase();
    return crimes.filter(
      (crime) =>
        crime.crime_type?.toLowerCase().includes(searchLower) ||
        crime.city?.toLowerCase().includes(searchLower) ||
        crime.address?.toLowerCase().includes(searchLower) ||
        crime.description?.toLowerCase().includes(searchLower) ||
        crime.severity?.toLowerCase().includes(searchLower)
    );
  }, [crimes, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredCrimes.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedCrimes = useMemo(
    () =>
      filteredCrimes.slice(
        (currentPage - 1) * PER_PAGE,
        currentPage * PER_PAGE
      ),
    [filteredCrimes, currentPage]
  );

  // Reset to first page whenever the search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingCrime
        ? `/api/crimes/${editingCrime.id}`
        : "/api/crimes";
      const method = editingCrime ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error(t("failed_to_save_crime"));

      // Backend already invalidates its own cache for this crime's routes;
      // just refresh the affected dashboard queries + this table.
      invalidateByFilters();

      await fetchCrimes(); // Refresh the list
      setShowForm(false);
      setEditingCrime(null);
      resetForm();
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
      });

      if (!response.ok) throw new Error(t("failed_to_delete_crime"));

      // Backend already invalidates its own cache for this crime's routes;
      // just refresh the affected dashboard queries + this table.
      invalidateByFilters();

      await fetchCrimes(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle edit
  const handleEdit = (crime) => {
    setEditingCrime(crime);
    setFormData({
      crime_type: crime.crime_type || "",
      date_time: crime.date_time
        ? new Date(crime.date_time).toISOString().slice(0, 16)
        : "",
      latitude: crime.latitude || "",
      longitude: crime.longitude || "",
      address: crime.address || "",
      city: crime.city || "",
      severity: crime.severity || "",
      description: crime.description || "",
    });
    setShowForm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      crime_type: "",
      date_time: "",
      latitude: "",
      longitude: "",
      address: "",
      city: "",
      severity: "",
      description: "",
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div
        className={`flex justify-center items-center h-64 ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        {t("loading_crimes")}...
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isDark ? "text-white" : "text-gray-900"}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">{t("crime_records_management")}</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder={t("search_crime_records")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`px-3 py-2 border rounded-md flex-1 sm:w-64 ${
              isDark
                ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                : "border-gray-300 focus:border-blue-500"
            }`}
          />
          <button
            onClick={() => {
              setEditingCrime(null);
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            {t("add_new_crime")}
          </button>
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
                  className={`w-full px-3 py-2 border rounded-md ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
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
                  className={`w-full px-3 py-2 border rounded-md ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                />
              </div>
              <div className="col-span-2">
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
                  className={`w-full px-3 py-2 border rounded-md ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
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
                  className={`w-full px-3 py-2 border rounded-md ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
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
                className={`w-full px-3 py-2 border rounded-md ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                    : "border-gray-300 focus:border-blue-500"
                }`}
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
                className={`w-full px-3 py-2 border rounded-md ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                    : "border-gray-300 focus:border-blue-500"
                }`}
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
                  resetForm();
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
              {pagedCrimes.map((crime) => (
                <tr
                  key={crime.id}
                  className={isDark ? "bg-gray-800" : "bg-white"}
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {crime.id}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {crime.crime_type}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {crime._formattedDateTime ?? formatDateTime(crime.date_time)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {crime.city || t("na")}
                    {crime.latitude && crime.longitude && (
                      <div className="text-xs text-gray-500">
                        {crime.latitude.toFixed(4)},{" "}
                        {crime.longitude.toFixed(4)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        crime.severity === "Critical"
                          ? "bg-red-100 text-red-800"
                          : crime.severity === "High"
                          ? "bg-orange-100 text-orange-800"
                          : crime.severity === "Medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : crime.severity === "Low"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {crime.severity || t("na")}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(crime)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs"
                    >
                      {t("edit")}
                    </button>
                    <button
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
        {filteredCrimes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? `${t("no_crime_records_found")} (${t("search")}: "${searchTerm}")` : t("no_crime_records_found")}
          </div>
        )}
        {filteredCrimes.length > PER_PAGE && (
          <div
            className={`flex items-center justify-between px-4 py-3 border-t ${
              isDark ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <span className="text-sm opacity-75">
              {(currentPage - 1) * PER_PAGE + 1}–
              {Math.min(currentPage * PER_PAGE, filteredCrimes.length)} /{" "}
              {filteredCrimes.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1 rounded-md bg-gray-600 text-white text-xs disabled:opacity-40"
              >
                {t("previous", "Previous")}
              </button>
              <span className="text-sm px-1">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 rounded-md bg-gray-600 text-white text-xs disabled:opacity-40"
              >
                {t("next", "Next")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrimeManagement;
