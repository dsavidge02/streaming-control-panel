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

let raw = readFileSync(redRefPath, "utf8");
raw = raw.replace(/^\uFEFF/, "");
raw = raw.replace(/\0/g, "");
raw = raw.trim();

if (!/^[0-9a-f]{40}$/i.test(raw)) {
	const preview = Buffer.from(readFileSync(redRefPath))
		.subarray(0, 80)
		.toString("hex");
	console.error(
		`[guard:no-test-changes] ERROR: .red-ref contains invalid content; expected 40-char hex SHA, got first 80 bytes: ${preview}`,
	);
	process.exit(2);
}

const redRef = raw;
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
