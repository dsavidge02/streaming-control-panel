import { apiFetch } from "@/api/fetchClient";

describe("apiFetch", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	test("success response returns success data", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ flow: "ok" }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		const result = await apiFetch<{ flow: string }>("/auth/login", {
			method: "POST",
		});

		expect(result).toEqual({ status: "success", data: { flow: "ok" } });
		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:7077/auth/login",
			expect.objectContaining({ credentials: "include" }),
		);
	});

	test("error envelope parsed into typed error", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(
					JSON.stringify({
						error: {
							code: "NOT_IMPLEMENTED",
							message: "not implemented",
						},
					}),
					{
						status: 501,
						headers: { "Content-Type": "application/json" },
					},
				),
			),
		);

		await expect(apiFetch("/auth/login")).resolves.toEqual({
			status: "error",
			code: "NOT_IMPLEMENTED",
			httpStatus: 501,
			message: "not implemented",
		});
	});

	test("malformed error body falls back to SERVER_ERROR", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ nope: true }), {
					status: 500,
					headers: { "Content-Type": "application/json" },
				}),
			),
		);

		await expect(apiFetch("/auth/login")).resolves.toEqual({
			status: "error",
			code: "SERVER_ERROR",
			httpStatus: 500,
			message: "HTTP 500",
		});
	});

	test("network failure returns synthesized SERVER_ERROR", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

		await expect(apiFetch("/auth/login")).resolves.toEqual({
			status: "error",
			code: "SERVER_ERROR",
			httpStatus: 0,
			message: "Network request failed.",
		});
	});
});
