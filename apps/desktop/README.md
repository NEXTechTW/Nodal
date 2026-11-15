# Desktop app

A thin Tauri 2 shell around the web editor. The editor code lives in `apps/web`, this folder only opens it in a window.

You need Rust 1.77 or newer and the Tauri CLI:

```
cargo install tauri-cli --version "^2"
```

Run the web editor in one terminal (`pnpm --filter @nodal/web dev`), then:

```
cd apps/desktop
cargo tauri dev
```

To build an installer:

```
cd apps/desktop
cargo tauri build
```

Bundles land in `apps/desktop/target/release/bundle/`. Icons are missing at the moment. Generate them from `../web/public/logo.svg` with `cargo tauri icon ../web/public/logo.svg` and drop them in `icons/`.

Noto Sans (SIL OFL) will ship with the desktop build. The browser build just uses system fonts.
