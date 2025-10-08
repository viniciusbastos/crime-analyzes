import React, { useEffect, useRef, useState } from "react";
import Map, { Source, Layer } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "react-i18next";

// You'll need to replace this with your actual Mapbox access token
const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoidmluaWNpdXNiYXN0b3MyIiwiYSI6ImNtNXlvZGN6aTBqdmcyanB5bXB3YWI2cWgifQ.s-iJkZA4LZZ4J1DWTYmztQ";

const ClusterMap = ({ geoJsonData, isLoading }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const mapRef = useRef();
  const [viewState, setViewState] = useState({
    longitude: -37.931477,
    latitude: -11.485506,
    zoom: 9,
  });

  const mapStyle = isDark
    ? "mapbox://styles/mapbox/dark-v11"
    : "mapbox://styles/mapbox/light-v11";

  // Layer styles for clustering
  const layerStyles = {
    clusters: {
      id: "clusters",
      type: "circle",
      source: "crimes",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#51bbd6", // Light blue for small clusters
          25,
          "#f1f075", // Yellow
          50,
          "#f28cb1", // Pink
          100,
          "#f1f075", // Yellow
          300,
          "#f28cb1", // Pink
          750,
          "#3bb2d0", // Dark blue for large clusters
        ],
        "circle-radius": [
          "step",
          ["get", "point_count"],
          20, // Small radius for small clusters
          25,
          30,
          50,
          40,
          100,
          50,
          300,
          60,
          750,
          70,
        ],
      },
    },
    clusterCount: {
      id: "cluster-count",
      type: "symbol",
      source: "crimes",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 12,
      },
    },
    unclusteredPoint: {
      id: "unclustered-point",
      type: "circle",
      source: "crimes",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": "#11b4da",
        "circle-radius": 6,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
      },
    },
  };

  useEffect(() => {
    if (mapRef.current && geoJsonData) {
      const map = mapRef.current.getMap();

      // Fit bounds to show all data points
      if (geoJsonData.features && geoJsonData.features.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();

        geoJsonData.features.forEach((feature) => {
          if (feature.geometry && feature.geometry.coordinates) {
            bounds.extend(feature.geometry.coordinates);
          }
        });

        map.fitBounds(bounds, {
          padding: 20,
          maxZoom: 15,
        });
      }
    }
  }, [geoJsonData]);

  return (
    <div
      className={`rounded-lg shadow p-6 mb-6 ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } border`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3
          className={`text-lg font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {t("cluster_map_title", "Crime Clusters Map")}
        </h3>
      </div>

      <div style={{ height: "500px" }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">{t("loading", "Loading...")}</div>
          </div>
        ) : (
          <Map
            ref={mapRef}
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            style={{ width: "100%", height: "100%" }}
            mapStyle={mapStyle}
            mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
            interactiveLayerIds={["clusters", "unclustered-point"]}
          >
            {geoJsonData &&
              geoJsonData.features &&
              geoJsonData.features.length > 0 && (
                <Source
                  id="crimes"
                  type="geojson"
                  data={geoJsonData}
                  cluster={true}
                  clusterMaxZoom={14}
                  clusterRadius={50}
                >
                  <Layer {...layerStyles.clusters} />
                  <Layer {...layerStyles.clusterCount} />
                  <Layer {...layerStyles.unclusteredPoint} />
                </Source>
              )}
          </Map>
        )}
      </div>

      {!isLoading &&
        (!geoJsonData ||
          !geoJsonData.features ||
          geoJsonData.features.length === 0) && (
          <div className="flex items-center justify-center h-32 text-gray-500">
            {t("no_data_available", "No data available to display")}
          </div>
        )}

      <div
        className={`mt-4 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
      >
        <p>
          {t(
            "cluster_map_description",
            "This map shows crime data clustered by location. Click on clusters to zoom in and see individual points."
          )}
        </p>
      </div>
    </div>
  );
};

export default ClusterMap;
