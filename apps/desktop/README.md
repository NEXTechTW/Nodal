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

Bundles land in `apps/desktop/target/release/bundle/`. The installer is in `bundle/nsis/` and the raw app is `target/release/nodal-desktop.exe`, which works as a portable build.

The square app icon source is `icons/app-icon.png`. Regenerate the Windows, macOS and Linux icon files after replacing it:

```
cd apps/desktop
npx @tauri-apps/cli icon icons/app-icon.png -o icons
```

Do not add the `android` or `ios` folders the command creates; this project only ships a desktop app.

Noto Sans (SIL OFL) will ship with the desktop build. The browser build just uses system fonts.
