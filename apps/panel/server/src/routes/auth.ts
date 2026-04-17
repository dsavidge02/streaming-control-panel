import type { FastifyInstance } from "fastify";
import { AppError, PATHS } from "@panel/shared";
import { registerRoute } from "../server/registerRoute.js";

export function registerAuthRoutes(app: FastifyInstance): void {
	registerRoute(app, {
		method: "POST",
		url: PATHS.auth.login,
		exempt: true,
		handler: async () => {
			throw new AppError(
				"NOT_IMPLEMENTED",
				"Sign-in is wired but Epic 2 (Twitch OAuth & Tenant Onboarding) has not yet landed.",
			);
		},
	});
}
