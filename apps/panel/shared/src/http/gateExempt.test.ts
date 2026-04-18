import { describe, expect, it } from "vitest";
import { GATE_EXEMPT_PATHS } from "./gateExempt.js";

describe("GATE_EXEMPT_PATHS", () => {
	it("TC-2.3a contains exactly /auth/login and /oauth/callback", () => {
		expect([...GATE_EXEMPT_PATHS]).toEqual(["/auth/login", "/oauth/callback"]);
	});
});
