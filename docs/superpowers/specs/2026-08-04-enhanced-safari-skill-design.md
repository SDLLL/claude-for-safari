# Enhanced Claude for Safari Skill Design

Date: 2026-08-04
Status: Approved in conversation

## Objective

Evolve `claude-for-safari` from a single natural-language instruction file into a concise core skill with optional, deterministic helpers. Incorporate the useful real-Safari findings from PRs #2 and #3 without adopting their unsafe defaults, overbroad capability claims, or fragile recovery flows.

The finished skill must remain understandable as a natural-language workflow. Bundled scripts exist only where repeated quoting, target selection, cleanup, or event handling benefits from deterministic implementation.

## Non-goals

- Do not bypass Safari's same-origin policy.
- Do not silently accept `confirm()` or `prompt()` dialogs.
- Do not suppress `beforeunload` protections.
- Do not navigate to `about:blank`, close windows, submit forms, or perform coordinate clicks as an automatic recovery action.
- Do not treat private-window title text as a stable identifier.
- Do not capture request or response bodies by default.
- Do not claim that an in-page shim is native network interception.

## Repository Structure

```text
claude-for-safari/
├── SKILL.md
├── README.md
├── README_CN.md
├── scripts/
│   ├── control_indicator.js
│   ├── control_indicator_remove.js
│   ├── form_discover.js
│   ├── form_fill.js
│   ├── form_fill_runner.jxa
│   ├── net_monitor.js
│   ├── net_read.js
│   ├── net_remove.js
│   └── safari_wid.swift
├── references/
│   ├── troubleshooting.md
│   └── advanced.md
└── tests/
    ├── fixtures/forms.html
    └── test_scripts.js
```

`SKILL.md` remains the entry point and stays below 500 lines. It contains the core workflow, safety invariants, permission probes, common browser operations, and routing instructions for optional helpers. Detailed troubleshooting and experimental limitations move to one-level references so they are loaded only when needed.

## Core Workflow

### Capability preflight

1. Confirm the host is macOS.
2. Confirm Safari is running and has a controllable non-private window.
3. Use a real `do JavaScript "1+1"` probe with a generous first-run timeout.
4. Diagnose permissions separately:
   - macOS Automation/TCC for Apple Events;
   - Safari's `Allow JavaScript from Apple Events` setting;
   - Screen Recording for background screenshots;
   - Accessibility for System Events UI input.
5. Do not interpret one error code as proof of a single missing permission.

### Target resolution

- Resolve the intended Safari window and tab before any action.
- Treat Safari AppleScript window/tab objects, Accessibility windows, and CoreGraphics window IDs as three distinct identity namespaces. Never pass an ID from one API to another as if it were interchangeable.
- Preserve a stable Safari AppleScript tab object for page actions. Use a CoreGraphics window ID only for `screencapture`.
- When a screenshot must be correlated with an AppleScript/Accessibility window, match current screen bounds and descriptive metadata and require exactly one match. Re-check immediately before capture or coordinate conversion; abort on zero or multiple matches.
- Abort if the target is missing, stale, or ambiguous.
- Re-resolve and verify the target after navigation or window reordering.

### Read and act

- Read-only operations may list tabs, extract page text, inspect headings, or take screenshots without injecting a control indicator.
- Page-changing operations inject the optional, best-effort generic indicator, perform the action, verify the result, and remove the indicator when finished.
- Navigation waits for both the expected URL and `document.readyState`, avoiding the initial `about:blank` race.
- System Events input activates Safari, verifies the frontmost process, types, and verifies the result in one controlled sequence.
- Actions that submit data, confirm destructive operations, or discard page state require explicit user authorization under the host agent's normal approval policy.

## Optional Helpers

### Control indicator

- Display a generic message such as `AI agent is controlling this tab`.
- Be idempotent and use a namespaced DOM ID and page-global variable.
- Never block pointer input.
- Default to enabled for page-changing DOM actions when JavaScript injection is available. Do not inject it for read-only operations or coordinate-only fallback.
- Be best-effort: failure to display is reported but does not prevent a separately authorized action.
- Provide explicit removal and tolerate repeated cleanup.

### Form discovery and filling

- Discover visible supported controls with stable selectors, labels, types, options, and state.
- Pass fill specifications in a `FORM_SPEC_JSON` environment variable to the bundled `form_fill_runner.jxa`; never interpolate raw values into a shell command or AppleScript literal.
- The JXA runner reads and parses `FORM_SPEC_JSON`, rejects non-array input, and re-serializes the validated value with `JSON.stringify`. It then constructs a fixed wrapper that passes only the `JSON.stringify` output to the already-installed page function from `form_fill.js`. This serialization step is the only permitted insertion into page JavaScript source; manual concatenation or shell substitution of raw form values is forbidden.
- Support text-like inputs, textarea, select, checkbox, radio, and contenteditable controls.
- Exclude password, file upload, one-time-code, payment-card, token, and secret-like controls in code. Never return their values.
- Treat readonly, disabled, unsupported, missing, and ambiguous controls as per-field errors.
- Catch errors per field so one unsupported control cannot abort the batch.
- Use framework-compatible setters and events, then return a value/state read-back for every attempted field.
- Filling does not submit the form.

### Network observation

