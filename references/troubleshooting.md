# Safari Automation Troubleshooting

Use this reference when the normal capability probe fails, a native dialog blocks scripting, or Safari behavior differs from a headless browser.

## Permission layers

Treat these as separate capabilities:

1. **Automation/TCC** permits the calling terminal or agent host to send Apple Events to Safari.
2. **Allow JavaScript from Apple Events** permits Safari to execute page JavaScript received through AppleScript.
3. **Screen Recording** permits background window screenshots with `screencapture -l`.
4. **Accessibility** permits System Events to raise windows, click coordinates, and send keystrokes.

A lightweight query can behave differently from `do JavaScript`. Verify the capability you actually need:

```bash
osascript <<'APPLESCRIPT'
with timeout of 120 seconds
  tell application "Safari"
    if (count of windows) is 0 then error "Safari has no open window"
    return do JavaScript "String(1 + 1)" in current tab of front window
  end tell
end timeout
APPLESCRIPT
```

Give the first call enough time for the macOS permission prompt. Do not wrap the first prompt in a short watchdog. Stock macOS does not include GNU `timeout`; do not assume it is installed.

Error codes are evidence, not a complete diagnosis. Record the macOS version, Safari version, calling app, sandbox state, and exact command before recommending a permission change. Some agent sandboxes block Apple Events independently of macOS privacy settings.

## Native JavaScript dialogs

A pending `alert()`, `confirm()`, or `prompt()` can block subsequent `do JavaScript` calls on that tab.

1. Take a screenshot and confirm that a native sheet is actually visible.
2. Confirm the user's intended answer.
3. Bring the verified Safari window frontmost.
4. Use Return (`key code 36`) only to accept the authorized action, or Escape (`key code 53`) to cancel.
5. Screenshot again and verify the result.

Do not pre-patch `confirm()` to return `true`, suppress `beforeunload`, or press keys before the sheet appears. Safari UI labels follow the system locale, so do not locate controls by English text.

Navigating away or closing a window can discard page state or unsaved work. Treat either as a destructive last resort and obtain explicit confirmation first.

## Timing and measurement

- Convert large numeric values to strings in page JavaScript before returning them through AppleScript: `String(Date.now())`.
- Current macOS versions support `date +%N`; older versions may need another high-resolution clock. Detect support rather than making a blanket claim.
- Headless Playwright WebKit shares an engine lineage but does not reproduce Safari's browser chrome, native sheets, permission prompts, or their presentation timing. Use real Safari for Safari UI measurements.

## Safe recovery

When scripting remains blocked:

- preserve the current URL and tab inventory;
- identify the exact failing permission or blocking sheet;
- prefer canceling the pending action;
- never close a window containing unrelated tabs without confirmation;
- report what was and was not restored.
