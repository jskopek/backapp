# 09 — Packaging, Releases, and Open-Source Hygiene

## Goal
Produce installable builds for macOS and Windows, with a clear open-source contribution path.

## Deliverables
- Release builds for macOS + Windows.
- Documented build steps.
- Basic CI (optional for v1).

## Steps
1) Packaging
   - `pnpm tauri build`
   - Confirm output artifacts:
     - macOS: `.app` and/or `.dmg`
     - Windows: `.msi` or installer

2) Signing (document-only for v1)
   - macOS notarization steps documented
   - Windows code signing documented

3) Release process
   - GitHub Releases checklist
   - Versioning conventions

4) OSS hygiene
   - `LICENSE`
   - `CODE_OF_CONDUCT.md` (optional)
   - `CONTRIBUTING.md`

## Acceptance Criteria
- A new developer can follow docs and build locally.
- A release artifact can be produced for both OSes.

