import { errorEnvelopeSchema, type ErrorCode } from "@panel/shared";

export type ApiResult<T> =
	| { status: "success"; data: T }
	| {
			status: "error";
			code: ErrorCode;
			httpStatus: number;
			message: string;
	  };

export async function apiFetch<T>(
	path: string,
	init: RequestInit = {},
): Promise<ApiResult<T>> {
	let response: Response;

	try {
		const headers = new Headers(init.headers);
		if (!headers.has("Content-Type") && init.body) {
			headers.set("Content-Type", "application/json");
		}

		response = await fetch(resolveServerUrl(path), {
			...init,
			credentials: "include",
			headers,
		});
	} catch {
		return {
			status: "error",
			code: "SERVER_ERROR",
			httpStatus: 0,
			message: "Network request failed.",
		};
	}

	if (!response.ok) {
		const body = await response.json().catch(() => null);
		const parsed = errorEnvelopeSchema.safeParse(body);

		if (parsed.success) {
			return {
				status: "error",
				code: parsed.data.error.code,
				httpStatus: response.status,
				message: parsed.data.error.message,
			};
		}

		return {
			status: "error",
			code: "SERVER_ERROR",
			httpStatus: response.status,
			message: `HTTP ${response.status}`,
		};
	}

	const data = (await response.json()) as T;
	return { status: "success", data };
}

export function resolveServerUrl(path: string): string {
	return `http://localhost:7077${path}`;
}
