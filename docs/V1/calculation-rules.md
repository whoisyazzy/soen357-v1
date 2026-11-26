# V1 calculation and validation rules

These rules come from the Output C prototype (Phase 2) and are carried into V1 unchanged.
They are implemented as pure functions in `js/logic.js` and checked by `tests/logic.test.js`
(run `node --test tests/logic.test.js`). This is the reference for the **correctness** dimension
of usability testing: compare what the website shows with the expected values below.

## Rules

| # | Rule | Where it shows | Code |
|---|---|---|---|
| R1 | **Date status.** Days = item date − today, in whole calendar days. Less than 0 → *Past date*; 0 to 3 → *Use soon*; more than 3 → no badge (date shown in the row). Date type *None* → no status. | Pantry sections and badges, “Reads as” line, meal cards, *Why this meal* | `dateStatus`, `daysFrom` |
| R2 | **Relative wording.** 0 = today, 1 = tomorrow, n > 1 = in n days, −1 = yesterday, −n = n days ago. | Badges, “Reads as” line | `rel` |
| R3 | **Serving scaling.** Shown quantity = recipe quantity × (chosen servings ÷ servings the recipe is written for). All sample recipes are written for 2. Shown rounded to 2 decimals. | Meal detail ingredients, quantity added to the grocery list | `scaleFactor`, `analyse`, `fmtQ` |
| R4 | **Have / Missing.** An ingredient is *Have* when an item with the same name is in the pantry. Names match ignoring case, extra spaces and a final “s”/“es”. **Quantities are not compared.** Missing count = number of *Missing* ingredients. | Meal cards (“N missing”), meal detail, “Add N missing items” | `findByName`, `norm`, `analyse` |
| R5 | **Suggestions.** Shown: recipes with no allergen from the Profile, not rejected, and time ≤ Max time (or Max time = Any). Order: 1) more *Use soon* pantry items used, 2) fewer missing, 3) shorter time. | Meals tab | `rankSuggestions`, `blockedBy` |
| R6 | **Search.** Matches recipe name or ingredient name (contains, any case). Ignores Max time; still hides recipes with a Profile allergen. | Search recipes | `SCREENS.search` |
| R7 | **Add to existing.** New quantity = existing + added, rounded to 2 decimals. If the added item has an earlier date (or the existing one has none), that date and date type are kept. Only offered when the units are the same. | Duplicate notice → *Add to existing* | `mergeItems` |
| R8 | **Grocery duplicates.** A missing item is not added when an item with the same name (R4 matching) is already on the list. | Add missing items, Add an item | `addMissing` |
| R9 | **Steppers.** Ingredient form: ±1, never below 0. Grocery list: ±50 for g and ml, ±1 for other units; going to 0 or below is refused with an error. Meals Servings: ±1. | Forms, grocery list | `stepIngredient`, `groceryStep` |

## Validation limits

| Field | Rule | Message |
|---|---|---|
| Ingredient name | Required, at most 40 characters | “Enter an ingredient name” / “Use 40 characters or fewer” |
| Quantity (ingredient, grocery) | Number > 0 and ≤ 1000; decimals accepted, “1,5” = 1.5 | “Enter a quantity greater than 0 (decimals are accepted)” / “Enter a quantity of 1000 or less” |
| Unit, storage location | Required | “Choose a unit” / “Choose where the item is stored” |
| Date (when Date type is not None) | A real calendar date | “Enter a date, or set Date type to None” |
| Date in the past (new date) | Confirmation, not an error | “This date has passed. Check it, or save the item with a Past date label.” |
| Date more than 5 years away | Confirmation | “Check the date: it is more than 5 years away.” |
| Servings (Meals filter, Profile) | Whole number 1 to 12 | “Enter servings from 1 to 12” |
| Grocery item name | Required, at most 40 characters | “Enter an item name” / “Use 40 characters or fewer” |

## Expected values (reference date 5 Nov 2026)

Pantry for C13–C19: sample data (Rice 500 g, Canned tomatoes 1 can best before 15 Dec, Olive oil 100 ml) plus Zucchini 2 units, reminder 7 Nov.
All 30 automated checks pass in V1; the same IDs are used in `verification-results.md` where a check is also done in the browser.

| ID | Input | Expected | V1 |
|---|---|---|---|
| C1 | Reminder 7 Nov | Use soon, in 2 days | Pass |
| C2 | Date 5 Nov (today) | Use soon, today | Pass |
| C3 | Date 8 Nov | Use soon (boundary, 3 days) | Pass |
| C4 | Date 9 Nov | No badge (4 days) | Pass |
| C5 | Date 4 Nov | Past date, yesterday | Pass |
| C6 | Date type None | No status | Pass |
| C7 | 31 Oct → 2 Nov (DST change 1 Nov) | 2 days | Pass |
| C8 | Relative wording | today / tomorrow / in 2 days / yesterday / 3 days ago | Pass |
| C9 | Skillet, 2 servings | Zucchini 2 units, Rice 150 g, Canned tomatoes 1 can, Olive oil 15 ml | Pass |
| C10 | Skillet, 3 servings | 3 units, 225 g, 1.5 can, 22.5 ml | Pass |
| C11 | Pasta, 4 servings | Pasta 400 g | Pass |
| C12 | Pasta, 1 serving | Pasta 100 g, Zucchini 0.5 units | Pass |
| C13 | Missing count | Skillet 0, Pasta 1 (Pasta), Soup 2 (Onion, Vegetable stock) | Pass |
| C14 | Missing count without Zucchini | Skillet 1, Pasta 2 | Pass |
| C15 | “  canned   TOMATO ” vs “Canned tomatoes”; “zucchinis” vs “Zucchini” | Match | Pass |
| C16 | Suggestions, 30 min, Peanuts allergy | Skillet, Pasta (Peanut stir-fry hidden by allergy, Soup over 30 min) | Pass |
| C17 | Suggestions, Any time, no allergies | Skillet, Pasta, Peanut stir-fry, Soup | Pass |
| C18 | Suggestions, 15 min | None (empty state) | Pass |
| C19 | Skillet rejected | Pasta only | Pass |
| C20 | Allergens | Peanut stir-fry blocked by Peanuts; Pasta blocked by Wheat | Pass |
| C21 | 2 units (7 Nov) + 1.5 units (6 Nov, Use by) | 3.5 units, 6 Nov, Use by | Pass |
| C22 | 2 units (7 Nov) + 1 unit (20 Nov) | 3 units, 7 Nov kept | Pass |
| C23 | 0.1 + 0.2 | 0.3 | Pass |
| C24 | Grocery step | g, ml: 50; can, units: 1 | Pass |
| C25 | Ingredient stepper | 2 + 1 = 3; 0 − 1 = 0; empty + 1 = 1 | Pass |
| V1 | Quantities 0, empty, “abc”, 1001, 1000, “1,5” | Error, error, error, “1000 or less”, OK, OK (= 1.5) | Pass |
| V2 | Servings 1, 12, 2 / 0, 13, 2.5, empty, x | OK / error | Pass |
| V3 | Empty ingredient form | 5 messages above; valid Zucchini → no errors | Pass |
| V4 | 30 Feb 2026 | Rejected | Pass |
| D1 | Sample data at 5 Nov 2026 | Canned tomatoes best before 15 Dec 2026 | Pass |

Checks done in the browser on top of these (see `verification-results.md`): T1-12 merge 2 + 2 = 4 units,
T2-05 skillet at 3 servings, T3-06 grocery stepper 200 → 250 g.
