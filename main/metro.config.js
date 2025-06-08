// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// disable the new package.json "exports" resolution
config.resolver.unstable_enablePackageExports = false;

module.exports = config;