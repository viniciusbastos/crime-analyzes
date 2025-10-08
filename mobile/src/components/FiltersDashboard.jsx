import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, Animated, Pressable } from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { TextInput } from "react-native";

const FiltersDashboardStatistics = ({
  filters = {},
  onFiltersChange,
}) => {
  const theme = useTheme();
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const animation = useRef(new Animated.Value(0)).current;

  const toggleFilters = () => {
    const newCollapsed = !filtersCollapsed;
    setFiltersCollapsed(newCollapsed);
    Animated.timing(animation, {
      toValue: newCollapsed ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={styles.filterContainer}>
      <Pressable onPress={toggleFilters} style={({pressed}) => [styles.filterHeader, pressed && {opacity: 0.7}]}>
        <Text style={[styles.filterTitle, { color: theme.colors.onSurface }]}>
          🔍 Filters
        </Text>
        <MaterialIcons
          name={filtersCollapsed ? "expand-more" : "expand-less"}
          size={24}
          color={theme.colors.onSurface}
        />
      </Pressable>
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            height: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 200], // Consider making this dynamic based on content height
            }),
          },
        ]}
      >
        <View style={styles.filterOptions}>
          <Text
            style={[
              styles.filterSectionTitle,
              { color: theme.colors.onSurface },
            ]}
          >
            Quick Date Ranges
          </Text>
          <View style={styles.quickDateContainer}>
            {[
              { label: "Last 7 days", value: "7d" },
              { label: "Last 30 days", value: "30d" },
              { label: "Last 3 months", value: "3m" },
              { label: "Last 6 months", value: "6m" },
              { label: "Last year", value: "1y" },
            ].map((range) => (
              <Pressable
                key={range.value}
                onPress={() => {
                  onFiltersChange({ ...filters, quick_date: range.value });
                }}
                style={({pressed}) => [
                  styles.quickDateButton,
                  { backgroundColor: theme.colors.surface },
                  filters.quick_date === range.value && {
                    backgroundColor: theme.colors.primary,
                  },
                  pressed && {opacity: 0.7}
                ]}
              >
                <Text
                  style={[
                    styles.quickDateText,
                    {
                      color:
                        filters.quick_date === range.value
                          ? theme.colors.onPrimary
                          : theme.colors.onSurface,
                    },
                  ]}
                >
                  {range.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            placeholder="City"
            value={filters.city || ""}
            onChangeText={(text) => {
              onFiltersChange({ ...filters, city: text });
            }}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.onSurface,
                borderColor: theme.colors.outline,
              },
            ]}
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
          <Pressable
            onPress={() => {
              onFiltersChange({});
            }}
            style={({pressed}) => [
              styles.resetButton,
              { backgroundColor: theme.colors.secondary },
              pressed && {opacity: 0.7}
            ]}
          >
            <Text
              style={[styles.resetText, { color: theme.colors.onSecondary }]}
            >
              Reset Filters
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    margin: 16,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  animatedContainer: {
    overflow: "hidden",
  },
  filterOptions: {
    padding: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  quickDateContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  quickDateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  quickDateText: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  resetButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  resetText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default FiltersDashboardStatistics;
