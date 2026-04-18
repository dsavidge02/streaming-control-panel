import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";

import { Landing } from "@/views/Landing";
import { renderWithRouter } from "@/test/renderWithRouter";
import { withFetchRecorder } from "@/test/mockFetch";

describe("Landing", () => {
	test("TC-1.2a: landing view content inventory", () => {
		renderWithRouter(<Landing />);

		expect(screen.getByText(/CONTROL\/\/PANEL/)).toBeInTheDocument();
		expect(
			screen.getByText(/A local desktop panel for the solo Twitch streamer\./),
		).toBeInTheDocument();
		expect(screen.getByText("Channel management")).toBeInTheDocument();
		expect(screen.getByText("Live moderation")).toBeInTheDocument();
		expect(screen.getByText("Clip creation")).toBeInTheDocument();
		expect(screen.getByText("Custom !commands")).toBeInTheDocument();
		expect(screen.getByText("Welcome bot")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Sign in with Twitch" }),
		).toBeInTheDocument();
	});

	test("TC-1.4b: no outbound HTTP on mount", async () => {
		const { calls } = await withFetchRecorder(async () => {
			renderWithRouter(<Landing />);
			return null;
		});

		expect(calls).toHaveLength(0);
	});

	test("TC-2.4a: landing reachable unauthenticated", () => {
		renderWithRouter(<Landing />, { route: "/" });

		expect(screen.getByTestId("landing-root")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Sign in with Twitch" }),
		).toBeEnabled();
	});

	test("redirect flash appears when router state carries redirectedFrom", () => {
		renderWithRouter(<Landing />, {
			route: "/",
			routerState: { redirectedFrom: "/home" },
		});

		expect(screen.getByRole("status")).toHaveTextContent(
			"/home REQUIRES AUTHENTICATION",
		);
	});
});
