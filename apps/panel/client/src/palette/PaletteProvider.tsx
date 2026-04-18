import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { readForcedState } from "@/app/testBypass";
import { putPalettePreference } from "@/palette/paletteApi";
import {
	DEFAULT_PALETTE_ID,
	PALETTES,
	type Palette,
	type PaletteId,
} from "@/palette/palettes";
import { loadPersistedPalette, persistPalette } from "@/palette/persistence";

interface PaletteContextValue {
	palette: Palette;
	setPalette: (id: PaletteId) => void;
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

const cssVarEntries = [
	["--panel-bg", "bg"],
	["--panel-bg-panel", "bgPanel"],
	["--panel-bg-panel-overlay", "bgPanelOverlay"],
	["--panel-ink", "ink"],
	["--panel-ink-muted", "inkMuted"],
	["--panel-primary", "primary"],
	["--panel-primary-ink", "primaryInk"],
	["--panel-accent", "accent"],
	["--panel-accent-ink", "accentInk"],
	["--panel-warn", "warn"],
	["--panel-rule", "rule"],
	["--panel-scanline", "scanline"],
	["--panel-grid-line", "gridLine"],
	["--panel-mesh", "mesh"],
] as const satisfies ReadonlyArray<[string, keyof Palette]>;

export function PaletteProvider({ children }: { children: ReactNode }) {
	const forcedPalette = readForcedState()?.palette ?? null;
	const [paletteId, setPaletteId] = useState<PaletteId>(
		forcedPalette ?? DEFAULT_PALETTE_ID,
	);

	useEffect(() => {
		if (forcedPalette) {
			setPaletteId(forcedPalette);
			return;
		}

		const persisted = loadPersistedPalette();
		if (persisted) {
			setPaletteId(persisted);
		}
	}, [forcedPalette]);

	const palette = PALETTES[paletteId];

	useEffect(() => {
		const root = document.documentElement;
		for (const [cssVar, paletteKey] of cssVarEntries) {
			root.style.setProperty(cssVar, palette[paletteKey]);
		}
	}, [palette]);

	const value = useMemo<PaletteContextValue>(
		() => ({
			palette,
			setPalette: (id) => {
				setPaletteId(id);
				persistPalette(id);
				void putPalettePreference(id);
			},
		}),
		[palette],
	);

	return (
		<PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
	);
}

export function usePalette() {
	const context = useContext(PaletteContext);

	if (!context) {
		throw new Error("usePalette must be used within a PaletteProvider");
	}

	return context;
}
