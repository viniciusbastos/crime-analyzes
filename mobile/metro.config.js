const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add react-native-maps resolver for Expo
config.resolver.assetExts.push('db');

module.exports = config;