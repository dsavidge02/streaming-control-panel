import { defineConfig } from "@playwright/test";

export default defineConfig({
	expect: {
		toHaveScreenshot: {
			maxDiffPixels: 100,
		},
	},
	projects: [
		{
			name: "chromium-desktop",
			use: { viewport: { width: 1280, height: 800 } },
		},
	],
	snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
	testDir: "./tests/e2e",
	use: {
		viewport: { width: 1280, height: 800 },
	},
	webServer: {
		command: "pnpm --filter @panel/client dev",
		reuseExistingServer: !process.env.CI,
		url: "http://localhost:5173",
		stdout: "ignore",
		stderr: "pipe",
	},
});
