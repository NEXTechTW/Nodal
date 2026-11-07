# Nodal desktop (Tauri 2)

The desktop shell wraps the same `apps/web` editor. No editor code lives here.

## Prereqs

- Rust 1.77+ (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- `cargo install tauri-cli --version "^2"`
- `pnpm install`

## Dev

```sh
# Terminal 1: web editor
pnpm --filter @linewright/web dev
# Terminal 2: desktop shell
cd apps/desktop && cargo tauri dev
```

## Build (Windows / macOS / Linux)

```sh
cd apps/desktop && cargo tauri build
```

Outputs land in `apps/desktop/target/release/bundle/`.

## Icons

`tauri.conf.json` expects `apps/desktop/icons/` (32×32, 128×128, `.icns`, `.ico`).
Generate them from the SVG mark:

```sh
cd apps/desktop
cargo tauri icon ../web/public/logo.svg
```

## Licensing

- Shell: MIT (this repo) / Apache-2.0 (Tauri). No GPL deps.
- Fonts: Noto Sans, SIL OFL — see PROJECT.md §2.
