<h1 align="center">Claude for Safari</h1>

<p align="center">
  <strong>Give your AI Agent the power to control Safari</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
  <a href="https://www.apple.com/macos/"><img src="https://img.shields.io/badge/macOS-only-black.svg?style=for-the-badge&logo=apple" alt="macOS"></a>
  <a href="https://github.com/SDLLL/claude-for-safari/stargazers"><img src="https://img.shields.io/github/stars/SDLLL/claude-for-safari?style=for-the-badge" alt="GitHub Stars"></a>
</p>

<p align="center">
  <a href="https://safari.skilljam.dev">Website</a> · <a href="#quick-start">Quick Start</a> · <a href="#features">Features</a> · <a href="#faq">FAQ</a>
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README_CN.md">中文</a>
</p>

---

## Why This?

You want your AI Agent to help with browser tasks — then you discover:

- 🔒 **Playwright** → Separate browser instance, hijacks your session
- 🧩 **Claude for Chrome** → Requires Chrome extension, doesn't work with Safari
- 📝 **Copy & paste** → Manually feeding page content to AI every time

**You just want AI to use your Safari, as if you were doing it yourself.**

**Claude for Safari makes it one command:**

```
npx skills add SDLLL/claude-for-safari
```

After installing, tell Claude "check what's open in my Safari" — it reads and controls your real browser directly.

> **If this saves you time, [give it a ⭐](https://github.com/SDLLL/claude-for-safari/stargazers)** — it helps other developers discover the project!

---

## Quick Start

Run this in your terminal:

```bash
npx skills add SDLLL/claude-for-safari
```

Then launch [Claude Code](https://claude.ai/download):

```bash
claude
```

Say "show me what tabs are open in Safari". The agent will guide you through permission setup automatically.

> Compatible with any AI Agent that supports Skills: Claude Code, Cursor, Windsurf, etc.

### First-Time Setup

The agent auto-detects and guides you, but you can configure ahead of time:

1. **System Settings > Privacy & Security > Automation** → Allow terminal to control Safari
2. **Safari > Settings > Advanced** → Enable "Show features for web developers"
3. **Safari > Develop menu** → Check "Allow JavaScript from Apple Events"
4. **(Optional) System Settings > Privacy & Security > Screen Recording** → Allow the terminal or agent host (enables reliable background screenshots)
5. **(Optional) System Settings > Privacy & Security > Accessibility** → Required only for System Events clicks and keystrokes

---

## Features

No browser extension, proxy, or persistent daemon. The core uses macOS-native capabilities; optional window helpers require an available Swift toolchain.

| Capability | What the Agent Does | How |
|---|---|---|
| **List tabs** | List all windows and tabs with title & URL | AppleScript |
| **Read pages** | Extract text, structured data, simplified DOM | AppleScript + JavaScript |
| **Execute JS** | Run arbitrary JavaScript in page context | AppleScript `do JavaScript` |
| **Screenshot** | Capture Safari window — AI can "see" the page | `screencapture` |
| **Navigate** | Open URLs, new tabs, new windows | AppleScript |
| **Click** | Click elements (React/Vue/Angular compatible) | JavaScript `dispatchEvent` |
| **Type** | Fill forms, simulate keyboard input | JavaScript + System Events |
| **Safe form filling** | Discover fields and fill supported non-sensitive controls with per-field verification | Bundled JavaScript + JXA |
| **Network observation** | Observe redacted page-level fetch/XHR metadata; bodies are explicit opt-in | Bundled JavaScript |
| **Control indicator** | Show when an agent is changing a page and clean up afterward | Bundled JavaScript |
| **Scroll** | Scroll up/down, scroll to element | JavaScript `scrollBy/scrollTo` |
| **Switch tabs** | Switch by index or URL keyword | AppleScript |
| **Wait for load** | Wait until page is fully loaded | JavaScript `readyState` |

### Screenshot Modes

| Mode | Permission Required | Window Switch | Best For |
|---|---|---|---|
| **Background** | Screen Recording | No switch | Recommended, seamless |
| **User-visible** | Varies by macOS policy | Yes | Fallback when background capture is unavailable |

---

## How It Works

```
Claude Code ──osascript──► Safari (reads/controls your real browser)
     │
     └──screencapture──► screenshot ──► Claude sees the page
```

No extensions, proxy servers, or persistent background services.

The skill uses AppleScript, page JavaScript, `screencapture`, and optional bundled helpers. Page-injected helpers can be detected by websites and are removed after use.

---

## FAQ

<details>
<summary><strong>Do I need to install anything?</strong></summary>

The core requires no browser extension or separate automation browser. It uses macOS AppleScript and `screencapture`; compiling the optional multi-window helper requires `swiftc`/Apple Command Line Tools.
</details>

<details>
<summary><strong>Does it support Chrome / Firefox / Arc?</strong></summary>

Safari only. For other browsers, use <a href="https://github.com/nicepkg/playwright-mcp">Playwright MCP</a> or <a href="https://github.com/Areo-Joe/chrome-acp">Chrome ACP</a>. Safari is the only macOS browser with full AppleScript automation support.
</details>

<details>
<summary><strong>Is it safe? Will AI do random things?</strong></summary>

The skill requires target verification, preserves site confirmation dialogs, excludes sensitive form fields, and asks for authorization before consequential actions. Your agent host's own permission policy still applies.
</details>

<details>
<summary><strong>The window flickers when taking screenshots?</strong></summary>

Grant Screen Recording permission to the terminal or agent host for reliable background window capture. Without it, use a user-visible Screenshot workflow and verify the resulting image rather than assuming capture succeeded.
</details>

<details>
<summary><strong>Which AI Agents are compatible?</strong></summary>

Any agent supporting Claude Code Skills: Claude Code, Cursor, Windsurf, etc.
</details>

---

## Acknowledgements

- [@rrecio](https://github.com/rrecio) contributed the form, control-indicator, window-helper, network-observer, and real-Safari testing ideas in [PR #2](https://github.com/SDLLL/claude-for-safari/pull/2).
- [@jordan-brough](https://github.com/jordan-brough) contributed permission, dialog, locale, timestamp, and Safari UI measurement findings in [PR #3](https://github.com/SDLLL/claude-for-safari/pull/3).

Their work informed the maintainer-integrated, safety-hardened implementation.

---

## License

[MIT](LICENSE)
