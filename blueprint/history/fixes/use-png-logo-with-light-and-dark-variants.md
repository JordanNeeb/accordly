# Fix: Use PNG logo with light and dark variants

**Type:** Fix
**Status:** verified
**Branch:** fix/use-png-logo-with-light-and-dark-variants

## The problem

`Logo` (`apps/web/src/components/common/logo.tsx`) renders the text "Tango" in
Momo Signature as a stand-in. The user has added the real logo artwork to
`design/references/` (untracked, 2026-10-14). There are two 1774×887
transparent PNGs, each about 365 KB:

| File | Artwork | Use in |
|---|---|---|
| `Tango Interlocking Loop Logo.png` | orange and blue loops, **dark** "tango" text | light mode |
| `Tango Logo with Interlocking Loops.png` | same loops, **white** "tango" text | dark mode |

Each image has wide transparent padding around the artwork, roughly 8% on the
sides and 20% top and bottom.

## The fix

- **Assets:**
  - Copy both PNGs to `apps/web/public/brand/` as `logo-light.png` (dark text)
    and `logo-dark.png` (white text).
  - Crop away the transparent padding so the artwork fills the image and sizes
    predictably. Compute the bounds from the alpha channel and crop with
    `sips`, which is built into macOS. No new dependency is needed.
  - Leave the originals in `design/references/` untouched, as reference only.
- **`Logo`:**
  - Render both images with `next/image`, using `alt="Tango"`, the display
    size (109×36) as `width`/`height`, and `className="h-9 w-auto"`.
  - Light mode shows `logo-light.png` and hides the other with `dark:hidden`.
    Dark mode shows `logo-dark.png` with `hidden dark:block`. This follows the
    app's existing `prefers-color-scheme` dark mode.
  - Neither image uses `priority`. With default lazy loading, the browser
    does not download the hidden variant. `next/image` resizes and compresses
    the large PNGs automatically.
  - The hidden image is `display:none`, so screen readers announce "Tango"
    once.
  - Wrap both images in a `flex` container that takes the existing `className`
    prop. The auth layouts change their prop from `text-center` to
    `justify-center` so the logo stays centred.
  - Remove `Momo_Signature`. `Logo` was its only user, so the font is no
    longer loaded anywhere.
- **Height:** use `h-9` (36px) to start. The artwork is about 3:1 after
  cropping, so it is about 110px wide. The user can tune this in review.
- Out of scope: email templates and the mobile app. The favicon was added as
  step 3 below (user, 2026-10-14).

### Added scope (user, 2026-10-14)

The user asked to add a favicon from the new logo artwork, and to give the
source PNGs better names in a better location. Both were added to this active
fix rather than a new one.

- **Brand source files:** move the three untracked originals out of
  `design/references/`, which holds design screenshots, into a new
  `design/brand/` folder. Rename them by what they show:

  | From `design/references/` | To `design/brand/` |
  |---|---|
  | `Tango Interlocking Loop Logo.png` | `tango-logo-dark-text.png` |
  | `Tango Logo with Interlocking Loops.png` | `tango-logo-white-text.png` |
  | `Intertwined Orange and Blue Loops.png` (1536×1024, glowing loops on black) | `tango-loops-glow.png` |

  - Commit them as the brand sources.
  - Add `design/brand/` to the structure lists in `AGENTS.md` and `README.md`.
  - Point the `Logo` comment at the new folder.
  - The app copies in `apps/web/public/brand/` keep their use-based names,
    `logo-light.png` and `logo-dark.png`.
- **Favicon:** the user chose the glowing loops (`tango-loops-glow.png`).
  - Crop a centred square around the loops with `sips`.
  - Write it as Next.js App Router file-convention icons: `app/icon.png`
    (512×512) and `app/apple-icon.png` (180×180). Next adds the
    `<link rel="icon">` and `<link rel="apple-touch-icon">` tags itself, so no
    metadata code is needed.
  - Replace the create-next-app `app/favicon.ico` with a 32×32 Tango version if
    `sips` can write ICO. Otherwise, remove it so browsers use the PNG icon
    instead of the Next.js logo.
  - The black background stays, because it is part of the artwork and keeps
    the glow visible on light browser tabs.

## Build steps

- [x] 1. **Add cropped logo assets and switch `Logo` to the images**
  - **Evidence (2026-10-14):**
    - Alpha bounds, ignoring alpha of 8 or less: light 143,185 to 1632,667 and
      dark 143,184 to 1631,669.
    - Both files were cropped to the same union box plus a 4px margin (offset
      139,180, size 1497x493) with `sips`, so the two variants line up.
    - Re-measured bounds sit 4–6px inside every edge, so no transparent padding
      is left.
    - typecheck, lint, and build pass, and `rg -i momo apps/web/src` finds
      nothing.
    - `/sign-in`, `/sign-up`, `/forgot-password`, and signed-in `/profile`
      (`rename-1792018850@test.dev`, signed out afterwards) serve two
      `alt="Tango"` images with `dark:hidden` and `hidden dark:block`. The auth
      pages centre them with `justify-center`.
    - `/_next/image` returns 200 for both variants.
    - Correction during build: the first version used the artwork's 1497x493
      as `width`/`height`, which made `next/image` point the default `src` at a
      3840px-wide image. It now uses the display size, 109x36, so the srcset is
      128w at 1x (about 2 KB) and 256w at 2x (about 4 KB).
    - The visual light/dark switch was not observed by the agent (no browser
      tool); it is left to the user's Try it now.
  - Create `fix/use-png-logo-with-light-and-dark-variants` from `dev`.
  - Crop and copy the PNGs to `public/brand/`. Update `Logo`, `auth-card.tsx`
    (both layouts), and `profile/page.tsx` as above.
  - **Done when:**
    - `npm run typecheck`, `npm run lint:web`, and `npm run build:web` pass.
    - `rg -i momo apps/web/src` finds nothing.
    - The cropped files have no fully transparent edge rows or columns.
    - `/sign-in`, `/sign-up`, `/forgot-password`, and signed-in `/profile`
      serve both `<img alt="Tango">` tags with the `dark:hidden` and
      `hidden dark:block` classes.
    - `/_next/image` returns each optimised image with status 200.
    - In a browser, light mode shows the dark-text logo and dark mode shows the
      white-text logo, centred on the auth pages and left-aligned on the
      profile header.

