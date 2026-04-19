Expected self-hosted font files for packaged builds:

- `PressStart2P-Regular.woff2`
- `SpaceMono-Regular.woff2`
- `SpaceMono-Bold.woff2`

Story 5 wires the `@font-face` plumbing and uses the Google Fonts CDN in dev as a temporary fallback until these binaries are present.
