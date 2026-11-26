# Output C → V1 traceability

V1 implements the three essential tasks of Output C with the same screens, flows, messages and
rules. This file maps each Output C element to where it lives in V1 and how it was checked.
Check IDs refer to `verification-results.md` (browser) and `calculation-rules.md` (C*, V*).

## Screens (Output C hi-fi overview, screens 01–12)

| Output C screen | V1 address | V1 code | Checked by |
|---|---|---|---|
| 01 Pantry (launch) | `#/pantry` (start page) | `SCREENS.pantry` | T1-01, T1-02 |
| 02 Add ingredient | `#/pantry/add` | `SCREENS.form` (add) | T1-03, T1-06 |
| 03 Validation errors | `#/pantry/add` | `validateIngredient`, `submitIng` | T1-04, T1-05 |
| 04 Duplicate notice | dialog on `#/pantry/add` | `runChecks` (dup) | T1-10, T1-11 |
| 05 Saved + Undo | `#/pantry` | `commit` | T1-07 to T1-09 |
| 06 Edit ingredient | `#/pantry/item/{id}` | `SCREENS.form` (edit) | T1-22 to T1-25 |
| 07 Meals | `#/meals` | `SCREENS.meals` | T2-01, T2-02 |
| 08 Meal detail | `#/meals/recipe/{id}` | `SCREENS.detail` | T2-10 |
| 09 Selection confirmation | dialog on meal detail | `SCREENS.detail` (select) | T3-01, T2-14 |
| 10 Grocery list | `#/grocery` | `SCREENS.grocery` | T3-05 |
| 11 Profile | `#/profile` | `SCREENS.profile` | P-01 |
| 12 Edit profile | `#/profile/edit` | `SCREENS.editProfile` | P-02, P-03 |
| (Search recipes, in Figure 5.2) | `#/meals/search` | `SCREENS.search` | T2-08, T2-09 |

## Feedback and recovery states (Output C states board, S1–S15)

| State | Message in V1 (same as Output C) | Checked by |
|---|---|---|
| S1 Empty pantry | “Your pantry is empty.” + Add ingredient | T1-26 |
| S2 Discard dialog | “Discard your changes?” Keep editing / Discard changes | T1-18 to T1-20, W-04, W-05 |
| S3 Past-date notice | “This date has passed. Check it, or save the item with a Past date label.” | T1-15, T1-16 |
| S4 Past date label | Section *Past date*, badge “Past date · Best before 2 Nov” | T1-17 |
| S5 Filter error | “Enter servings from 1 to 12” (previous value kept) | T2-03 |
| S6 No meals match | “No meals match. Change Servings or Max time, or search recipes.” | T2-06 |
| S7 No recipes found | “No recipes found. Try a different ingredient.” | T2-08 |
| S8 Reject + Undo | Toast “Suggestion hidden” + Undo | T2-12, T2-13 |
| S9 All ingredients available | “… selected. All ingredients are available.” OK | T2-14, T2-15 |
| S10 Not now: Selected | Selected badge + “Add 1 missing item to grocery list” | T3-02 |
| S11 Added + View / Undo | Toast “1 item added to grocery list” View grocery list / Undo | T3-03 |
| S12 No-duplicate notice | “Pasta is already on your grocery list. Nothing was added twice.” | T3-04 |
| S13 Grocery errors | “Enter an item name”; “Enter a quantity greater than 0 (decimals are accepted)” | T3-07 |
| S14 Empty list + Undo | “Your grocery list is empty. Select a meal …” + toast “Pasta removed” Undo | T3-10, T3-11 |
| S15 Display size 130 % | Whole interface scales to 130 % | P-02 |

## Flow branches (Figures 5.1–5.3)

