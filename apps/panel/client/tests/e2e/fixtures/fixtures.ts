import type { Page } from "@playwright/test";

type ForcedState =
	| "default"
	| "sign-in-pending"
	| "sign-in-error-501"
	| "sign-in-error-403"
	| "sign-in-error-500"
	| "redirect-home"
	| "redirect-settings";

type PaletteId = "neon" | "amber" | "cream" | "pocket" | "beacon";

const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:5173";

export function buildLandingUrl(
	options: { state?: ForcedState; palette?: PaletteId } = {},
) {
	const params = new URLSearchParams();

	if (options.state) {
		params.set("forceState", options.state);
	}

	if (options.palette) {
		params.set("palette", options.palette);
	}

	const query = params.toString();
	return `${baseUrl}/${query ? `?${query}` : ""}`;
}

export async function renderLanding(
	page: Page,
	state?: ForcedState,
	palette?: PaletteId,
) {
	await page.goto(buildLandingUrl({ state, palette }), {
		waitUntil: "networkidle",
	});
	await page.waitForSelector('[data-testid="landing-root"]');
}
