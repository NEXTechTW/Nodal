# How this was built

Notes on the skills that shaped the work. Not a checklist, just where ideas came from.

Tokens are three layers (raw values, roles, components) in `styles/tokens.css`, one gray scale plus one blue for buttons. Line colors stay separate so the UI never looks like a subway map.

Labels on every control, visible focus, keyboard tools (V/A/C/H), live regions for toasts, reduced motion respected, errors say how to fix them, buttons start with a verb. That covers most of what the accessibility and writing notes asked for.

Layout is grouped with space not lines, one main action per screen, and the type scale in tokens keeps sizes from drifting. Radius inner+padding, press to 0.96, icons in `currentColor`. Slides and full shadcn were skipped for now; the token file is ready if they show up.

Not yet checked properly: the 320px / 200% zoom pass and a screen-reader walk are still code-only. Those need a real browser session before a release. There is no Figma file, so sizes came from `PROJECT.md` text.
