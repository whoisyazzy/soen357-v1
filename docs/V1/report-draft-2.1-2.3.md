# Draft: Section 2 – Initial Website Implementation (Version 1)

*Draft text for the Phase 3 report. Replace the items in [brackets]. Figure numbers are suggestions.*

## 2.1 AI Website Generation

Version 1 (V1) was generated with Claude (model Claude Opus 5.5, claude.ai) on 26 November 2026 from the
final high-fidelity prototype of Phase 2, Output C. The AI received the complete Output C package: the
interactive prototype (`index.html`) and its README, the three task flows as source files and as
Figures 5.1–5.3, the high-fidelity screen and state boards (screens 01–12, states S1–S15), the low-fidelity
wireframes and task boards, and the Phase 3 instructions. Together these supplied the task flows,
expected interactions, representative (fictional) data and calculation rules required by Task 1.

The prompts asked the AI to build V1 from Output C, keep the same flow, and produce a website rather than a
prototype (Appendix [X], prompts 1–2, verbatim). From these the AI worked to six requirements: implement
T1–T3 with Output C's screens, branches, messages and states; keep Output C's calculation and validation
rules unchanged in a separate, testable file; behave as a website (an address for every screen, working
browser Back/Forward/Refresh, data saved in the browser, the real date, a layout for phones and computers);
keep test sessions reproducible; add no features that testing had not yet justified; and run as static
files without a build step.

The output is a static website of HTML, CSS and plain JavaScript (about 960 lines), organised by task
(`screens-pantry.js` for T1, `screens-meals.js` for T2 and the start of T3, `screens-grocery.js` for T3), with the
rules isolated in `logic.js`. Table 2.1 lists the differences from Output C. None of them changes a task
step; they are the behaviour a website needs and a click-through prototype does not.

**Table 2.1 – Website-level differences between Output C and V1**

| Output C (prototype) | V1 (website) |
|---|---|
| One HTML file, font embedded | Separate HTML, CSS, JavaScript and font files |
| No addresses; Refresh returns to the start | Address per screen (e.g. `#/meals/recipe/pasta`); Back, Forward and Refresh work |
| Data lost on reload | Data saved in the browser (`localStorage`) |
| “Today” fixed at 5 Nov 2026 | Real date; optional test date (`?today=2026-11-05`) for test sessions |
| Reset in Profile | Same, plus `?reset` for moderators |
| Phone frame on computers | Responsive page; tabs under the header and two-column cards from 768 px |
| Browser Back not handled | Browser Back on an edited form opens the same discard dialog |

Before freezing V1 the team [reviewed the generated code and] ran two automated check suites produced in
the same session: 30 calculation and validation checks and 68 browser checks covering every branch of
Figures 5.1–5.3, all fifteen Output C states, the website behaviour above and the desktop layout. All
passed. During generation the AI corrected two issues found by its own checks (a fault in the unit-test
harness and a 16 px alignment offset on wide screens). Manual edits by the team: [none / list]. The full
record of inputs, prompts, outputs and edits is in Appendix [X] and `docs/V1/AI-generation-record.md`.

## 2.2 Implemented Essential Tasks and Interactions

V1 implements the three essential tasks of Output C. Table 2.2 maps each task to its flow, screens,
feedback and recovery states, and rules; `docs/V1/traceability.md` gives the full mapping with the check
that verifies each item.

**Table 2.2 – Essential tasks in V1**

