import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PaletteSwitcher } from "@/palette/PaletteSwitcher";
import { usePalette } from "@/palette/usePalette";

vi.mock("@/palette/usePalette", () => ({
	usePalette: vi.fn(),
}));

const mockedUsePalette = vi.mocked(usePalette);
const setPalette = vi.fn();

describe("PaletteSwitcher", () => {
	beforeEach(() => {
		setPalette.mockReset();
		mockedUsePalette.mockReturnValue({
			palette: {
				id: "amber",
				name: "Amber CRT",
				blurb:
					"Classic amber monochrome terminal. Highest legibility of the set.",
				tag: "dark · high-contrast",
				bg: "#131005",
				bgPanel: "#1f1a0a",
				bgPanelOverlay: "rgba(31,26,10,0.88)",
				ink: "#ffd89a",
				inkMuted: "#c9a66a",
				primary: "#ffb347",
				primaryInk: "#131005",
				accent: "#7fd4ff",
				accentInk: "#0a1420",
				warn: "#ff8a6b",
				rule: "#3a2f15",
				scanline: "rgba(255,179,71,0.04)",
				gridLine: "rgba(255,179,71,0.08)",
				mesh: "mesh",
			},
			setPalette,
		});
	});

	test("defaults to a collapsed trigger button", () => {
		render(<PaletteSwitcher />);

		expect(
			screen.getByRole("button", { name: "Open palette switcher" }),
		).toHaveAttribute("aria-expanded", "false");
		expect(
			screen.queryByRole("button", { name: "Use Neon Night palette" }),
		).not.toBeInTheDocument();
	});

	test("expanding reveals all 5 palette swatches", async () => {
		render(<PaletteSwitcher />);
		const user = userEvent.setup();
		await user.click(
			screen.getByRole("button", { name: "Open palette switcher" }),
		);

		expect(
			screen.getByRole("region", { name: "Palette options" }),
		).toBeInTheDocument();
		expect(
			screen.getAllByRole("button", { name: /Use .* palette/ }),
		).toHaveLength(5);
	});

	test("clicking a swatch calls setPalette with its id", async () => {
		render(<PaletteSwitcher />);
		const user = userEvent.setup();
		await user.click(
			screen.getByRole("button", { name: "Open palette switcher" }),
		);
		await user.click(
			screen.getByRole("button", { name: "Use Neon Night palette" }),
		);

		expect(setPalette).toHaveBeenCalledWith("neon");
	});

	test("active swatch visually distinguished", () => {
		render(<PaletteSwitcher />);
		fireEvent.click(
			screen.getByRole("button", { name: "Open palette switcher" }),
		);

		expect(
			screen.getByRole("button", { name: "Use Amber CRT palette" }),
		).toHaveAttribute("aria-pressed", "true");
	});

	test("escape closes the expanded pane", async () => {
		render(<PaletteSwitcher />);
		const user = userEvent.setup();
		await user.click(
			screen.getByRole("button", { name: "Open palette switcher" }),
		);

		await user.keyboard("{Escape}");

		expect(
			screen.queryByRole("button", { name: "Use Neon Night palette" }),
		).not.toBeInTheDocument();
	});
});
