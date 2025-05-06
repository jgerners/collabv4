// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force Metro om niet via "exports" te gaan, maar terug te vallen op main/browser
config.resolver.unstable_enablePackageExports = false;
config.resolver.unstable_conditionNames = ['require', 'default', 'browser'];

module.exports = config;
