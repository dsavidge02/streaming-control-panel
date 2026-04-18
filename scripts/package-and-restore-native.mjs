import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const pnpmCli =
	process.env.PNPM_CLI_PATH ??
	"C:\\Users\\dsavi\\AppData\\Local\\fnm_multishells\\6536_1776434373367\\pnpm.cmd";
const cmdExe = process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe";

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
