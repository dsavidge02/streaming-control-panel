import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const workflowPath = resolve(repoRoot, ".github/workflows/ci.yml");
const rootPackageJsonPath = resolve(repoRoot, "package.json");

type WorkflowStep = { run?: string; uses?: string };
type WorkflowJob = { "runs-on"?: unknown; steps?: WorkflowStep[] };
type Workflow = { jobs?: Record<string, WorkflowJob> };

const workflow = load(readFileSync(workflowPath, "utf8")) as Workflow;
const rootScripts =
	(
		JSON.parse(readFileSync(rootPackageJsonPath, "utf8")) as {
			scripts?: Record<string, string>;
		}
	).scripts ?? {};

const jobs = Object.values(workflow.jobs ?? {});
const allSteps: WorkflowStep[] = jobs.flatMap((job) => job.steps ?? []);

const releaseActionPatterns = [
	/^actions\/create-release(@|$)/,
	/^softprops\/action-gh-release(@|$)/,
	/^ncipollo\/release-action(@|$)/,
];

describe("ci.yml structural invariants", () => {
	it("TC-5.3a: no packaging, release-publish, or cross-OS steps", () => {
		expect(jobs.length).toBeGreaterThan(0);

		for (const job of jobs) {
			expect(typeof job["runs-on"]).toBe("string");
			expect(job["runs-on"] as string).toMatch(/^ubuntu/);
		}

		for (const step of allSteps) {
			if (typeof step.run === "string") {
				expect(step.run).not.toMatch(/electron-builder/);
				const trimmed = step.run.trim();
				expect(trimmed).not.toBe("pnpm package");
				expect(trimmed.startsWith("pnpm package ")).toBe(false);
			}
			if (typeof step.uses === "string") {
				for (const pattern of releaseActionPatterns) {
					expect(step.uses).not.toMatch(pattern);
				}
			}
		}
	});

	it("TC-5.4a: every `pnpm <script>` run maps to a script in root package.json", () => {
		const scriptNames = new Set(Object.keys(rootScripts));
		expect(scriptNames.size).toBeGreaterThan(0);

		for (const step of allSteps) {
			if (typeof step.run !== "string") continue;
			const trimmed = step.run.trim();
			if (!trimmed.startsWith("pnpm ")) continue;

			const tokens = trimmed.split(/\s+/);
			const subcommand = tokens[1];
			if (subcommand === "install") continue;

			expect(
				scriptNames.has(subcommand as string),
				`ci.yml runs \`${trimmed}\` but root package.json has no script named \`${subcommand}\`. ` +
					`Define it in root package.json or change the workflow to call an existing script.`,
			).toBe(true);
		}
	});
});
