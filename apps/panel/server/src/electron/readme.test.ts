import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const readmePath = resolve(__dirname, "../../../../../README.md");

describe("README dev modes", () => {
	it("includes all documented development commands", () => {
		const readme = readFileSync(readmePath, "utf8");

		expect(readme).toContain("pnpm --filter @panel/client dev");
		expect(readme).toContain("pnpm --filter @panel/server dev");
		expect(readme).toContain("pnpm start");
	});
});
