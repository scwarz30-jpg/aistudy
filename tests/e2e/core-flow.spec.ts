import { expect, test } from "@playwright/test";

test("signup page renders the account form", async ({ page }) => {
  await page.goto("/signup");

  await expect(page.getByRole("heading", { name: "건강 관리를 시작하세요" })).toBeVisible();
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
});

test("onboarding form renders required profile fields", async ({ page }) => {
  await page.goto("/onboarding");

  await expect(
    page.getByRole("heading", { name: "기본 건강 프로필을 만들어 주세요" }),
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

  await expect(page.getByText("건강 안내", { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      "입력한 정보는 건강 관리를 위한 일반 참고 정보이며, 진단이나 치료를 대신하지 않습니다.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "증상이 있거나 약을 복용 중이라면 먼저 의료 전문가와 상담해 주세요.",
    ),
  ).toBeVisible();
});

test("daily check-in shows the safety notice copy", async ({ page }) => {
  await page.goto("/check-in");

  await expect(page.getByText("안전 안내")).toBeVisible();
  await expect(
    page.getByText(
      "이 기능은 매일 상태를 기록하기 위한 도구입니다. 심한 증상, 호흡곤란, 흉통, 심한 출혈이 있으면 먼저 의료진의 도움을 받아 주세요.",
    ),
  ).toBeVisible();
});