| Figure | Branch | V1 check |
|---|---|---|
| 5.1 T1 | Add → Save → all fields valid? No → error (fields kept) → correct field | T1-04, T1-05 |
| 5.1 T1 | Name already in Pantry? Yes → duplicate notice → Add to existing / Keep as separate / Cancel | T1-10 to T1-13 |
| 5.1 T1 | Date already passed? Yes → past-date notice → Save anyway / Change date | T1-15 to T1-17 |
| 5.1 T1 | Success → toast + Undo → item removed | T1-07 to T1-09 |
| 5.1 T1 | Cancel/Back → unsaved changes? No → Pantry unchanged; Yes → discard dialog → Keep editing / Discard | T1-18 to T1-21 |
| 5.1 T1 | Tap Zucchini → edit → quantity valid? No → error; Yes → success + Undo (old quantity restored) | T1-22 to T1-25 |
| 5.2 T2 | Start: allergy chip locked, “1 recipe hidden: contains peanuts” | T2-01, T2-07 |
| 5.2 T2 | Edit filter chip → Servings 1 to 12? No → error; Yes → any meals match? | T2-03, T2-04, T2-06 |
| 5.2 T2 | Suggestion cards ranked (Use soon first) → tap card → detail | T2-02, T2-10 |
| 5.2 T2 | Search (allergy filter still applied) → results found? No → empty state | T2-08, T2-09 |
| 5.2 T2 | Detail → Back (filters and scroll kept) | T2-11 |
| 5.2 T2 | Detail → Reject → suggestion hidden + Undo | T2-12, T2-13 |
| 5.2 T2 | Select this meal → missing? No → confirmation OK → Selected | T2-14, T2-15 |
| 5.3 T3 | Select this meal → confirmation → Not now → Selected, list unchanged → Add missing items button | T3-01, T3-02 |
| 5.3 T3 | Add 1 missing item → already on list? No → toast View / Undo; Yes → no-duplicate notice | T3-03, T3-04 |
| 5.3 T3 | Grocery list → edit quantity → > 0? No → error (previous kept); Yes → Saved | T3-06 to T3-08 |
| 5.3 T3 | Add item → name entered? No → error; Yes → “Added by you” | T3-07, T3-09 |
| 5.3 T3 | Remove → toast + Undo → last item removed → empty state | T3-10, T3-11 |

## Differences from Output C

The flows, screens, messages and rules above are unchanged. The differences below are what turns the
click-through prototype into a website. None of them changes a task step.

| # | Output C (prototype) | V1 (website) | Why |
|---|---|---|---|
| D1 | One HTML file with the font embedded | Separate HTML, CSS and JavaScript files; font files in `fonts/` | Maintainable code the team builds V2–V4 on |
| D2 | No addresses; Refresh returns to the start | Every screen has an address (e.g. `#/meals/recipe/pasta`); browser Back, Forward and Refresh work; unknown or removed items show a message | Expected behaviour of a website |
| D3 | Data in memory; lost on reload | Data saved in the browser (`localStorage`); kept after reload | Expected behaviour of a website |
| D4 | “Today” fixed at 5 Nov 2026 (“Today (simulated)”) | Real date (“Today: …”); sample best-before date set 40 days after today; optional test date with `?today=2026-11-05` (“Today (test date)”) | A real website uses the real date; the test date keeps test sessions comparable with Output C |
| D5 | Profile → Reset sample data | Same, plus `?reset` in the address for moderators | Clean start for each participant |
| D6 | Phone frame (375 px) on computers | Full-width page; from 768 px the tabs sit under the header, suggestion cards and detail panels use 2 columns; phone layout unchanged | Usable on laptops as well as phones |
| D7 | Browser Back not handled | Browser Back on a form with unsaved changes opens the same discard dialog; closing the tab warns | Same recovery as the in-app Back (Figure 5.1) |
| D8 | “Sample prototype for learning…” banner; Profile “About this prototype” | “Sample website for learning…”; “About this website” with version and storage note; “hidden by you this session” → “hidden by you”; reset dialog “All your changes will be lost…” | Wording matches saved data and a website |
| D9 | Dialog inside the phone frame | Dialog over the whole page; page behind is hidden from screen readers | Accessibility |
