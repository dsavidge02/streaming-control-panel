import { execFileSync, spawn } from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const EXE = path.resolve(
	"dist/packaged/win-unpacked/Streaming Control Panel.exe",
);
const EXE_DIR = path.dirname(EXE);
const child = spawn(EXE, {
	cwd: EXE_DIR,
	env: { ...process.env, SMOKE_MODE: "1" },
	stdio: ["ignore", "pipe", "pipe"],
});

let stdout = "";
let stderr = "";
let exited = false;

child.stdout.on("data", (chunk) => {
	stdout += chunk.toString();
});
child.stderr.on("data", (chunk) => {
	stderr += chunk.toString();
	process.stderr.write(chunk);
});
child.once("exit", () => {
	exited = true;
});

try {
	const deadline = Date.now() + 30_000;
	let passed = false;

	while (Date.now() < deadline) {
		if (exited) {
			throw new Error("packaged app exited before backend became ready");
		}

		try {
			const response = await fetch("http://127.0.0.1:7077/auth/login", {
				method: "POST",
				headers: { Origin: "app://panel" },
			});

			if (response.status === 501) {
				const body = await response.json();
				if (body?.error?.code === "NOT_IMPLEMENTED") {
					passed = true;
					break;
				}
			}
		} catch {
			// Poll until the packaged backend is listening.
		}

		await delay(500);
	}

	if (!passed) {
		throw new Error("packaged backend did not become ready within 30s");
	}

	console.log("smoke:packaged PASS");
} finally {
	if (!exited && child.pid) {
		if (process.platform === "win32") {
			try {
				execFileSync("taskkill", ["/F", "/T", "/PID", String(child.pid)], {
					stdio: "ignore",
				});
			} catch {
				// process may already be dead
			}
		} else {
			child.kill();
		}
	}
	if (process.exitCode && (stdout || stderr)) {
		console.error(stdout.trim());
		console.error(stderr.trim());
	}
}
