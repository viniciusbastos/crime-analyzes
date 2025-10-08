import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import { useHeatmapData } from "../hooks/useCrimeData";
import * as Location from "expo-location";

import MapView, { Marker } from "react-native-maps";
// import HeatMap from "react-native-maps-heatmap"; // Commented out due to missing package
const MapScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { data: heatmapData, isLoading, error } = useHeatmapData();
  const [region, setRegion] = useState({
    latitude: -11.485506, // Rio Real, Bahia coordinates as default
    longitude: -37.931477,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  // Transform heatmap data to match library format [longitude, latitude, intensity]
  const transformedHeatmapData = React.useMemo(
    () =>
      heatmapData
        ? heatmapData.map((point) => [
            point[1], // longitude
            point[0], // latitude
          ])
        : [],
    [heatmapData]
  );

  useEffect(() => {
    if (error) {
      console.error("Heatmap data error:", error);
      Alert.alert(t("error"), t("map.loadError"));
    }
  }, [error, t]);

  useEffect(() => {
    // Log heatmap data for debugging
    console.log("Heatmap data loaded:", heatmapData);
    console.log("Transformed data:", transformedHeatmapData);
    console.log("Data length:", transformedHeatmapData.length);
    console.log("Is loading:", isLoading);
    console.log("Has error:", error);
  }, [heatmapData, transformedHeatmapData, isLoading, error]);

  useEffect(() => {
    // Request location permissions
    const requestLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("Location permission denied");
          Alert.alert(
            t("permissions.location.title"),
            t("permissions.location.message")
          );
        } else {
          console.log("Location permission granted");
        }
      } catch (error) {
        console.error("Error requesting location permission:", error);
      }
    };

    requestLocationPermission();
  }, [t]);

  console.log("MapScreen rendering - region:", region);
  console.log("MapScreen rendering - isLoading:", isLoading);
  console.log("MapScreen rendering - error:", error);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          {t("map.title")}
        </Text>
      </View>

      <View style={styles.mapContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text
              style={[
                styles.loadingText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {t("loading")}
            </Text>
          </View>
        ) : (
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={(newRegion) => {
              console.log("Map region changed:", newRegion);
              setRegion(newRegion);
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            onMapReady={() => console.log("Map is ready")}
            onError={(error) => console.log("Map error:", error)}
          ></MapView>
        )}

        {transformedHeatmapData.length === 0 && !isLoading && (
          <View style={styles.noDataContainer}>
            <Text
              style={[
                styles.noDataText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {t("map.noData")}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};
function createStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme?.colors?.outline ?? "#e0e0e0",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
    },
    mapContainer: { flex: 1 },
    map: { flex: 1 },
    heatmap: { flex: 1 },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      fontSize: 16,
    },
    noDataContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    noDataText: {
      fontSize: 16,
      textAlign: "center",
    },
    errorText: {
      fontSize: 14,
      textAlign: "center",
      marginTop: 8,
      fontWeight: "bold",
    },
    debugText: {
      fontSize: 12,
      textAlign: "center",
      marginTop: 16,
      fontStyle: "italic",
    },
  });
}

export default MapScreen;
