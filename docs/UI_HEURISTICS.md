# UI design and Nielsen's 10 usability heuristics

How each heuristic is applied in the React frontend.

| # | Heuristic | Where it shows up |
|---|-----------|-------------------|
| 1 | **Visibility of system status** | `Skeleton` placeholders while loading; submit buttons show "Saving…/Working…" and disable while busy; `Toast` reports every result; the browser tab title and breadcrumb always name the current page (`Shell`). |
| 2 | **Match between system and real world** | Plain words ("My classes", "Take attendance", "Due in 3 days"); relative times ("5 min ago") instead of raw timestamps. |
| 3 | **User control and freedom** | Every dialog closes with Cancel, ✕, Esc or a click outside; "Back" on drill-down pages; assignments that already have submissions can be closed instead of deleted. |
| 4 | **Consistency and standards** | One component set (`ui.jsx`, `shared.jsx`) and one design-token stylesheet; identical list, form, dialog and badge patterns in every workspace; icons always paired with text. |
| 5 | **Error prevention** | `ConfirmDialog` before destructive actions; required-field markers; type and size checks on uploads before sending; the server validates too. |
| 6 | **Recognition rather than recall** | Visible navigation with icons and labels; filters show counts; selects and pickers instead of typed IDs; empty states explain the next step. |
| 7 | **Flexibility and efficiency of use** | `/` jumps to search; "Skip to main content" link; shortcut buttons on dashboards ("Take attendance", "Review 3"); full keyboard operation with a focus trap in dialogs. |
| 8 | **Aesthetic and minimalist design** | Calm neutral palette with one accent colour, generous spacing, one primary action per screen, secondary actions as ghost buttons. |
| 9 | **Help users recognise, diagnose and recover from errors** | Errors are written in plain language, shown next to the field or in an alert, announced to screen readers (`role="alert"`), and offer **Try again** where retrying makes sense. |
| 10 | **Help and documentation** | **Help & shortcuts** in the sidebar opens `HelpDialog`; field hints; the sign-in page says who to ask about a forgotten password. |

## Accessibility notes

* Colour is never the only signal: status badges carry text.
* Inputs have labels; icon-only buttons have `aria-label`.
* `prefers-reduced-motion` disables animation.
* Dialogs trap focus, restore it on close and set `aria-modal`.
