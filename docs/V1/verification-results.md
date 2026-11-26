# V1 verification results

Automated run of `tests/e2e-verify.js` on 2026-11-26 (Chrome, 375 px and 1280 px). Test date: 5 Nov 2026 (`?reset&today=2026-11-05`), the Output C reference date.

**68 of 68 checks passed.** Screenshots: `screenshots/`.

| ID | Task | Check | Expected | Actual | Status |
|---|---|---|---|---|---|
| T1-01 | T1 | Pantry is the launch screen with sample items | Rice, Canned tomatoes, Olive oil; Fridge: No items | Today (test date): Thu 5 Nov 2026 Add ingredient Fridge No items Freezer No items Pantry Rice 500 g Canned tomatoes 1 can · Best before 15 D | Pass |
| T1-02 | T1 | Today line uses the test date | Today (test date): Thu 5 Nov 2026 | Today (test date): Thu 5 Nov 2026  Add ingredient Fridge  No items  Freezer  No items  Pantry Rice 500 g Canned tomatoes 1 can · Best before 15 Dec Olive oil 10… | Pass |
| T1-03 | T1 | Add ingredient opens the form at its own address | #/pantry/add, title Add ingredient | /pantry/add / Add ingredient | Pass |
| T1-04 | T1 | Save with empty fields shows inline errors, fields kept | Enter an ingredient name / quantity > 0 / Choose a unit / Choose where the item is stored | Enter an ingredient name \| Enter a quantity greater than 0 (decimals are accepted) \| Choose a unit \| Choose a unit \| Choose where the item is stored | Pass |
| T1-05 | T1 | Focus moves to the first invalid field | #f-name focused | f-name | Pass |
| T1-06 | T1 | Date read-back | Reads as: Sat 7 Nov 2026 (in 2 days) | Reads as: Sat 7 Nov 2026 (in 2 days) | Pass |
| T1-07 | T1 | Saved: item under Use soon with badge; toast + Undo | Use soon · Reminder 7 Nov (in 2 days); toast 'Zucchini added' Undo | Zucchini added Undo × / Zucchini 2 units · Fridge Use soon · Reminder 7 Nov (in 2 days) Fridge No ite | Pass |
| T1-08 | T1 | Back on Pantry address after save | #/pantry | #/pantry | Pass |
| T1-09 | T1 | Undo removes the new item | Zucchini gone; toast 'Zucchini removed' | Zucchini removed × | Pass |
| T1-10 | T1 | Duplicate name opens the duplicate notice | Already in your pantry: Zucchini is already in your pantry (2 units, Fridge). Add to existing \| Keep as separate item \| Cancel | Already in your pantry × Zucchini is already in your pantry (2 units, Fridge). Add to existing Keep as separate item Cancel | Pass |
| T1-11 | T1 | Cancel on duplicate notice returns to the open form | Form still shows 'zucchini' | zucchini | Pass |
| T1-12 | T1 | Add to existing merges quantities (calculation) | Toast 'Zucchini updated: now 4 units' | Zucchini updated: now 4 units Undo × | Pass |
| T1-13 | T1 | Undo of merge restores 2 units | Zucchini 2 units | Today (test date): Thu 5 Nov 2026  Add ingredient Use soon Zucchini 2 units · Fridge Use soon · Reminder 7 Nov (in 2 days) Fridge  No items  Freezer  No items  … | Pass |
| T1-14 | T1 | Past date read-back | Reads as: Mon 2 Nov 2026 (3 days ago) | Reads as: Mon 2 Nov 2026 (3 days ago) | Pass |
| T1-15 | T1 | Past date notice (S3) | Check the date: This date has passed... Change date \| Save anyway | Check the date × This date has passed. Check it, or save the item with a Past date label. Change date Save anyway | Pass |
| T1-16 | T1 | Change date returns focus to the date field | #f-date focused | f-date | Pass |
| T1-17 | T1 | Past date label (S4) | Past date section: Spinach · Past date · Best before 2 Nov | Past date Spinach 1 pack · Fridge Past date · Best before 2 Nov Fridge No items Freezer | Pass |
| T1-18 | T1 | Back with unsaved changes asks first (S2) | Discard your changes? Your changes to Zucchini will not be saved. Keep editing \| Discard changes | Discard your changes? × Your changes to Zucchini will not be saved. Keep editing Discard changes | Pass |
| T1-19 | T1 | Keep editing returns to the open form with data kept | Name Zucchini, date 2026-11-07 | Zucchini 2026-11-07 | Pass |
| T1-20 | T1 | Discard changes returns to Pantry, unchanged | #/pantry; one Zucchini row | /pantry, Zucchini rows: 1 | Pass |
| T1-21 | T1 | Cancel with no changes leaves without a dialog | #/pantry, no dialog | /pantry | Pass |
| T1-22 | T1 | Tapping Zucchini opens the pre-filled edit form | Title 'Edit Zucchini', qty 2, address #/pantry/item/10 | Edit Zucchini, qty 2, /pantry/item/11 | Pass |
| T1-23 | T1 | Edit with quantity 0 shows error, other fields kept | Enter a quantity greater than 0 (decimals are accepted); name still Zucchini | Enter a quantity greater than 0 (decimals are accepted) | Pass |
| T1-24 | T1 | Edit saved: new quantity and toast | 3 units · Fridge; toast 'Zucchini updated' Undo | Zucchini updated Undo × | Pass |
| T1-25 | T1 | Undo restores old quantity | 2 units · Fridge; toast 'Change undone' | Change undone × | Pass |
| W-01 | Website | Data is kept after a page refresh | Zucchini 3 units and Spinach still in pantry | Today (test date): Thu 5 Nov 2026 Add ingredient Use soon Zucchini 3 units · Fridge Use soon · Reminder 7 Nov (in 2 days | Pass |
| T2-01 | T2 | Meals: filter chips, locked allergy chip, hidden note | Servings: 2 \| Max time: 30 min \| No peanuts (from Profile) \| 1 recipe hidden: contains peanuts | Servings: 2 \| Max time: 30 min \| No peanuts (from Profile) \| 1 recipe hidden: contains peanuts \| Search recipes \| Suggested for you | Pass |
| T2-02 | T2 | Ranking: skillet (uses Use soon zucchini, 0 missing) before pasta (1 missing) | 1. Zucchini and tomato rice skillet (0 missing) 2. Vegetable pasta (1 missing) | Zucchini and tomato rice skillet Uses: Zucchini (Use soon), Rice, Canned tomatoes, Olive oil 0 missing 25 min Easy \|\| Vegetable pasta Uses: Zucchini (Use soon), Canned tomatoes, Olive oil 1 missing 20 min Easy | Pass |
| T2-03 | T2 | Servings 0 is rejected (S5), previous value kept | Enter servings from 1 to 12; chip still Servings: 2 | Enter servings from 1 to 12 | Pass |
| T2-04 | T2 | Servings 3 applied | Chip 'Servings: 3' | Servings: 3 Max time: 30 min No peanuts (from Profile) 1 recipe hidden: contains peanuts Search recipes Suggested for you Zucchini and tomato rice skillet Uses:… | Pass |
| T2-05 | T2 | Quantities scale to 3 servings (calculation) | Zucchini 3 units, Rice 225 g, Canned tomatoes 1.5 can, Olive oil 22.5 ml | Zucchini · 3 units Have Rice · 225 g Have Canned tomatoes · 1.5 can Have Olive oil · 22.5 ml Have | Pass |
| T2-06 | T2 | No meals match with 15 min (S6) | No meals match. Change Servings or Max time, or search recipes. | Servings: 2 Max time: 15 min No peanuts (from Profile) Maximum time 15 min 30 min 45 min 60 min Any 1 recipe hidden: contains peanuts Search recipes  No meals m… | Pass |
| T2-07 | T2 | Allergy chip explains it is set in Profile | Allergies are set in your Profile and always applied, including in search. | Servings: 2 Max time: 30 min No peanuts (from Profile)  Allergies are set in your Profile and always applied, including in search.  Change allergies in Profile … | Pass |
| T2-08 | T2 | Search with no result (S7) | No recipes found. Try a different ingredient. | Search by recipe or ingredient  No recipes found. Try a different ingredient.  Search shows all recipes, including ones over your maximum time. Your allergy fil… | Pass |
| T2-09 | T2 | Search keeps allergy filter | 2 recipes; 1 recipe hidden: contains peanuts | 1 recipe hidden: contains peanuts \| 2 recipes \| Zucchini and tomato rice skillet \| Uses: Zucchini (Use soon), Rice, Canned tomatoes, Olive oil | Pass |
| T2-10 | T2 | Meal detail: Why this meal, all Have | Uses Zucchini (Use soon · Reminder 7 Nov); 4 × Have; Select this meal + Reject | Zucchini and tomato rice skillet \|  \| 25 min · 2 servings · Easy \|  \| Why this meal \| Uses Zucchini (Use soon · Reminder 7 Nov) \| Also uses Rice, Canned tomatoes, Olive oil from your pantry \| Fits your 30 min maximum (25 min) | Pass |
| T2-11 | T2 | Back from detail returns to Search with the query kept | Search recipes, query 'zucchini' | Search recipes / zucchini | Pass |
| T2-12 | T2 | Reject hides the suggestion with Undo (S8) | Toast 'Suggestion hidden' Undo; pasta not listed; '1 suggestion hidden by you' | Suggestion hidden Undo × | Pass |
| T2-13 | T2 | Undo restores the suggestion | Vegetable pasta listed again | Servings: 2 Max time: 30 min No peanuts (from Profile) 1 recipe hidden: contains peanuts Search recipes Suggested for you Zucchini and tomato rice skillet Uses:… | Pass |
| T2-14 | T2 | Select a meal with all ingredients (S9) | Meal selected: Zucchini and tomato rice skillet selected. All ingredients are available. OK | Meal selected × Zucchini and tomato rice skillet selected. All ingredients are available. OK | Pass |
| T2-15 | T2 | Meal marked Selected on detail and card | Selected badge on detail; card shows Selected | Zucchini and tomato rice skillet Uses: Zucchini (Use soon), Rice, Canned tomatoes, Olive oil 0 missing 25 min Easy Selected | Pass |
| W-02 | Website | Each tab remembers its place | Meals tab returns to Vegetable pasta detail | /meals/recipe/pasta | Pass |
| W-03 | Website | Browser Back works | Back to #/pantry | /pantry | Pass |
| T3-01 | T3 | Selection confirmation with missing item (09) | Vegetable pasta selected. 1 ingredient is missing. Add 1 missing item to grocery list \| Not now | Meal selected × Vegetable pasta selected. 1 ingredient is missing. Add 1 missing item to grocery list Not now | Pass |
| T3-02 | T3 | Not now: meal Selected, grocery list unchanged (S10) | Selected badge; button 'Add 1 missing item to grocery list' | Vegetable pasta \|  \| 20 min · 2 servings · Easy \|  | Pass |
| T3-03 | T3 | Missing item added (S11) | Toast '1 item added to grocery list' View grocery list \| Undo | 1 item added to grocery list × View grocery list Undo | Pass |
| T3-04 | T3 | Adding again does not duplicate (S12) | Already on your list: Pasta is already on your grocery list. Nothing was added twice. | Already on your list × Pasta is already on your grocery list. Nothing was added twice. View grocery list OK | Pass |
| T3-05 | T3 | Grocery list groups the item by meal (10) | For Vegetable pasta: Pasta, From: Vegetable pasta, 200 g | Add an item Add For Vegetable pasta Pasta From: Vegetable pasta Remove − + g qty=200 | Pass |
| T3-06 | T3 | Stepper + adds 50 g and shows Saved (calculation) | 250, Saved | 250 | Pass |
| T3-07 | T3 | Grocery errors (S13) | Enter an item name; Enter a quantity greater than 0 (decimals are accepted) | Enter an item name \| Enter a quantity greater than 0 (decimals are accepted) | Pass |
| T3-08 | T3 | Typed quantity is saved (success state) | 300, Saved | 300 | Pass |
| T3-09 | T3 | Manual item added under 'Added by you' | Added by you: Bread; toast 'Bread added' | Bread added Undo × | Pass |
| T3-10 | T3 | Removing the last item shows the empty state with Undo (S14) | Your grocery list is empty...; toast 'Pasta removed' Undo | Pasta removed Undo × | Pass |
| T3-11 | T3 | Undo restores the removed item | Pasta 300 g back | 300 | Pass |
| P-01 | Profile | Profile summary (11) | Allergies Peanuts; Default servings 2; Maximum time 30 min; Display size 100 % | Allergies Peanuts Dietary preferences None Default servings 2 Maximum time 30 min Display size 100 % Edit profile About this website Meal Pl | Pass |
| P-02 | Profile | Display size 130 % applies (S15) | Root font size 20.8px; toast 'Profile saved. Meals now use your new settings.' | 20.8px / Profile saved. Meals now use your new settings. × | Pass |
| W-04 | Website | Browser Back from a form with unsaved changes asks first | Discard your changes? Your changes to your profile will not be saved.; still on #/profile/edit | Discard your changes? × Your changes to your profile will not be saved. Keep editing Discard changes @ /profile/edit | Pass |
| W-05 | Website | Discard leaves the form without saving | #/profile; Allergies Peanuts | /profile / Allergies Peanuts Dietary preferences No | Pass |
| P-03 | Profile | Removing all allergies asks for confirmation | Turn off allergy filter? ... Save \| Keep editing | Turn off allergy filter? × You removed all allergies. Meals will no longer hide recipes that contain allergens. Save Keep editing | Pass |
| W-06 | Website | A screen can be opened directly by its address | Meal detail for Vegetable pasta | Vegetable pasta  20 min · 2 servings · Easy  Selected  Why this meal Uses Zucchini (Use soon · Reminder 7 Nov) Also uses Canned tomatoes, Olive oil from your pa… | Pass |
| W-07 | Website | In-app Back from a direct link goes to the parent screen | #/meals | /meals | Pass |
| W-08 | Website | Unknown address falls back to Pantry | #/pantry | /pantry | Pass |
| W-09 | Website | Missing item address shows a message | This ingredient is no longer in your pantry. | This ingredient is no longer in your pantry.  Go to Pantry | Pass |
| T1-26 | T1 | Empty pantry state (S1) | Your pantry is empty. + Add ingredient | Today (test date): Thu 5 Nov 2026  Your pantry is empty.  Add ingredient | Pass |
| T1-27 | T1 | Remove shows toast with Undo | Toast '<item> removed' Undo | Olive oil removed Undo × | Pass |
| W-10 | Website | ?reset restores the sample data and is removed from the address | 3 sample items; no ?reset in URL | 3 items, /#/pantry | Pass |
| W-11 | Website | Desktop: tab bar under the header, suggestion cards in 2 columns | tabbar top < main top; 2 cards side by side | tabbar y=82.1875, main y=131.1875, card tops=360.34375,360.34375 | Pass |
| W-12 | Website | No JavaScript errors during the whole run | 0 errors | 0 | Pass |
