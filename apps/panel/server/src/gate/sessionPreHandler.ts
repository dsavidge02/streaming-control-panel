import { AppError } from "@panel/shared";
import type { FastifyReply, FastifyRequest } from "fastify";
import { unsealData } from "iron-session";

const SESSION_COOKIE_NAME = "panel_session";

export interface SessionPayload {
	broadcasterId: string;
	issuedAt: number;
}

export async function sessionPreHandler(
	req: FastifyRequest,
	_reply: FastifyReply,
): Promise<void> {
	const cookie = req.cookies[SESSION_COOKIE_NAME];
	if (!cookie) {
		throw new AppError(
			"AUTH_REQUIRED",
			"Request requires an authenticated session.",
		);
	}

	try {
		const payload = await unsealData<SessionPayload>(cookie, {
			password: req.server.config.cookieSecret,
		});
		if (
			!payload ||
			typeof payload.broadcasterId !== "string" ||
			typeof payload.issuedAt !== "number"
		) {
			throw new Error("invalid session payload");
		}
		(req as FastifyRequest & { session?: SessionPayload }).session = payload;
	} catch {
		throw new AppError(
			"AUTH_REQUIRED",
			"Session cookie is invalid or expired.",
		);
	}
}
