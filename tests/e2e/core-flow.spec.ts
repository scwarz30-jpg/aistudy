import { expect, test } from "@playwright/test";

test("signup page renders the account form", async ({ page }) => {
  await page.goto("/signup");

  await expect(page.getByRole("heading", { name: "Start managing your health" })).toBeVisible();
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
});

test("onboarding form renders required profile fields", async ({ page }) => {
  await page.goto("/onboarding");

  await expect(
    page.getByRole("heading", { name: "Build your baseline health profile" }),
  ).toBeVisible();
  await expect(page.locator('input[name="nickname"]')).toBeVisible();
  await expect(page.locator('input[name="heightCm"]')).toBeVisible();
  await expect(page.locator('input[name="weightKg"]')).toBeVisible();
  await expect(page.locator('select[name="weightGoal"]')).toBeVisible();
});

test("dashboard sends unauthenticated visitors to login", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login$/);
});

test("onboarding shows the health disclaimer copy", async ({ page }) => {
  await page.goto("/onboarding");

  await expect(page.getByText("Health notice")).toBeVisible();
  await expect(
    page.getByText(
      "This information is for general wellness guidance only and does not replace medical diagnosis or treatment.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "If you have symptoms or take medication, speak with a qualified professional first.",
    ),
  ).toBeVisible();
});
