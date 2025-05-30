// Expo application configuration for AgriMarket West Africa
// NOTE: This file was renamed from app.json to app.js. Ensure all tooling supports .js format.

// Guidelines:
// - Update "version" using semantic versioning: major.minor.patch
// - Validate all asset paths and identifiers before releasing
// - Add new permissions/capabilities in respective platform sections as needed

{
  // Main Expo configuration
  "expo": {
    // General app info
    "name": "AgriMarket West Africa",
    "slug": "agrimarket-west-africa",
    "version": "1.0.0", // Use semantic versioning (e.g., 1.1.0 for minor updates)
    "orientation": "portrait",
    "icon": "./assets/images/icon.png", // Ensure this asset exists
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,

    // Splash screen settings
    "splash": {
      "image": "./assets/images/splash-icon.png", // Validate image path
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },

    // iOS-specific settings
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "app.rork.agrimarket-west-africa"
      // ADDITIONAL SUGGESTION: Add permissions/capabilities as needed, e.g.:
      // "infoPlist": { "NSCameraUsageDescription": "This app uses the camera to..." }
    },

    // Android-specific settings
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png", // Validate
        "backgroundColor": "#ffffff"
      },
      "package": "app.rork.agrimarket-west-africa"
      // ADDITIONAL SUGGESTION: Add permissions as needed, e.g.:
      // "permissions": ["CAMERA", "ACCESS_FINE_LOCATION"]
    },

    // Web-specific settings
    "web": {
      "favicon": "./assets/images/favicon.png" // Ensure this asset exists
    },

    // Plugins used in this Expo app
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://rork.com/"
        }
        // The 'expo-router' plugin enables file-based routing for navigation.
      ]
    ],

    // Experimental features
    "experiments": {
      "typedRoutes": true // Enables type-safe routing if supported in your codebase
    }
  }
}

// End of configuration
// Automated or manual validation of this file before production is recommended.
