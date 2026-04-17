import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "@panel/shared";

export async function sessionPreHandler(
	_req: FastifyRequest,
	_reply: FastifyReply,
): Promise<void> {
	throw new AppError(
		"AUTH_REQUIRED",
		"stub: real session gate lands in Story 4",
	);
}
