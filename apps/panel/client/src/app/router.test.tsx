import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { defineRoute } from "@/app/defineRoute";
import { routes } from "@/app/routes";
import { PaletteProvider } from "@/palette/PaletteProvider";

function renderRegisteredRoutes(initialEntry: string) {
	const memoryRouter = createMemoryRouter(
		routes.map((route) => route.toRouteObject()),
		{ initialEntries: [initialEntry] },
	);

	return render(
		<PaletteProvider>
			<RouterProvider router={memoryRouter} />
		</PaletteProvider>,
	);
}

describe("router", () => {
	test("TC-2.1a: /home redirects to landing unauth", async () => {
		renderRegisteredRoutes("/home");

		expect(
			await screen.findByRole("button", { name: "Sign in with Twitch" }),
		).toBeInTheDocument();
	});

	test("TC-2.1b: /settings redirects to landing unauth", async () => {
		renderRegisteredRoutes("/settings");

		expect(
			await screen.findByRole("button", { name: "Sign in with Twitch" }),
		).toBeInTheDocument();
	});

	test("TC-2.1c: unknown gated path redirects to landing", async () => {
		renderRegisteredRoutes("/foo-bar-baz");

		expect(
			await screen.findByRole("button", { name: "Sign in with Twitch" }),
		).toBeInTheDocument();
	});

	test("TC-2.5b: a newly registered gated route inherits the gate", async () => {
		const memoryRouter = createMemoryRouter(
			[
				defineRoute({
					path: "/test-gated",
					name: "test-gated",
					element: createElement(
						"div",
						{ "data-testid": "gated-content" },
						"SECRET",
					),
					gated: true,
				}).toRouteObject(),
				defineRoute({
					path: "/",
					name: "landing-for-test",
					element: createElement(
						"div",
						{ "data-testid": "landing-for-test" },
						"LANDING",
					),
					gated: false,
				}).toRouteObject(),
			],
			{ initialEntries: ["/test-gated"] },
		);

		render(
			<PaletteProvider>
				<RouterProvider router={memoryRouter} />
			</PaletteProvider>,
		);

		expect(await screen.findByTestId("landing-for-test")).toBeInTheDocument();
		expect(screen.queryByTestId("gated-content")).not.toBeInTheDocument();
	});

	test("TC-2.6a: home and settings are registered as gated", () => {
		expect(routes.find((route) => route.name === "home")?.gated).toBe(true);
		expect(routes.find((route) => route.name === "home")?.path).toBe("/home");
		expect(routes.find((route) => route.name === "settings")?.gated).toBe(true);
		expect(routes.find((route) => route.name === "settings")?.path).toBe(
			"/settings",
		);
		expect(routes.find((route) => route.name === "landing")?.gated).toBe(false);
	});
});
