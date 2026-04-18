import { expect, test } from "@playwright/test";

import { renderLanding } from "./fixtures/fixtures";

const palettes = ["neon", "amber", "cream", "pocket", "beacon"] as const;

for (const palette of palettes) {
	test(`landing.default.${palette}`, async ({ page }) => {
		await renderLanding(page, undefined, palette);
		await expect(page).toHaveScreenshot(`landing.default.${palette}.png`, {
			animations: "disabled",
			fullPage: true,
		});
	});
}

test("landing.sign-in-pending.amber", async ({ page }) => {
	await renderLanding(page, "sign-in-pending", "amber");
	await expect(page).toHaveScreenshot("landing.sign-in-pending.amber.png", {
		animations: "disabled",
		fullPage: true,
	});
});

for (const palette of palettes) {
	test(`landing.sign-in-error-501.${palette}`, async ({ page }) => {
		await renderLanding(page, "sign-in-error-501", palette);
		await expect(page).toHaveScreenshot(
			`landing.sign-in-error-501.${palette}.png`,
			{
				animations: "disabled",
				fullPage: true,
			},
		);
	});
}

test("landing.sign-in-error-403.amber", async ({ page }) => {
	await renderLanding(page, "sign-in-error-403", "amber");
	await expect(page).toHaveScreenshot("landing.sign-in-error-403.amber.png", {
		animations: "disabled",
		fullPage: true,
	});
});

test("landing.sign-in-error-500.amber", async ({ page }) => {
	await renderLanding(page, "sign-in-error-500", "amber");
	await expect(page).toHaveScreenshot("landing.sign-in-error-500.amber.png", {
		animations: "disabled",
		fullPage: true,
	});
});

test("landing.redirect-home.amber", async ({ page }) => {
	await renderLanding(page, "redirect-home", "amber");
	await expect(page).toHaveScreenshot("landing.redirect-home.amber.png", {
		animations: "disabled",
		fullPage: true,
	});
});

test("landing.redirect-settings.amber", async ({ page }) => {
	await renderLanding(page, "redirect-settings", "amber");
	await expect(page).toHaveScreenshot("landing.redirect-settings.amber.png", {
		animations: "disabled",
		fullPage: true,
	});
});

test("landing.palette-switcher-open.amber", async ({ page }) => {
	await renderLanding(page, undefined, "amber");
	await page.getByRole("button", { name: "Open palette switcher" }).click();
	await expect(page).toHaveScreenshot(
		"landing.palette-switcher-open.amber.png",
		{
			animations: "disabled",
			fullPage: true,
		},
	);
});

test("landing.default.amber.responsive-960x600", async ({ page }) => {
	await page.setViewportSize({ width: 960, height: 600 });
	await renderLanding(page, undefined, "amber");
	await expect(page).toHaveScreenshot(
		"landing.default.amber.responsive-960x600.png",
		{ animations: "disabled", fullPage: true },
	);
});
