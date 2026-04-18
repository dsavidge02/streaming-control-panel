import { AppError } from "@panel/shared";
import type { FastifyReply, FastifyRequest } from "fastify";

export async function originPreHandler(
	req: FastifyRequest,
	_reply: FastifyReply,
): Promise<void> {
	const origin = req.headers.origin;
	const { allowedOrigins } = req.server.config;

	if (!origin) {
		throw new AppError("ORIGIN_REJECTED", "Request is missing Origin header.");
	}
	if (!allowedOrigins.includes(origin)) {
		throw new AppError(
			"ORIGIN_REJECTED",
			`Origin ${origin} is not in the allowed set.`,
		);
	}
}
