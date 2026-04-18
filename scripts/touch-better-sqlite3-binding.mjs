import { existsSync, readdirSync, utimesSync } from "node:fs";
import path from "node:path";

const pnpmDir = path.join(process.cwd(), "node_modules", ".pnpm");
const bindingSuffix = path.join(
	"better-sqlite3",
	"build",
	"Release",
	"better_sqlite3.node",
);

function findBinding(startDir) {
	const stack = [startDir];

	while (stack.length > 0) {
		const currentDir = stack.pop();
		if (!currentDir) {
			continue;
		}

		for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
			const fullPath = path.join(currentDir, entry.name);

			if (entry.isDirectory()) {
				stack.push(fullPath);
				continue;
			}

			if (
				entry.isFile() &&
				entry.name === "better_sqlite3.node" &&
				fullPath.endsWith(bindingSuffix)
			) {
				return fullPath;
			}
		}
	}

	return null;
}

if (!existsSync(pnpmDir)) {
	console.error("[rebuild:node] missing node_modules/.pnpm");
	process.exit(1);
}

const bindingPath = findBinding(pnpmDir);
if (!bindingPath) {
	console.error(
		"[rebuild:node] better-sqlite3 binding not found after rebuild",
	);
	process.exit(1);
}

const now = new Date();
utimesSync(bindingPath, now, now);
console.log(bindingPath);