- Describe the feature as an in-page fetch/XHR observer, not native network interception.
- Default to metadata only: redacted URL, method, status, content type, start time, and duration.
- Store at most 100 entries. When explicitly enabled, store at most 2,048 decoded text characters per request or response body and stop reading the clone stream after the limit; never materialize an unbounded response solely for logging.
- Redact URL query parameters and structured body keys matching, case-insensitively: `token`, `access_token`, `refresh_token`, `auth`, `authorization`, `code`, `key`, `api_key`, `password`, `passwd`, `secret`, `session`, `sid`, `cookie`, or `jwt`. Replace values with `[REDACTED]`. Also redact Bearer credentials and compact JWT-shaped strings in unstructured text.
- Capture body snippets only after the user explicitly requests body capture for the current tab and origin.
- When body capture is authorized, cap stored text, redact common secret keys, avoid binary content, and avoid reading an unbounded response into memory.
- Track each fetch/XHR request exactly once, including XHR object reuse.
- Provide an uninstall helper that restores original `fetch`, `XMLHttpRequest.open`, and `XMLHttpRequest.send`, clears stored data, and is safe to call repeatedly.
- Report limitations: no service-worker interception, no top-level document request, incomplete pre-injection history, and no guaranteed request/response headers.

### Window helper

- Keep the CoreGraphics helper as a bundled Swift source file.
- Support returning the frontmost Safari CoreGraphics window ID and listing all visible Safari CoreGraphics window IDs with current bounds and titles when available.
- Document that these IDs are valid only for CoreGraphics and `screencapture`; they are not Safari AppleScript window IDs.
- Treat titles as descriptive metadata, not authoritative identity. Use bounds plus metadata only to form a unique, freshly verified correlation; otherwise abort.
- Detect and report when `swiftc` or the required developer tools are unavailable.

## References

### `references/troubleshooting.md`

Include the validated findings adapted from PR #3:

- a real JavaScript probe verifies combined capability more reliably than a lightweight property query;
- first-run TCC prompts must not be killed by a short watchdog;
- a pending native JavaScript dialog can block `do JavaScript` calls;
- keyboard dismissal requires Safari to be frontmost and must follow screenshot confirmation;
- Safari UI strings vary with the system locale;
- coerce large JavaScript numbers to strings before returning them through AppleScript;
- headless WebKit does not reproduce Safari's browser chrome or native sheet timing;
- label sandbox and permission behavior with tested environment boundaries rather than universal claims.

Destructive dialog recovery such as navigating away or closing a window is documented only as a user-confirmed last resort.

### `references/advanced.md`

Document, but do not automate by default:

- reading same-origin frames in place;
- attempting to open a cross-origin frame URL in a separate tab, clearly stating that this does not bypass same-origin policy and can lose parent-page context;
- coordinate interaction prerequisites and failure modes across localization, Retina scaling, multiple displays, and window reordering;
- private-window behavior as version-dependent and probe-driven.

## Error Handling and Safety Invariants

- Stop rather than guess when a target window, tab, element, or permission cannot be verified.
- Report the specific observed failure and the next safe diagnostic step.
- Keep optional scripts idempotent and provide cleanup for persistent page modifications.
- Surface cleanup failures; do not claim the browser was restored when it was not.
- Preserve site confirmation dialogs and unsaved-work protections unless the user authorizes a specific action.
- Never use hidden confirmation overrides to bypass destructive-action review.
- Never include sensitive field values or captured secrets in shell commands, transcripts, or returned JSON.

## Validation

Run the following before delivery:

1. `git diff --check` for whitespace and patch integrity.
2. JavaScript syntax checks for every bundled script.
3. Compile the Swift helper with writable module caches and exercise its supported arguments.
4. Run local fixture tests covering:
   - text, textarea, select, checkbox, radio, and contenteditable;
   - duplicate selectors and CSS-special-character names/values;
   - readonly, disabled, hidden, password, secret-like, and file inputs;
   - per-field error isolation and result read-back;
   - network install, metadata-only default, redaction, XHR reuse, read, clear, and uninstall;
   - control-indicator install, idempotency, and cleanup.
5. Verify shell/JXA data transport with spaces, apostrophes, quotes, Unicode, and shell metacharacters.
6. Run the skill validator against the skill folder.
7. Check all relative links and section references.
8. Keep the English and Chinese README capability and limitation tables aligned.
9. Perform a final maintainer review against `origin/main` before pushing.

Live Safari behaviors that cannot be exercised in the current runner must be stated as unverified in the delivery summary rather than inferred from syntax tests.

## Attribution and Open-source Etiquette

- Credit @rrecio and link PR #2 for the form, control-indicator, window-helper, network-observer, and real-Safari testing contributions.
- Credit @jordan-brough and link PR #3 for the permission, dialog, locale, timestamp, and Safari UI measurement findings.
- Add an acknowledgements section to both READMEs with contributor handles and PR links.
- For implementation directly adapted from their commits, include the original author identity in `Co-authored-by` trailers. For ideas that are only conceptually reused, use `Based on` or `Inspired by` language rather than inventing authorship.
- Mention both PRs and the adopted scope in the integration commit body.
- After the main branch is pushed, reply to each original PR with thanks, identify what was adopted, link the resulting commit, and close it as superseded by the maintainer integration.

## Delivery

The user has authorized direct delivery to `main` after local implementation and self-review. The sequence is:

1. Commit this approved design locally.
2. Produce and review an implementation plan.
3. Implement on local `main` without pushing intermediate work.
4. Run the validation suite and a final diff review.
5. Commit the integration with attribution trailers.
6. Push `main` only if all required checks pass and no blocking review finding remains.
7. Verify the remote commit and then update and close PRs #2 and #3 as superseded.

If a required check cannot run or a blocking issue remains, stop before pushing and report the exact blocker.
