import type { PaletteId } from "@/palette/palettes";

const PALETTE_STORAGE_KEY = "panel.palette";
const paletteIds = ["neon", "amber", "cream", "pocket", "beacon"] as const;

export function isPaletteId(value: unknown): value is PaletteId {
	return (
		typeof value === "string" &&
		(paletteIds as readonly string[]).includes(value)
	);
}

export function loadPersistedPalette(): PaletteId | null {
	try {
		const value = window.localStorage.getItem(PALETTE_STORAGE_KEY);
		return isPaletteId(value) ? value : null;
	} catch {
		return null;
	}
}

export function persistPalette(id: PaletteId) {
	try {
		window.localStorage.setItem(PALETTE_STORAGE_KEY, id);
	} catch {}
}
