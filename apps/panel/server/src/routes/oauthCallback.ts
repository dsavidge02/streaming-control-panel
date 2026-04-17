import type { FastifyInstance } from "fastify";
import { AppError, PATHS } from "@panel/shared";
import { registerRoute } from "../server/registerRoute.js";

export function registerOauthCallbackRoute(app: FastifyInstance): void {
	registerRoute(app, {
		method: "GET",
		url: PATHS.oauth.callback,
		exempt: true,
		handler: async () => {
			throw new AppError(
				"NOT_IMPLEMENTED",
				"OAuth callback lands with Epic 2.",
			);
		},
	});
}
