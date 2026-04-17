# PRD Review

Reviewed file: [C:\github\streaming-control-panel\docs\prd.md](C:\github\streaming-control-panel\docs\prd.md)

Review lens: `ls-prd` consumer test for downstream epic expansion readiness after the local-desktop rewrite.

## Findings

1. **[P1] Feature 2 makes account rebinding destructive, but the PRD never turns that into a user scenario or acceptance criteria.**

   References: `prd.md:301-305`, `prd.md:319-346`

   The local rewrite adds a major v1 rule: one install holds one broadcaster, and signing in with a different Twitch account on the same install rebinds the app and replaces prior data. That is a high-consequence product behavior, not an implementation detail. Right now it appears only as a scope bullet. None of the Feature 2 scenarios cover the rebind path, what gets deleted or preserved, whether the user is warned, whether confirmation is required, or how this differs from ordinary sign-out and re-sign-in. A downstream epic writer would have to invent the destructive-account-switch behavior from scratch.

   Recommended fix: either remove rebind-from-the-same-install from v1, or add an explicit scenario and rolled-up AC covering account switch, confirmation, local data replacement rules, and the post-rebind state.

2. **[P1] The auth/session lifecycle still reads like a hosted browser app instead of a local desktop product, so the core local-user flow is not actually settled.**

   References: `prd.md:182-196`, `prd.md:305`, `prd.md:321-346`

   The rewritten PRD says this is an Electron app running locally, but the key auth/session requirements are still expressed in web-only terms: "browser close/reopen," "session cookies scoped to localhost," "landing page," and route redirects. Those may be valid implementation choices, but at PRD altitude the product behavior should be described in desktop terms: app quit/relaunch, renderer reload, sign-in window return path, and what the user experiences when auth expires while the app remains installed locally. As written, the epic writer still has to resolve whether v1 behaves like a browser SPA in a shell or like a desktop app with persistent local identity and a thinner auth boundary.

   Recommended fix: rewrite the session/auth behavior around desktop user situations, and move cookie/localhost mechanics into architecture or tech design unless they are truly product-defining.

3. **[P2] Local installation is now part of the product promise, but the PRD still starts after installation instead of specifying the install/update experience.**

   References: `prd.md:21-24`, `prd.md:99-100`, `prd.md:248-249`, `prd.md:267-278`

   The product vision says each streamer installs and runs this app on their own machine. Scope repeats that it is an Electron-packaged desktop app for production installation. But Feature 1 begins at "First Launch" and assumes the app is already installed. The only concrete installation detail in the feature map is a development command, `pnpm install && pnpm start`, which is an implementation concern rather than a user-facing requirement. For a local desktop product, install and update posture are part of the product boundary. Without that, the epic writer has to invent whether v1 ships as an installer, unpacked bundle, manual zip, OS-specific build, or something else.

   Recommended fix: add a first-install or first-run scenario to Feature 1, or explicitly state that v1 distribution is manual and updates are out of scope so downstream work does not have to guess.

4. **[P2] Hosted multi-tenant vocabulary still leaks through the local-only rewrite and muddies what downstream epics should actually inherit.**

   References: `prd.md:84-88`, `prd.md:140-150`, `prd.md:190-193`, `prd.md:259`, `prd.md:287-289`, `prd.md:344-345`, `prd.md:595`, `prd.md:647`, `prd.md:719-724`, `prd.md:777-785`, `prd.md:803-823`, `prd.md:855-859`

   The local intent is now clear at the top of the document, but much of the body still speaks in hosted-system language: tenant, per-tenant, tenant-scoped, cross-tenant, multi-channel per tenant, and tenant session. Some of that is harmless internal vocabulary, but the PRD never states whether "tenant" is still a real v1 product concept or just inherited wording from the older hosted version. That matters because downstream epic and architecture work may preserve unnecessary tenant abstractions in a single-install, single-broadcaster product.

   Recommended fix: normalize v1 terminology around `install`, `broadcaster`, or `local profile`, and reserve `tenant` for future hosted-direction sections if that is the only place it still matters.

## Open Questions

- Is account rebinding on the same install actually a required v1 behavior, or should v1 simply reject signing in with a different broadcaster unless the app is reset?
- Does v1 need a real installer/update story in the PRD, or is manual local installation an acceptable explicit non-goal for the first release?
- Is `tenant` still an intentional internal noun for v1, or should the local rewrite remove it almost everywhere?

## Overall Assessment

The rewrite fixed the big strategic issue: the PRD now clearly describes a local desktop control panel instead of a hosted SaaS. The remaining problems are mostly about follow-through. The document still carries a few hosted-web assumptions and nouns into the local version, and the new single-install account-binding rule introduces a destructive product behavior that is not yet scenario-defined. Once those are tightened, the PRD should be in much better shape for clean downstream epic expansion.
