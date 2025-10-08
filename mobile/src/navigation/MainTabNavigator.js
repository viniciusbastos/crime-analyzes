import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../contexts/ThemeContext';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import MapScreen from '../screens/MapScreen3';
import ChartsScreen from '../screens/ChartsScreen';
import ChatScreen from '../screens/ChatScreen';

const Tab = createBottomTabNavigator();

const ThemeToggleButton = () => {
  const { isDarkMode, toggleTheme, theme } = useTheme();

  return (
    <TouchableOpacity onPress={toggleTheme} style={styles.themeToggleButton}>
      <Icon
        name={isDarkMode ? 'brightness-7' : 'brightness-3'}
        size={24}
        color={theme.colors.onSurface}
      />
    </TouchableOpacity>
  );
};

const MainTabNavigator = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Dashboard') {
              iconName = focused ? 'dashboard' : 'dashboard-outline';
            } else if (route.name === 'Statistics') {
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            } else if (route.name === 'Map') {
              iconName = focused ? 'map' : 'map-outline';
            } else if (route.name === 'Charts') {
              iconName = focused ? 'show-chart' : 'show-chart-outline';
            } else if (route.name === 'Chat') {
              iconName = focused ? 'chat' : 'chat-outline';
            }

            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: t('navigation.dashboard') }}
        />
        <Tab.Screen
          name="Statistics"
          component={StatisticsScreen}
          options={{ title: t('navigation.statistics') }}
        />
        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{ title: t('navigation.map') }}
        />
        <Tab.Screen
          name="Charts"
          component={ChartsScreen}
          options={{ title: t('navigation.charts') }}
        />
        <Tab.Screen
          name="Chat"
          component={ChatScreen}
          options={{ title: t('navigation.chat') }}
        />
      </Tab.Navigator>

      {/* Floating Theme Toggle Button */}
      <View style={styles.floatingButtonContainer}>
        <ThemeToggleButton />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeToggleButton: {
    marginRight: 15,
  },
  floatingButtonContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
  },
});

export default MainTabNavigator;