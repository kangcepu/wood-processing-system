import { expect, test } from "@playwright/test";

const SEEDED_USERNAME = "super_admin";
const SEEDED_PASSWORD = "Wps#2026Seed!";

test.describe("Authentication journey", () => {
  test("login, view profile, and logout", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Username / NIK (Kode Karyawan)").fill(SEEDED_USERNAME);
    await page.getByLabel("Password").fill(SEEDED_PASSWORD);
    await page.getByRole("button", { name: "Masuk" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("Selamat datang")).toBeVisible();

    await page.goto("/profile");
    await expect(page.getByText("Informasi Akun")).toBeVisible();

    await page.getByRole("button", { name: "Menu profil" }).hover();
    await page.getByRole("button", { name: "Logout" }).click();

    await expect(page).toHaveURL(/\/login$/);
  });

  test("rejects an invalid password", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Username / NIK (Kode Karyawan)").fill(SEEDED_USERNAME);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Masuk" }).click();

    await expect(page.getByText("Login Gagal")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
