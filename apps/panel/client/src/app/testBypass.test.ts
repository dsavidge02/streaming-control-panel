import { isTestBypassEnabled, readForcedState } from "@/app/testBypass";

describe("testBypass", () => {
	const env = import.meta.env as ImportMetaEnv & { DEV: boolean };
	const originalDev = env.DEV;

	afterEach(() => {
		env.DEV = originalDev;
		window.history.replaceState(null, "", "/");
	});

	test("disabled returns null", () => {
		env.DEV = false;
		window.history.replaceState(null, "", "/?forceState=sign-in-error-501");

		expect(isTestBypassEnabled()).toBe(false);
		expect(readForcedState()).toBeNull();
	});

	test("parses sign-in-error-501 with palette", () => {
		env.DEV = true;
		window.history.replaceState(
			null,
			"",
			"/?forceState=sign-in-error-501&palette=neon",
		);

		expect(readForcedState()).toMatchObject({
			palette: "neon",
			signIn: {
				code: "NOT_IMPLEMENTED",
				state: "error",
			},
		});
	});

	test("invalid palette value ignored", () => {
		env.DEV = true;
		window.history.replaceState(
			null,
			"",
			"/?forceState=redirect-home&palette=garbage",
		);

		expect(readForcedState()).toEqual({ redirectedFrom: "/home" });
	});
});
