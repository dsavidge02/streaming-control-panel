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
type Workflow = {
	jobs?: Record<string, WorkflowJob>;
	on?: Record<string, unknown>;
};

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

// pnpm subcommands that don't reference a user-defined script.
const PNPM_BUILTINS = new Set([
	"install",
	"i",
	"add",
	"remove",
	"rm",
	"update",
	"up",
	"audit",
	"outdated",
	"list",
	"ls",
	"why",
	"link",
	"ln",
	"unlink",
	"exec",
	"dlx",
	"rebuild",
	"rb",
	"prune",
	"store",
	"fetch",
	"doctor",
	"root",
	"bin",
	"deploy",
	"env",
	"init",
	"create",
	"setup",
	"import",
	"patch",
	"patch-commit",
	"patch-remove",
	"licenses",
	"publish",
	"pack",
	"server",
	"recursive",
]);

// Flags that consume the next token as their value.
const PNPM_VALUE_FLAGS = new Set([
	"-F",
	"--filter",
	"--filter-prod",
	"-C",
	"--dir",
	"-w",
	"--workspace",
]);

function extractScriptName(command: string): string | null {
	const tokens = command.split(/\s+/).slice(1);
	let i = 0;
	while (i < tokens.length) {
		const token = tokens[i];
		if (!token) {
			i += 1;
			continue;
		}
		if (token.startsWith("-")) {
			i += PNPM_VALUE_FLAGS.has(token) ? 2 : 1;
			continue;
		}
		if (PNPM_BUILTINS.has(token)) return null;
		if (token === "run") return tokens[i + 1] ?? null;
		return token;
	}
	return null;
}

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

			const scriptName = extractScriptName(trimmed);
			if (scriptName === null) continue;

			expect(
				scriptNames.has(scriptName),
				`ci.yml runs \`${trimmed}\` but root package.json has no script named \`${scriptName}\`. ` +
					`Define it in root package.json or change the workflow to call an existing script.`,
			).toBe(true);
		}
	});

	it("TC-5.5b: workflow does not trigger on main-branch pushes", () => {
		const on = workflow.on ?? {};
		expect(Object.hasOwn(on, "push")).toBe(false);
	});
});
