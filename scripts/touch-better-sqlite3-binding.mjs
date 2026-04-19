import { existsSync, readdirSync, utimesSync } from "node:fs";
import path from "node:path";

const nodeModulesDir = path.join(process.cwd(), "node_modules");
const pnpmDir = path.join(nodeModulesDir, ".pnpm");
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

const searchRoots = [pnpmDir, nodeModulesDir].filter(existsSync);
if (searchRoots.length === 0) {
	console.error("[rebuild:node] missing node_modules");
	process.exit(1);
}

let bindingPath = null;
for (const root of searchRoots) {
	bindingPath = findBinding(root);
	if (bindingPath) break;
}

if (!bindingPath) {
	console.error(
		"[rebuild:node] better-sqlite3 binding not found after rebuild",
	);
	process.exit(1);
}

const now = new Date();
utimesSync(bindingPath, now, now);
console.log(bindingPath);
