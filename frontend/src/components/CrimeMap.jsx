import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { useTheme } from "../hooks/useTheme";
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

// Heatmap component
const HeatmapLayer = ({ data }) => {
  const map = useMap();

  useEffect(() => {
    if (data && data.length > 0) {
      const heat = L.heatLayer(data, {
        radius: 25,
        blur: 25,
        maxZoom: 10,
        minOpacity: 0.8,
        max: 1.0,
        gradient: { 0.3: "blue", 0.65: "lime", 0.8: "orange", 1: "red" },
      }).addTo(map);

      return () => {
        map.removeLayer(heat);
      };
    }
  }, [map, data]);

  return null;
};

// Contour layer component
const ContourLayer = ({ densityData, visible }) => {
  const map = useMap();

  useEffect(() => {
    if (!densityData || !visible || !densityData.contour_levels) {
      return;
    }

    const contourLayers = [];

    densityData.contour_levels.forEach((levelData) => {
      levelData.contours.forEach((contour) => {
        // Create a rectangle for each contour cell
        const bounds = [
          [contour.lat_min, contour.lng_min],
          [contour.lat_max, contour.lng_max],
        ];

        // Color based on level (darker = higher density)
        const colors = [
          "rgba(255, 255, 0, 0.4)", // Yellow - lowest density
          "rgba(255, 165, 0, 0.5)", // Orange
          "rgba(255, 69, 0, 0.6)", // Red-Orange
          "rgba(255, 0, 0, 0.7)", // Red
          "rgba(139, 0, 0, 0.8)", // Dark Red - highest density
        ];

        const rectangle = L.rectangle(bounds, {
          color: colors[levelData.level - 1] || "rgba(255, 0, 0, 0.7)",
          fillColor: colors[levelData.level - 1] || "rgba(255, 0, 0, 0.7)",
          fillOpacity: contour.opacity,
          weight: 1, // Thin border for better visibility
          interactive: false,
        }).addTo(map);

        contourLayers.push(rectangle);
      });
    });

    return () => {
      contourLayers.forEach((layer) => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
    };
  }, [map, densityData, visible]);

  return null;
};

// Cluster markers component
const ClusterMarkers = ({ data }) => {
  const map = useMap();
  const { t } = useTranslation();

  useEffect(() => {
    if (data && data.length > 0) {
      const markers = data.map(cluster => {
        const marker = L.circleMarker([cluster.center_lat, cluster.center_lng], {
          radius: 8,
          fillColor: "#ff7800",
          color: "#000",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map);

        marker.bindPopup(`<b>${t('cluster')} ${cluster.cluster_id}</b><br>${t('crime_count')}: ${cluster.crime_count}`);
        return marker;
      });

      return () => {
        markers.forEach(marker => {
          map.removeLayer(marker);
        });
      };
    }
  }, [map, data, t]);

  return null;
};

const CrimeMap = ({
  heatmapData,
  densityData,
  spatialData,
  mapCenter,
  mapZoom,
  showContours,
  onToggleContours,
}) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <div className={`rounded-lg shadow p-6 mb-6 ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('crime_density_map')}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onToggleContours}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              showContours
                ? 'bg-blue-600 text-white'
                : isDark
                  ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showContours ? t('hide_contours') : t('show_contours')} 
          </button>
        </div>
      </div>
      <div style={{ height: "500px" }}>
        <MapContainer
          key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url={isDark
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
            attribution={isDark
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              : "© OpenStreetMap contributors"
            }
          />
          <HeatmapLayer data={heatmapData} />
          <ContourLayer densityData={densityData} visible={showContours} />
          <ClusterMarkers data={spatialData} />
        </MapContainer>
      </div>
      {densityData && densityData.contour_levels && (
        <div className={`mt-4 flex flex-wrap gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          <span className="font-medium">{t('density_levels')}:</span>
          {densityData.contour_levels.map((level) => (
            <div key={level.level} className="flex items-center gap-1">
              <div
                className="w-4 h-4 rounded"
                style={{
                  backgroundColor:
                    [
                      "rgba(255, 255, 0, 0.7)",
                      "rgba(255, 165, 0, 0.7)",
                      "rgba(255, 69, 0, 0.7)",
                      "rgba(255, 0, 0, 0.7)",
                      "rgba(139, 0, 0, 0.7)",
                    ][level.level - 1] || "rgba(255, 0, 0, 0.7)",
                }}
              ></div>
              <span>
                {level.percentage}% ({level.level_value} {t('crimes')})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CrimeMap;
