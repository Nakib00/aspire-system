# UI Design and Nielsen's Heuristics

Our interface is designed to be **easy** (people finish tasks without training) and **calm and
good-looking** (consistent, uncluttered). Jakob Nielsen's ten usability heuristics are our checklist.

## Visual language

| Element | Decision |
|---------|----------|
| Layout | Left sidebar (dark) + top bar with breadcrumb + content area. Becomes a slide-in menu on phones. |
| Colour | Neutral greys, one indigo accent (`--primary #4f46e5`). Green = success, red = danger, amber = warning. |
| Type | Inter / system sans-serif, 14 px base. |
| Shape | 12 px rounded cards, soft shadows, 1 px borders. |
| Icons | One inline SVG set (`Icon` in `ui.jsx`), always next to a text label for important actions. |
| Spacing | Generous; one primary button per screen, secondary actions are "ghost" buttons. |
| Tokens | All colours, radius and fonts are CSS variables in `views/styles/index.css`. |

## The ten heuristics in ASPIRE

| # | Heuristic | How we apply it | Where in code |
|---|-----------|-----------------|---------------|
| 1 | **Visibility of system status** | Skeleton rows while loading; buttons say "Saving…" / "Working…" and disable; a toast confirms every result; the browser tab title and breadcrumb always show the current page. | `Skeleton`, `Toast`, `Shell` |
| 2 | **Match between system and real world** | School words ("My classes", "Take attendance", "Submitted", "Late"); "Due in 3 days", "5 min ago" instead of timestamps. | `models/format.js` |
| 3 | **User control and freedom** | Every dialog closes with Cancel, ✕, Esc or click outside; "Back" on detail pages; assignments with submissions are *closed*, not deleted. | `Modal`, `useDialog` |
| 4 | **Consistency and standards** | One component set and one token sheet; the same list → detail → form → confirm pattern in every workspace. | `ui.jsx`, `shared.jsx` |
| 5 | **Error prevention** | Confirmation before delete; required markers; upload type and size checked before sending; capacity checked before enrolling; server validates everything again. | `ConfirmDialog`, `Field` |
| 6 | **Recognition rather than recall** | Always-visible navigation with icons and labels; filters show counts; pickers instead of typing IDs; empty states say what to do next. | `Shell`, `Toolbar`, `Empty` |
| 7 | **Flexibility and efficiency** | `/` focuses search; "Skip to main content"; shortcut buttons on dashboards ("Take attendance", "Review 3"); full keyboard use. | `Toolbar`, `Shell` |
| 8 | **Aesthetic and minimalist design** | Only the information needed for the task; one accent colour; whitespace; details open in a drawer instead of a new page. | styles |
| 9 | **Help users recognise, diagnose and recover from errors** | Plain-language messages next to the field and in an alert, announced to screen readers (`role="alert"`); **Try again** on load failures; server messages say what to do ("Close it instead of deleting"). | `Field`, `alert` blocks |
| 10 | **Help and documentation** | "Help & shortcuts" dialog in the sidebar; field hints; the sign-in page says who to ask about a forgotten password. | `HelpDialog` |

## Accessibility

* Colour is never the only signal: badges carry text.
* Inputs have labels; icon-only buttons have `aria-label`.
* Dialogs trap focus, restore it on close, close on Esc, and have `aria-modal`.
* `prefers-reduced-motion` disables animation.
* Lists of items use real `<ul>`/`<button>` elements, so keyboard and screen readers work.

## Review checklist for a new screen

- [ ] Does the user always know **where they are** and **whether the last action worked**?
- [ ] Are there loading, empty and error states?
- [ ] Can a mistake be undone or is it confirmed first?
- [ ] Do names and icons match the ones used on other screens?
- [ ] Can it be used with the keyboard only? On a phone width?
- [ ] Is the primary action obvious and unique?
- [ ] Are all colours variables, not hard-coded?

## Known gaps (honest list)

* No dark mode.
* No automated accessibility test (axe) and no usability test with real teachers/parents yet; the heuristic
  evaluation above is a self-review.
* Cross-browser testing (Chrome, Firefox, Edge, Safari) from NFR-09 is not recorded.

See also: [docs/UI_HEURISTICS.md](https://github.com/Nakib00/aspire-system/blob/main/docs/UI_HEURISTICS.md).