- [x] 2. **Move and rename the brand source files**
  - **Evidence (2026-10-14):**
    - The three files were moved to `design/brand/`. The SHA-256 of each matches
      its original (`130607f5…`, `1051c031…`, `1cc9a25c…`), and
      `design/references/` now holds only `tailwind-plus/`.
    - `AGENTS.md` and `README.md` list `design/brand/`, and the `Logo` comment
      points there.
    - `rg "Interlocking|Intertwined"` outside history matches only this spec.
  - `mkdir design/brand` and move and rename the three PNGs as in the table.
    They are untracked, so a plain `mv` is enough. Update `AGENTS.md`,
    `README.md`, and the `Logo` comment.
  - **Done when:**
    - `design/references/` has no PNGs left, and `design/brand/` has the three
      renamed files with the same bytes (matching SHA-256).
    - `rg "Interlocking|Intertwined" --glob '!blueprint/history/**'` finds only
      this spec.

- [x] 3. **Add the favicon and app icons**
  - **Evidence (2026-10-14):**
    - Outside the loops, `tango-loops-glow.png` is transparent: its alpha bounds
      are 258,32 to 1321,1010. The first plain 1024 square clipped both loops,
      so the art was cropped with even margins (`sips`: 1184×1006 at offset
      198,18) and padded to a 1184 square. That leaves about 60px of space on
      the sides and 103px above and below.
    - Resized to `app/icon.png` (512×512, about 123 KB) and `app/apple-icon.png`
      (180×180, about 21 KB). Both checked visually, including a 32px preview.
    - `sips` writes ICO, so `app/favicon.ico` is replaced with a 32×32 Tango
      icon (`MS Windows icon resource - 1 icon, 32x32`).
    - typecheck, lint, and build pass, and the build lists `/icon.png` and
      `/apple-icon.png`.
    - `/sign-in` HTML has `rel="icon"` links for `/favicon.ico` and
      `/icon.png`, and a `rel="apple-touch-icon"` link for `/apple-icon.png`.
    - All three routes return 200 with the right type. The served sizes are
      512 and 180, and the served `favicon.ico` is byte-identical to the file.
    - The browser tab was not observed by the agent.
    - Known: iOS fills transparent apple-touch icons with black, so the loops
      sit on black on a home screen.
  - Crop a square from `design/brand/tango-loops-glow.png` that contains both
    loops, and check it visually. Generate `apps/web/src/app/icon.png`
    (512×512) and `apps/web/src/app/apple-icon.png` (180×180). Replace or
    remove `favicon.ico` as above.
  - **Done when:**
    - typecheck, lint, and build pass, and the build output lists the icon
      routes.
    - `/sign-in` HTML has `<link rel="icon" … href="/icon.png…">` and
      `<link rel="apple-touch-icon" …>`.
    - `/icon.png` and `/apple-icon.png` return 200 `image/png` at the stated
      sizes.
    - `/favicon.ico` either returns the Tango icon or is gone.
    - In a browser, the tab shows the glowing loops.

## Verify

Open http://localhost:3000/sign-in. In light mode you see the loops with dark
"tango" text. Switch to dark mode (DevTools → Rendering → prefers-color-scheme:
dark) and the white-text version appears in its place. In DevTools → Network,
only one logo variant should load. Check `/sign-up`, `/forgot-password`, and
`/profile` too. The browser tab icon should be the glowing orange and blue
loops; hard-refresh, because browsers cache favicons aggressively.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":9629,"specSha256":"d6494e5d7ee42505c262e5159d677b811b0b73a89c00a52cc4fabde78eb6ebb4","branch":"refs/heads/fix/use-png-logo-with-light-and-dark-variants","head":"d3eca2faa1330fe60675f8b8fd5cfa65ef12b8ff","baseRef":"refs/heads/dev","baseCommit":"d3eca2faa1330fe60675f8b8fd5cfa65ef12b8ff","sourceTree":"2dcfaf06289ca33a27ca6691030c5d552dbfd4ab","landing":"local-merge","absentOptional":[]} -->

## Try it now

1. Open http://localhost:3000/sign-in. In light mode you see the orange and
   blue loops with dark "tango" text, centred.
2. Switch to dark mode (DevTools → Rendering → prefers-color-scheme: dark): the
   white-text version appears in the same spot. In DevTools → Network, filter
   by "logo": only the visible variant loads.
3. Hard-refresh (Cmd+Shift+R) or use a private window: the browser tab shows the
   orange and blue loops. http://localhost:3000/icon.png shows the full icon.
4. Check `/sign-up`, `/forgot-password`, and `/profile` (signed in, logo
   left-aligned).
