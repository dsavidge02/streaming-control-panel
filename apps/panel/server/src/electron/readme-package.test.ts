import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const readmePath = resolve(__dirname, "../../../../../README.md");

describe("README packaging", () => {
	it("includes the packaging command and deferred cross-OS note", () => {
		const readme = readFileSync(readmePath, "utf8");

		expect(readme).toContain("pnpm package");
		expect(readme).toContain(
			"Cross-OS installers and code signing are deferred until after M3.",
		);
	});
});