| Task | Flow | Screens (address) | Feedback and recovery | Rules |
|---|---|---|---|---|
| T1 Manage pantry: add Zucchini (2 units, Fridge, reminder in 2 days), then edit its quantity | Fig. 5.1 | Pantry `#/pantry`; Add ingredient `#/pantry/add`; Edit `#/pantry/item/{id}` | Inline validation errors with fields kept (03); duplicate notice with Add to existing / Keep separate / Cancel (04); past-date notice (S3) and Past date label (S4); discard dialog (S2); saved, updated and removed toasts with Undo (05); empty pantry (S1) | Date status and wording (R1–R2); merge (R7); quantity and name limits |
| T2 Select a suitable meal: choose the skillet that uses the Use-soon zucchini and avoids peanuts | Fig. 5.2 | Meals `#/meals`; Search `#/meals/search`; Meal detail `#/meals/recipe/{id}` | Locked allergy chip and “1 recipe hidden” note; servings error (S5); no meals match (S6); no recipes found (S7); Reject with Undo (S8); selection confirmation (S9); “Why this meal” panel | Suggestions and ranking (R5); scaling (R3); Have/Missing (R4); search (R6) |
| T3 Prepare grocery list: add the pasta's missing item and edit its quantity | Fig. 5.3 | Meal detail; Grocery list `#/grocery` | Selection confirmation with Add / Not now (09, S10); added toast with View / Undo (S11); no-duplicate notice (S12); quantity and name errors (S13); Saved indicator; removed toast with Undo and empty state (S14) | Missing items scaled (R3); no duplicates (R8); stepper ±50 g/ml (R9); quantity limits |

Interactions shared by all tasks are carried over from Output C: a four-tab bar (Pantry, Meals, Grocery
list, Profile) in which each tab keeps its place; a Back button on every sub-screen that keeps filters,
search text and scroll position; modal dialogs that trap keyboard focus and close with Escape; focus moved
to the first invalid field; minimum 44 px touch targets; and a Profile display size of 100, 115 or 130 %
(S15). Profile allergies feed the locked allergy filter in T2.

The website shows calculated values, so the mathematical-correctness dimension applies. Table 2.3 lists
the rules that produce them; expected values for each rule are in `docs/V1/calculation-rules.md` and are
used as the reference in usability testing.

**Table 2.3 – Calculation rules carried from Output C**

| Rule | Definition |
|---|---|
| Date status | Days to the item's date: < 0 Past date; 0–3 Use soon; > 3 no badge |
| Serving scaling | Shown quantity = recipe quantity × chosen servings ÷ 2, rounded to 2 decimals |
| Missing count | Recipe ingredients with no pantry item of the same name (quantities not compared) |
| Ranking | More Use-soon items used, then fewer missing, then shorter time; allergens and over-time recipes excluded |
| Add to existing | Quantities added; the earlier date is kept |
| Grocery stepper | ±50 for g and ml, ±1 otherwise; must stay above 0 |

[Figure 2.1: V1 screens at 375 px, from `docs/V1/screenshots/`. Figure 2.2: V1 at 1280 px.]

## 2.3 Runnable V1 and Limitations

V1 is available at [GitHub Pages link] (repository [link], tag `v1.0`). It can also be run locally by
opening `index.html` in any current browser, with no installation or internet connection, or by serving the
folder with `python3 -m http.server`. Launch instructions and sample inputs for each essential task are in
the repository README.

For test sessions, moderators open the website with `?reset&today=2026-11-05`. This restores the sample
data and fixes “today” to 5 November 2026, the Output C reference date, so every participant starts from the
same state and sees the same dates and expected values. The address options are removed after loading,
and the page labels the date as a test date.

**Simulated functionality.** The four recipes are fictional sample data. Suggestions come from the fixed
rule set in Table 2.3, not from a trained model. There is no server or account: data is saved only in the
browser in use.

**Known limitations of V1.** These were identified from the Output C rules before testing and were left
unchanged so that any change in V2–V4 can be traced to a test finding:

1. Pantry matching is by name only; quantities are not compared, so 1 zucchini counts as *Have* for a recipe needing 2.
2. Scaled quantities can be fractional (e.g. “1.5 can” at 3 servings).
3. Grocery items keep their quantity if servings are changed after they were added.
4. Saving the Profile resets the Meals filters to the Profile values.
5. Renaming an item to a name already in the pantry is not caught as a duplicate.
6. Dietary preferences are stored but do not filter recipes.
7. Data does not move between browsers or devices, and clearing browser data restores the sample data.
8. The desktop layout was added in V1 and was not part of the Output C evaluation.

V1 is preserved unchanged (tag `v1.0`, with its verification results and screenshots in `docs/V1/`) as the
version tested in Iteration 1.
