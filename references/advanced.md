# Advanced and Experimental Safari Workflows

Read this reference only when the normal DOM/AppleScript workflow cannot complete the user's task.

## Frames

Same-origin frames can be read through `frame.contentDocument`. Cross-origin frames remain protected by the browser's same-origin policy.

Opening a cross-origin frame's `src` in a separate tab does not bypass that policy. It is a new top-level navigation and may lose parent-page state, `postMessage` coordination, sandbox restrictions, or embedded authentication context. Use it only when the user wants to open that URL separately, validate the scheme (`https:` or `http:`), and close only the exact temporary tab you created.

Screenshots can show frame pixels even when JavaScript cannot read frame content. Do not infer inaccessible text or controls from DOM queries.

## Coordinate interaction

Coordinate clicks require both Screen Recording and Accessibility permissions and are less reliable than DOM actions.

Keep three identity systems separate:

- Safari AppleScript window/tab objects for browser actions;
- Accessibility windows for raising and clicking;
- CoreGraphics window IDs for `screencapture -l`.

Correlate them only with freshly read bounds plus descriptive metadata, require one unique match, and abort on ambiguity. Re-read bounds immediately before converting screenshot pixels to screen points. Account for Retina scale, multiple displays, window movement, toolbar height, and localization. Screenshot after every action.

Never target a private window by matching the English phrase `Private Browsing`.

## Private windows

Private-window AppleScript behavior varies by Safari and macOS version. Probe the exact window and requested capability. If page JavaScript is unavailable, do not assume coordinate fallback is safe: verify permissions, target correlation, and the absence of ambiguous windows first.

Do not expose private-window URLs, screenshots, or page content beyond what the user requested.

## Network observation limits

The bundled observer wraps page-level `fetch` and `XMLHttpRequest`. It is not Safari Web Inspector and cannot guarantee visibility into:

- service-worker traffic;
- the top-level document request;
- requests completed before installation;
- request and response headers;
- browser-internal, extension, or native networking.

Enable body snippets only for the current origin after explicit user authorization. Remove the observer after the task and report cleanup failures.
