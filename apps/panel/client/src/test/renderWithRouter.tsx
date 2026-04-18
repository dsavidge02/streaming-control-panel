import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router";

import { PaletteProvider } from "@/palette/PaletteProvider";

interface RouterOptions extends RenderOptions {
	route?: string;
	routerState?: unknown;
}

export function renderWithRouter(
	ui: ReactElement,
	options: RouterOptions = {},
) {
	const { route = "/", routerState, ...renderOptions } = options;
	const initialEntry =
		routerState === undefined
			? route
			: {
					pathname: route,
					state: routerState,
				};

	return render(
		<MemoryRouter initialEntries={[initialEntry]}>
			<PaletteProvider>{ui}</PaletteProvider>
		</MemoryRouter>,
		renderOptions,
	);
}
