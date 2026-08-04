# Enhanced Safari Skill Implementation Plan

> **Execution mode:** Inline maintainer implementation in this session, per the user's request for a lightweight delivery flow.

**Goal:** Integrate the safe, useful ideas from PRs #2 and #3 into an enhanced but concise Safari skill, validate it, credit the contributors, and push the reviewed result to `main`.

**Architecture:** Keep `SKILL.md` as the core workflow and route detailed troubleshooting to one-level references. Add focused helpers for forms, network observation, control indication, and CoreGraphics window lookup; each helper is idempotent, bounded, and testable.

**Tech Stack:** Markdown, JavaScript, JXA, Swift/CoreGraphics, Node.js tests, GitHub CLI.

---

### Task 1: Add deterministic helpers and tests

**Files:**
- Create: `scripts/control_indicator.js`
- Create: `scripts/control_indicator_remove.js`
- Create: `scripts/form_discover.js`
- Create: `scripts/form_fill.js`
- Create: `scripts/form_fill_runner.jxa`
- Create: `scripts/net_monitor.js`
- Create: `scripts/net_read.js`
- Create: `scripts/net_remove.js`
- Create: `scripts/safari_wid.swift`
- Create: `tests/fixtures/forms.html`
- Create: `tests/test_scripts.js`

- [ ] Implement namespaced, idempotent helpers with explicit cleanup.
- [ ] Implement safe JSON transport and sensitive-field exclusions for forms.
- [ ] Implement metadata-only network defaults, redaction, bounded optional bodies, XHR reuse safety, and uninstall.
- [ ] Add local fixture tests for supported, unsupported, sensitive, repeated, and cleanup paths.
- [ ] Run `node --test tests/test_scripts.js` and require all tests to pass.

### Task 2: Refactor the skill and progressive references

**Files:**
- Modify: `SKILL.md`
- Create: `references/troubleshooting.md`
- Create: `references/advanced.md`

- [ ] Add real JavaScript capability probing and separate permission diagnostics.
- [ ] Add URL-aware navigation waits, target verification, atomic input, and optional-helper routing.
- [ ] Keep destructive dialog recovery and experimental iframe/private/coordinate behavior out of the default workflow.
- [ ] Keep `SKILL.md` below 500 lines and all reference links valid.

### Task 3: Update user-facing documentation and attribution

**Files:**
- Modify: `README.md`
- Modify: `README_CN.md`

- [ ] Align feature, permission, privacy, and limitation descriptions with the implemented behavior.
- [ ] Add acknowledgements linking @rrecio / PR #2 and @jordan-brough / PR #3.
- [ ] Remove or qualify claims contradicted by page injection or optional helpers.

### Task 4: Validate, review, commit, and deliver

- [ ] Run `git diff --check`.
- [ ] Run `node --check` on every JavaScript file.
- [ ] Run `node --test tests/test_scripts.js`.
- [ ] Compile `scripts/safari_wid.swift` using writable module caches and exercise `--all`.
- [ ] Run the skill validator and verify Markdown links/headings.
- [ ] Review the complete diff against `origin/main`; fix every blocking finding.
- [ ] Commit with PR references and contributor trailers derived from the original commits.
- [ ] Push `main`, verify the remote SHA, reply to PRs #2 and #3 with adopted scope and commit link, then close them as superseded.
