import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const cmdExe = process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe";

function resolvePnpmCli() {
	if (process.env.PNPM_CLI_PATH) return process.env.PNPM_CLI_PATH;
	if (process.env.npm_execpath?.toLowerCase().includes("pnpm")) {
		return process.env.npm_execpath;
	}
	const exe = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
	const pathDirs = (process.env.PATH ?? "").split(path.delimiter);
	for (const dir of pathDirs) {
		if (!dir) continue;
		const candidate = path.join(dir, exe);
		if (existsSync(candidate)) return candidate;
	}
	throw new Error(
		`Unable to locate pnpm CLI. Set PNPM_CLI_PATH or ensure ${exe} is on PATH.`,
	);
}

const pnpmCli = resolvePnpmCli();

function runPnpm(args) {
	const quotedArgs = args.map((arg) =>
		/[\s"]/u.test(arg) ? `"${arg.replaceAll('"', '\\"')}"` : arg,
	);
	execFileSync(
		cmdExe,
		["/d", "/s", "/c", `call ${pnpmCli} ${quotedArgs.join(" ")}`],
		{
			cwd: repoRoot,
			stdio: "inherit",
		},
	);
}

runPnpm(["rebuild:electron"]);
runPnpm(["exec", "electron-vite", "build"]);
runPnpm(["exec", "electron-builder"]);
await delay(5000);
runPnpm(["--filter", "@panel/server", "rebuild", "better-sqlite3"]);
execFileSync(
	process.execPath,
	[path.join(scriptDir, "touch-better-sqlite3-binding.mjs")],
	{
		cwd: repoRoot,
		stdio: "inherit",
	},
);
