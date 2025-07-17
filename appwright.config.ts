import { defineConfig, Platform } from "appwright";

export default defineConfig({
  projects: [
    {
      name: "android",
      use: {
        platform: Platform.ANDROID,
        device: {
          provider: "emulator",
        },
        buildPath: "app-release.apk",
      },
    },
  ],
});
