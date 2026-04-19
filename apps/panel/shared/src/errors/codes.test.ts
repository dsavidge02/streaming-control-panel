import { AppError, ERROR_CODES } from "./codes.js";
import { expect, test } from "vitest";

test("TC-8.3a registry contains starter set", () => {
	expect(Object.keys(ERROR_CODES).slice().sort()).toEqual([
		"AUTH_REQUIRED",
		"INPUT_INVALID",
		"NOT_IMPLEMENTED",
		"ORIGIN_REJECTED",
		"SERVER_ERROR",
	]);
});

test("each registry entry exposes status and defaultMessage", () => {
	for (const entry of Object.values(ERROR_CODES)) {
		expect(typeof entry.status).toBe("number");
		expect(typeof entry.defaultMessage).toBe("string");
		expect(entry.defaultMessage.length).toBeGreaterThan(0);
	}
});

test("AppError wires code, status, and default message", () => {
	const error = new AppError("AUTH_REQUIRED");

	expect(error.code).toBe("AUTH_REQUIRED");
	expect(error.status).toBe(401);
	expect(error.message).toBe(ERROR_CODES.AUTH_REQUIRED.defaultMessage);
	expect(error.message.length).toBeGreaterThan(0);
});
