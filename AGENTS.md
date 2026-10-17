<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Live Browser & Automated UI Verification

Whenever you need to inspect the live UI, verify pages, check runtime/console/network errors, or test user flows in the browser:
- You do **NOT** need to ask the user to enable `/browser`.
- Use the Playwright MCP server tools (configured in `.agents/plugins/live-browser/mcp_config.json`) if loaded, OR run Playwright directly via terminal:
  - Headless check: `npm run browser:check -- / /login /dashboard`
  - Visible live browser (`--headed`): `npm run browser:live -- / /login /dashboard`
  - With screenshots: `node scripts/browser-check.mjs / --screenshot ./screenshots`
  - Or run custom interactive Playwright scripts using `@playwright/test` (`chromium.launch({ channel: 'chrome' })` or `'msedge'`).
- Ensure the Next.js dev server (`npm run dev`) is running on `http://localhost:3000` before running browser checks.

# GLOBAL UI/UX RULE — PREMIUM ICONOGRAPHY & VISUAL ASSETS

## 1. STRICTLY PROHIBIT RAW TEXT ICONS

**NEVER use plain Unicode symbols, emoji, or text characters as UI icons.**

Prohibited examples include:
- Emoji: 🏠 🔍 ⚙️ 👤 📚 ✨ 🚀 ❤️
- Unicode symbols: ★ ☆ ✓ ✕ → ← ↑ ↓ • ◆ ◇
- Text characters used as icons: `+`, `×`, `!`, `?`, `☰`, `≡`
- Emoji used in place of navigation icons, buttons, feature icons, status icons, or action icons.

Do not use these characters as substitutes for proper visual assets, even if they look acceptable in a quick prototype.

This rule applies to:
- Navigation and sidebars.
- Buttons and icon buttons.
- Forms and input fields.
- Dashboard cards and statistics.
- Tables and row actions.
- Dropdowns, menus, dialogs, and tooltips.
- Empty states and error states.
- Notifications and status indicators.
- Loading states and interactive feedback.
- Mobile navigation.
- Landing pages and marketing sections.
- All other application interfaces.

**Exception:** Ordinary text, mathematical notation, user-generated content, and decorative symbols that are genuinely part of the content may use Unicode where appropriate. This exception must never be used to bypass the UI icon rule.

## 2. USE PROFESSIONAL ICON LIBRARIES

Use icons from established, visually consistent icon libraries. Preferred sources:

1. **Lucide** — https://lucide.dev/
2. **Phosphor Icons** — https://phosphoricons.com/
3. **Iconoir** — https://iconoir.com/
4. **Tabler Icons** — https://tabler.io/icons
5. **Heroicons** — https://heroicons.com/

### Selection priority

- First, reuse the icon library already installed in the project.
- If `lucide-react` is available, use it as the default icon system.
- If the project already uses Phosphor, Tabler, Heroicons, or another consistent professional library, continue using that library.
- Do not install another icon library unnecessarily.
- Never mix multiple icon families without a clear design-system reason.
- If no suitable library exists, select one appropriate library and use it consistently.

Use official package exports and documented APIs. Do not manually copy random SVGs from unknown websites.

## 3. ICON DESIGN STANDARDS

Every icon must be selected intentionally and used consistently.

- Use semantically correct icons for their actions and meanings.
- Maintain consistent sizing, stroke weight, visual density, and alignment.
- Prefer approximately 16–20px icons for compact controls, 20–24px for primary navigation, and larger sizes only when the design genuinely requires them.
- Keep icons aligned with adjacent text and centered inside icon buttons.
- Use consistent spacing between icons and labels.
- Use the existing design tokens for icon colors.
- Use neutral colors by default, with brand colors for selected states and meaningful emphasis.
- Avoid unnecessary multicolor icons, excessive gradients, heavy shadows, and decorative effects.
- Do not use a large icon when a small one communicates the same information more clearly.
- Do not use an icon if it adds no value.

Every icon-only button must have an accessible name, an appropriate tooltip where useful, keyboard accessibility, and a visible focus state.

Do not communicate important status information through color alone.

## 4. PREMIUM VISUAL ASSETS

For illustrations, decorative graphics, logos, mascots, and empty-state artwork, prioritize high-quality, coherent assets.

Preferred sources, depending on licensing and project requirements:

- **unDraw** — https://undraw.co/illustrations
- **Storyset** — https://storyset.com/
- **Icons8** — https://icons8.com/
- **SVG Repo** — https://www.svgrepo.com/
- **LottieFiles** — https://lottiefiles.com/
- Official brand asset repositories when representing third-party products.

Use only assets that are appropriate for the intended use and comply with their licenses and attribution requirements.

Prefer original, project-consistent SVG illustrations or custom-designed assets when external assets do not fit the brand.

For Vocabee, preserve the existing bee logo and mascot. Do not replace them with unrelated stock illustrations or a different mascot.

External asset websites are sources to select from, not permission to download arbitrary assets without checking licensing, quality, and compatibility.

## 5. NEVER SUBSTITUTE ICONS WITH QUICK HACKS

Strictly avoid:

- Emoji as navigation icons.
- Unicode characters inside styled circles to imitate icons.
- Random SVG paths copied from unknown sources.
- Text glyphs enlarged to resemble professional icons.
- CSS shapes used to imitate standard interface icons when an icon library already provides the correct asset.
- Inconsistent icons from different visual styles.
- Broken icon imports replaced silently with text symbols.
- Placeholder icons left in production.
- Icon components that render nothing when an import fails.

If an icon is unavailable, find an appropriate icon from the approved library. Do not improvise using a Unicode character.

## 6. IMPLEMENTATION REQUIREMENTS

- Inspect existing icon dependencies and shared components before making changes.
- Reuse the project's established icon components and design tokens.
- Create a reusable icon wrapper only if it improves consistency and maintainability.
- Keep icons tree-shakeable and avoid unnecessarily importing entire libraries.
- Use the correct server/client component boundaries.
- Ensure icons render correctly in production builds.
- Add accessible labels to interactive controls.
- Verify that all icon imports resolve successfully.
- Do not introduce runtime dependencies on remote icon fonts when local package-based icons are sufficient.

## 7. EXISTING CODE AUDIT

Whenever modifying an existing page or component:

1. Inspect the relevant code for raw Unicode or emoji used as UI icons.
2. Replace prohibited UI icons with semantically appropriate icons from the approved library.
3. Preserve the component's behavior, layout, accessibility, and brand identity.
4. Check for inconsistent sizing, stroke weight, color, alignment, and spacing.
5. Test the modified component and verify that no broken imports or missing icons remain.

When performing a UI-wide audit, search the relevant source files for emoji, Unicode icon substitutes, placeholder glyphs, and inconsistent icon implementations.

Do not blindly replace every Unicode character in the application: distinguish actual UI icons from legitimate text content.

## 8. FINAL QUALITY STANDARD

The interface must feel deliberately designed, premium, polished, and visually consistent—not like a prototype assembled from emoji and random symbols.

**NON-NEGOTIABLE RULE: No raw Unicode or emoji as UI icons. Use a professional icon library or a properly licensed, high-quality visual asset. Apply this rule to all new code and whenever existing UI components are modified.**


