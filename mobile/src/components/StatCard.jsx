import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, useTheme } from 'react-native-paper';

const StatCard = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'blue',
}) => {
  const theme = useTheme();

  const getAccentColor = (color) => {
    const colors = {
      blue: theme.colors.primary,
      green: '#22c55e',
      red: theme.colors.error,
      purple: '#a855f7',
      orange: '#f97316',
      teal: '#14b8a6',
    };
    return colors[color] || theme.colors.primary;
  };

  const accentColor = getAccentColor(color);

  const getTrendColor = (trend) => {
    if (trend > 0) return theme.colors.error;
    if (trend < 0) return '#16a34a';
    return theme.colors.onSurfaceVariant;
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return '↗️';
    if (trend < 0) return '↘️';
    return '➡️';
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
      <Card.Content style={styles.content}>
        <View style={styles.leftSection}>
          <View style={[styles.iconContainer, { backgroundColor: accentColor + '20' }]}>
            <Text style={[styles.icon, { color: accentColor }]}>{icon}</Text>
          </View>
        </View>
        <View style={styles.rightSection}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>{title}</Text>
            {trend !== undefined && (
              <Text style={[styles.trend, { color: getTrendColor(trend) }]}>
                {getTrendIcon(trend)} {Math.abs(trend).toFixed(1)}%
              </Text>
            )}
          </View>
          <Text style={[styles.value, { color: accentColor }]}>
            {value}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  content: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftSection: {
    marginRight: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  rightSection: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  trend: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});

export default StatCard;