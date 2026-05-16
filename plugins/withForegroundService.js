const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withForegroundService(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    if (!mainApplication.service) {
      mainApplication.service = [];
    }

    const locationServiceName = "expo.modules.location.taskManagers.LocationTaskService";
    const exists = mainApplication.service.some(
      (s) => s.$?.["android:name"] === locationServiceName
    );

    if (!exists) {
      mainApplication.service.push({
        $: {
          "android:name": locationServiceName,
          "android:foregroundServiceType": "location",
          "android:exported": "false",
        },
      });
    }

    return config;
  });
};
