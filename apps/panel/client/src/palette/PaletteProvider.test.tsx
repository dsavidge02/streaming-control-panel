import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PaletteProvider } from "@/palette/PaletteProvider";
import { usePalette } from "@/palette/usePalette";

function PaletteConsumer() {
	const { palette, setPalette } = usePalette();

	return (
		<div>
			<div data-testid="active-palette">{palette.id}</div>
			<button onClick={() => setPalette("neon")} type="button">
				Use neon
			</button>
			<button onClick={() => setPalette("beacon")} type="button">
				Use beacon
			</button>
		</div>
	);
}

describe("PaletteProvider", () => {
	beforeEach(() => {
		window.localStorage.clear();
		document.documentElement.style.cssText = "";
		window.history.replaceState(null, "", "/");
	});

	test("default amber applied on first render", async () => {
		render(
			<PaletteProvider>
				<PaletteConsumer />
			</PaletteProvider>,
		);

		await waitFor(() => {
			expect(
				document.documentElement.style
					.getPropertyValue("--panel-primary")
					.trim(),
			).toBe("#ffb347");
		});
		expect(screen.getByTestId("active-palette")).toHaveTextContent("amber");
	});

	test("switching palette updates CSS vars", async () => {
		render(
			<PaletteProvider>
				<PaletteConsumer />
			</PaletteProvider>,
		);
		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Use neon" }));

		await waitFor(() => {
			expect(
				document.documentElement.style
					.getPropertyValue("--panel-primary")
					.trim(),
			).toBe("#ff5faa");
		});
	});

	test("persisted palette loads from localStorage", async () => {
		window.localStorage.setItem("panel.palette", "cream");

		render(
			<PaletteProvider>
				<PaletteConsumer />
			</PaletteProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("active-palette")).toHaveTextContent("cream");
		});
	});

	test("switching palette writes to localStorage", async () => {
		render(
			<PaletteProvider>
				<PaletteConsumer />
			</PaletteProvider>,
		);
		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Use beacon" }));

		expect(window.localStorage.getItem("panel.palette")).toBe("beacon");
	});

	test("invalid localStorage value falls back to default", async () => {
		window.localStorage.setItem("panel.palette", "garbage");

		render(
			<PaletteProvider>
				<PaletteConsumer />
			</PaletteProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("active-palette")).toHaveTextContent("amber");
		});
	});
});
