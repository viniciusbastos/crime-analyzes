import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "./ThemeContext";
import { useClearCache, useInvalidateQueries } from "../hooks/useCrimeData";

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
        Location (Click map or drag marker)
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
        Coordinates: {position[0].toFixed(6)}, {position[1].toFixed(6)}
      </div>
    </div>
  );
};

const CrimeManagement = () => {
  const { isDark } = useTheme();
  const clearCache = useClearCache();
  const { invalidateAll } = useInvalidateQueries();
  const [crimes, setCrimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCrime, setEditingCrime] = useState(null);
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

  // Fetch crimes
  const fetchCrimes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/crimes");
      if (!response.ok) throw new Error("Failed to fetch crimes");
      const data = await response.json();
      setCrimes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrimes();
  }, []);

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

      if (!response.ok) throw new Error("Failed to save crime");

      // Clear Redis cache and invalidate React Query
      await clearCache.mutateAsync();
      invalidateAll();

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
    if (!window.confirm("Are you sure you want to delete this crime record?"))
      return;

    try {
      const response = await fetch(`/api/crimes/${crimeId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete crime");

      // Clear Redis cache and invalidate React Query
      await clearCache.mutateAsync();
      invalidateAll();

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
        Loading crimes...
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isDark ? "text-white" : "text-gray-900"}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Crime Records Management</h2>
        <button
          onClick={() => {
            setEditingCrime(null);
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add New Crime
        </button>
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
            {editingCrime ? "Edit Crime Record" : "Add New Crime Record"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Crime Type *
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
                  Date & Time *
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
                <label className="block text-sm font-medium mb-1">City</label>
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
                  Severity
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
                  <option value="">Select severity</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
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
                Description
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
                {editingCrime ? "Update" : "Create"}
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
                Cancel
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
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Actions
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
                  className={isDark ? "bg-gray-800" : "bg-white"}
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {crime.id}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {crime.crime_type}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {new Date(crime.date_time).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {crime.city || "N/A"}
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
                      {crime.severity || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(crime)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(crime.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {crimes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No crime records found. Click "Add New Crime" to create your first
            record.
          </div>
        )}
      </div>
    </div>
  );
};

export default CrimeManagement;
