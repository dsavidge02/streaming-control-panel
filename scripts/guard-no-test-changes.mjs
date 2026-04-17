import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const redRefPath = path.join(repoRoot, ".red-ref");

if (!existsSync(redRefPath)) {
	console.log("[guard:no-test-changes] SKIP — no .red-ref yet");
	process.exit(0);
}

const redRef = readFileSync(redRefPath, "utf8").trim();
const output = execFileSync(
	"git",
	["diff", "--name-only", `${redRef}..HEAD`, "--", "*.test.ts", "*.test.tsx"],
	{
		cwd: repoRoot,
		encoding: "utf8",
	},
);
const changedFiles = output
	.split(/\r?\n/)
	.map((line) => line.trim())
	.filter(Boolean);

if (changedFiles.length > 0) {
	console.error(changedFiles.join("\n"));
	process.exit(1);
}

console.log(`[guard:no-test-changes] no test changes since ${redRef}`);
