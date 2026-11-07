# UI notes

Looked over the first version end to end. A few things were missing and got fixed in the same pass:

- The canvas only worked with a mouse. Added keyboard tools, Delete, and Esc, and made the canvas focusable with a label.
- Icon buttons had no accessible name. They have one now.
- Error messages were vague. They now name the problem and what to do (for example, "not valid JSON, pick a .json file from Nodal").
- Line colors reused as button colors. Buttons use the blue token now; lines keep their own colors.
- Panels overflowed on narrow screens. Below 900px they hide and the canvas takes the width.
- Transitions were `all`. They name the properties now.

What I did not check with a real browser: tab order, 200% zoom, a screen reader pass, and reduced motion. Typecheck, tests, lint, and build pass.
