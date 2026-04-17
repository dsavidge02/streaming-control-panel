# Architecture Review

Reviewed file: [C:\github\streaming-control-panel\docs\architecture.md](C:\github\streaming-control-panel\docs\architecture.md)

Review lens: `ls-arch` consumer test for cross-epic technical clarity, consistency with the local-desktop PRD, and foundational risk.

## Findings

1. **[P1] The localhost HTTP server uses cookie-authenticated routes, but the architecture never defines a CSRF/origin defense for requests coming from outside the Electron renderer.**

   References: `architecture.md:77-78`, `architecture.md:122-123`, `architecture.md:162-166`, `architecture.md:233-255`

   The document commits to a local Fastify server on `http://localhost:<port>`, ordinary HTTP mutations, and `iron-session` cookie auth. That creates a real local attack surface: other processes or browser tabs on the same machine can attempt to call the localhost routes. Route gating and encrypted cookies are not sufficient on their own. This is a foundational architecture concern because it affects every authenticated route across F2-F6. Without a settled defense such as strict Origin/Host validation, CSRF tokens for state-changing routes, a renderer-held bearer secret, or a named-pipe/custom-protocol alternative, downstream tech designs can make inconsistent or unsafe choices.

   Recommended fix: add a cross-cutting decision for localhost trust boundaries that explicitly defines how only the packaged renderer may call authenticated mutation routes.

2. **[P1] Flow 1 assumes the OAuth round-trip returns an authenticated session to the renderer, but the architecture never settles whether auth happens in the Electron window or the system browser.**

   References: `architecture.md:122-123`, `architecture.md:224-257`

   The sign-in flow issues a session cookie on the localhost callback and then redirects to `/home`, which only works if the same cookie jar is the one the renderer will later use. In Electron, that depends entirely on whether the Twitch authorize step runs inside the BrowserWindow session or in the user's external browser. If the system browser is used, the callback cookie lands there, not in the app, and the renderer remains unauthenticated. This is not a minor implementation detail; it is the load-bearing auth boundary for the whole product. Leaving it open means different F1/F2 tech designs could produce incompatible auth models.

   Recommended fix: settle the auth surface here. Either commit to an in-app auth window/session that owns the cookie jar, or commit to an external-browser OAuth flow plus an explicit handoff mechanism back into the Electron app that does not rely on the browser carrying the app session.

3. **[P2] The single-tenant rebind model removes `tenant_id` from feature tables, but the architecture never defines the reset boundary required to prevent data bleed on account switch.**

   References: `architecture.md:138-142`, `architecture.md:198-199`, `architecture.md:213`

   The architecture intentionally simplifies v1 by omitting `tenant_id` from feature data, but it also says signing in with a different Twitch account rebinds the install and replaces prior data. Those two choices together make account switch an all-or-nothing destructive reset operation. Without an explicit architecture rule for how rebinding happens, downstream implementations can easily leave stale commands, chatter history, clips, or cached Twitch state attached to the new broadcaster binding. This is a cross-epic concern because the wipe boundary spans Auth, Data Layer, Channel Management, Live Surface, and Automation.

   Recommended fix: add a cross-cutting decision that rebinding is an atomic install reset, including database wipe, token purge, in-memory state teardown, and EventSub session restart before the new binding is considered active.

## Notes

- I spot-checked the most time-sensitive stack claims against official upstream sources during review, including Node 24 LTS and Electron 41, and did not find review-worthy mismatches there.

## Overall Assessment

The document is strong overall. The architecture thesis is clear, the top-tier domains are coherent, the event-bus-centered system shape is easy for downstream tech designers to inherit, and the core stack decisions are mostly settled at the right altitude. The remaining issues are not about missing libraries or weak diagrams; they are about two foundational seams that need to be explicit before downstream work starts: the localhost security boundary and the OAuth/session handoff model. Tightening those, plus the account-rebind reset rule, would make this a much safer handoff artifact.
