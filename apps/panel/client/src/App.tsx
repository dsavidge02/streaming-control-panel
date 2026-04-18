import { RouterProvider } from "react-router";

import { router } from "@/app/router";
import { PaletteProvider } from "@/palette/PaletteProvider";

export function App() {
	return (
		<PaletteProvider>
			<RouterProvider router={router} />
		</PaletteProvider>
	);
}
