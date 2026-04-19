import { z } from "zod";

export const ERROR_CODES = {
	AUTH_REQUIRED: {
		status: 401,
		defaultMessage: "Authenticated session required.",
	},
	ORIGIN_REJECTED: {
		status: 403,
		defaultMessage: "Request origin is not allowed.",
	},
	INPUT_INVALID: {
		status: 400,
		defaultMessage: "Request validation failed.",
	},
	NOT_IMPLEMENTED: {
		status: 501,
		defaultMessage: "This route is not yet implemented.",
	},
	SERVER_ERROR: {
		status: 500,
		defaultMessage: "An unexpected server error occurred.",
	},
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

const errorCodeValues = Object.keys(ERROR_CODES) as [ErrorCode, ...ErrorCode[]];
const errorCodeSchema = z.enum(errorCodeValues);

export class AppError extends Error {
	public readonly code: ErrorCode;
	public readonly status: number;

	constructor(code: ErrorCode, message?: string) {
		super(message ?? ERROR_CODES[code].defaultMessage);
		this.code = code;
		this.status = ERROR_CODES[code].status;
		this.name = "AppError";
	}
}

export const errorEnvelopeSchema = z.object({
	error: z.object({
		code: errorCodeSchema,
		message: z.string().min(1),
	}),
});

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
