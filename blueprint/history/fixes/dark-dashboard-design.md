# Fix: Dark dashboard design

**Type:** Fix
**Status:** verified
**Branch:** fix/dark-dashboard-design

## The problem

The dashboard (`apps/web/src/components/dashboard/dashboard-shell.tsx`) uses the
light Tailwind Plus application shell: a white top bar, white search field and
a white profile menu. The project owner has added a dark version and wants the
dashboard to use it until a dark-mode toggle exists.

The references were reorganised:

| Reference file | What it is |
| --- | --- |
| `design/references/tailwind-plus/application/dashboard-dark.jsx` | the dark shell to use now |
| `design/references/tailwind-plus/application/dashboard-light.jsx` | identical to the removed `dashboard.jsx`, kept for the future toggle |

## The fix

Port the class changes from `dashboard-dark.jsx` into `dashboard-shell.tsx`.
The dashboard is **always dark**, whatever the system theme, until a toggle is
added.

The changes are class-only:

| Element | Light (current) | Dark |
| --- | --- | --- |
| Shell root | no background | `min-h-full bg-gray-900`, so the page behind the shell is dark in light mode too (the reference asks for `<html class="bg-gray-900">`, but the root layout is shared) |
| Mobile sidebar panel | `… ring-1 ring-white/10` | add `before:pointer-events-none before:absolute before:inset-0 before:bg-black/10` |
| Top bar | `border-gray-200 bg-white` | `border-white/10 bg-gray-900` |
| Open-sidebar button | `text-gray-700 hover:text-gray-900` | `text-gray-400 hover:text-white` |
| Separators | `bg-gray-900/10` | `bg-white/10` (mobile) and `lg:bg-gray-100/10` (desktop) |
| Search input | `bg-white text-gray-900 placeholder:text-gray-400` | `bg-gray-900 text-white placeholder:text-gray-500` |
| Notifications button | `hover:text-gray-500` | `hover:text-gray-300` |
| Avatar | `bg-gray-50 outline-black/5` | `bg-gray-800 outline-white/10` |
| Name and chevron | `text-gray-900`, `text-gray-400` | `text-white`, `text-gray-500` |
| Menu panel | `bg-white shadow-lg outline-gray-900/5` | `bg-gray-800 outline -outline-offset-1 outline-white/10`, with no shadow |
| Menu items (Your profile, Sign out) | `text-gray-900 data-focus:bg-gray-50` | `text-white data-focus:bg-white/5` |

- Update the shell's header comment to point at `dashboard-dark.jsx` and say
  it is always dark until the toggle exists.
- Commit the reference reorganisation (the removed `dashboard.jsx` and the two
  new files) with this fix.

**Must not break:**
- the mobile sidebar dialog
- the profile menu (Your profile, Sign out) by mouse and keyboard
- the parent's name in the top bar
- `/profile` and every other page, which keep their current light/dark styles
- the sidebar, which is already dark, and the `Logo onDark`

No new dependency, and no theme setting or toggle (that comes later).

## Build steps

- [x] **1. Port the dark shell classes**
  - Apply the table above to `dashboard-shell.tsx`.
  - Done when: the class changes match `dashboard-dark.jsx` and the only other
    edit is the comment. `npm run typecheck`, `npm run lint:web` and
    `npm run build:web` pass.

## Verify

1. Run `npm run dev:web`, sign in and open `/dashboard` with your computer in
   **light** mode:
   - the top bar, search field and page background are dark
   - your name is white
   - the profile menu opens as a dark panel, and Your profile and Sign out
     highlight on hover and keyboard focus
2. Switch the system to **dark** mode. The dashboard looks the same.
3. Below 1024px wide, open and close the sidebar.
4. Open `/profile`. It still follows the system theme as before.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":3575,"specSha256":"5ff48155ac1f50d3390e165b7eab6055ff801b2fa40801d0fc475d791f51a08b","branch":"refs/heads/fix/dark-dashboard-design","head":"d7ed46bc4417353848520734ac65911c917b639d","baseRef":"refs/heads/dev","baseCommit":"d7ed46bc4417353848520734ac65911c917b639d","sourceTree":"c55640d11b8cd94ddb9872fa0d9b853a6f88e6a8","landing":"local-merge","absentOptional":[]} -->

## Try it now

1. Run `npm run dev:web`, sign in and open `/dashboard` with your computer in **light** mode:
   - the top bar, search field and page background are dark, and your name is white
   - the profile menu opens as a dark panel, and Your profile and Sign out highlight on hover and keyboard focus
2. Switch the system to **dark** mode. The dashboard looks the same.
3. Below 1024px wide, open and close the sidebar.
4. Open `/profile`. It still follows the system theme as before.
