import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

export const PANEL_PORT = 7077;
export const PANEL_HOST = "127.0.0.1";

export interface ServerConfig {
	port: number;
	host: string;
	databasePath: string;
	allowedOrigins: readonly string[];
	cookieSecret: string;
}

function resolveUserDataDbPath(): string {
	try {
		const requireFn = createRequire(import.meta.url);
		const electron = requireFn("electron") as {
			app?: { getPath?: (name: string) => string };
		};
		const basePath = electron.app?.getPath?.("userData");

		if (typeof basePath === "string" && basePath.length > 0) {
			return path.join(basePath, "panel.sqlite");
		}
	} catch {
		// Electron is not loaded in pure Node test environments.
	}

	return path.join(os.tmpdir(), "panel-dev.sqlite");
}

export function loadConfig(): ServerConfig {
	return {
		port: PANEL_PORT,
		host: PANEL_HOST,
		databasePath: resolveUserDataDbPath(),
		allowedOrigins: [
			"http://localhost:5173",
			"http://127.0.0.1:5173",
			"app://panel",
		],
		cookieSecret:
			process.env.PANEL_COOKIE_SECRET ??
			"dev-only-change-in-epic-2-___________",
	};
}

declare module "fastify" {
	interface FastifyInstance {
		config: ServerConfig;
	}
}
