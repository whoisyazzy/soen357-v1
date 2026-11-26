# AI-use record: initial build (Version 1)

For the Phase 3 AI-use appendix. Keeps what the AI was given, what it produced, and what the team
changed by hand separate. No participant data was shared with the AI: V1 was generated before any
testing, and all data in it is fictional sample data from Output C.

## Tool

| Item | Value |
|---|---|
| Tool | Claude (claude.ai, agent session with file and browser tools) |
| Model | Claude Opus 5.5 (`claude-opus-5-5`) |
| Date | 26 Nov 2026 |
| Session operator | *Yazid Dawiss* |

## Inputs given to the AI (Output C, Phase 2)

All inputs are kept in `docs/V1/inputs/output-c/`.

| Input | File | What it supplied |
|---|---|---|
| Interactive hi-fi prototype | `OutputC_prototype_index.html` | Screens, interactions, messages, sample data, rules |
| Prototype README | `OutputC_README.md` | Essential tasks, sample inputs, simulated behaviour, limitations |
| Task flows (source) | `T1_manage_pantry.dot`, `T2_select_meal.dot`, `T3_grocery_list.dot` | Expected interactions and branches |
| Task flows (figures) | `Fig5.1_T1_manage_pantry.png`, `Fig5.2_T2_select_meal.png`, `Fig5.3_T3_grocery_list.png` | Same, as Figures 5.1–5.3 |
| Hi-fi screens | `HiFi_Overview_OutputC.png` | Screens 01–12 |
| Hi-fi states | `HiFi_States_OutputC.png` | Errors, notices, confirmations, empty states S1–S15 |
| Lo-fi wireframes and task boards | `LoFi_Overview_OutputC.png`, `LoFi_T1.png`, `LoFi_T2.png`, `LoFi_T3.png` | Structure and navigation |
| Phase 3 instructions | `Soen_357_Project_Phase3_Fall_2026.pdf` (course file, not copied) | Requirements for the website and its documentation |

## Prompts (verbatim)

**Prompt 1** (with all inputs above attached):

> Im doing this part
> 2 - Initial Website Implementation - Version 1
> Before starting, lets start a plan and a course of action.

*AI output used:* a plan only (no code). It proposed building V1 from the Output C prototype, keeping every
flow, message and rule, and adding website-level behaviour (addresses per screen, separate files,
desktop layout, a reset for test sessions); keeping V1 faithful so that changes in V2–V4 come from test
findings; and listing calculation rules and known limitations.

**Prompt 2:**

> I will create a new repo for the inital version. Dont forget its not a prototype it is a website.I need to follow the guidelines. V1 should build V1 from Output C and keep the same flow.

## How the AI interpreted the prompts

The requirements the AI built against, derived from the prompts, the inputs and the Phase 3 instructions:

1. Implement T1 Manage pantry, T2 Select a suitable meal and T3 Prepare grocery list with the same screens,
   steps, branches, messages and states as Output C (Figures 5.1–5.3, screens 01–12, states S1–S15).
2. Keep Output C's calculation and validation rules exactly (`calculation-rules.md`), in a separate,
   testable file.
3. Make it a website, not a prototype: separate files, an address per screen, working browser
   Back/Forward/Refresh, data saved in the browser, the real date, a layout that works on phones and computers.
4. Keep testing reproducible: a reset and a fixed test date that can be set from the address.
5. Do not add features or fix design issues that testing has not shown; record known limitations instead.
6. Run as static files (GitHub Pages or double-click), with no build step or server.

## Outputs used

All files in the repository except `docs/V1/inputs/` were produced by the AI in this session:

| Output | Files |
|---|---|
| Website | `index.html`, `css/styles.css`, `fonts/` (extracted from the prototype), `js/data.js`, `js/logic.js`, `js/store.js`, `js/ui.js`, `js/router.js`, `js/screens-pantry.js`, `js/screens-meals.js`, `js/screens-grocery.js`, `js/screens-profile.js`, `js/app.js` |
| Tests | `tests/logic.test.js` (30 calculation/validation checks), `tests/e2e-verify.js` (68 browser checks) |
| Documentation | `README.md`, `docs/V1/*.md`, `docs/V1/verification-results.json`, `docs/V1/screenshots/` |


## Verification before freezing V1

- `node --test tests/logic.test.js`: 30 of 30 pass.
- `node tests/e2e-verify.js`: 68 of 68 pass (T1, T2, T3, S1–S15, website behaviour, desktop layout, no JavaScript errors).
- Screenshots compared by eye with the Output C hi-fi boards.

Results: `verification-results.md`.
