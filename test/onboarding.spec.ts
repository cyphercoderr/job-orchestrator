// tests/onboarding.spec.js
import { test, expect } from "appwright";

test("Onboarding flow should complete successfully", async ({ device }) => {
  await device.getByText("Get Started").tap();
  await device.getByText("Next").tap();
  await device.getByText("Allow").tap();
  await expect(device.getByText("You're all set!")).toBeVisible();
});
