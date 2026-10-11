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

