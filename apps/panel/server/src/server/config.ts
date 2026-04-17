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

export function loadConfig(): ServerConfig {
	return {
		port: PANEL_PORT,
		host: PANEL_HOST,
		databasePath: path.join(process.cwd(), "panel.sqlite"),
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
