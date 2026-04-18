import { Landing } from "@/views/Landing";
import { PaletteProvider } from "@/palette/PaletteProvider";

export function App() {
	return (
		<PaletteProvider>
			<Landing />
		</PaletteProvider>
	);
}
