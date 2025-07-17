import { test, expect } from "appwright";

test("User should be able to log in", async ({ device }) => {
  await device.getByText("Username").fill("admin");
  await device.getByText("Password").fill("password");
  await device.getByText("Login").tap();
  await expect(device.getByText("Dashboard")).toBeVisible();
});
