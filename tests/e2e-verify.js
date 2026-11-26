/* End-to-end verification of V1 against Output C (Figures 5.1-5.3, states S1-S15) and the
   website-level behaviour. Uses Playwright with Chrome.
   Run:  python3 -m http.server 8357   (in the repo folder), then
         node tests/e2e-verify.js [base-url] [chrome-path]
   Writes docs/V1/verification-results.json and screenshots in docs/V1/screenshots/. */
"use strict";
const path = require("path"), fs = require("fs");
let chromium; try { ({chromium} = require("playwright")); } catch(e) { ({chromium} = require("/opt/npm-tools/node_modules/playwright")); }
const BASE = process.argv[2] || "http://localhost:8357/";
const CHROME = process.argv[3] || (fs.existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : undefined);
const OUT = path.join(__dirname, "../docs/V1");
const SHOTS = path.join(OUT, "screenshots");
const START = BASE + "?reset&today=2026-11-05#/pantry";   // Output C reference date
const results = []; const errors = [];

async function check(id, task, what, expected, fn){
  let actual, ok;
  try { const r = await fn(); actual = r.actual; ok = r.ok; } catch(e){ actual = "Exception: " + e.message.split("\n")[0]; ok = false; }
  results.push({id, task, check: what, expected, actual: String(actual), status: ok ? "Pass" : "Fail"});
  console.log((ok ? "PASS " : "FAIL ") + id + " " + what + (ok ? "" : "  -> " + actual));
}
const has = (s, sub) => ({ok: s.includes(sub), actual: s.length > 160 ? s.slice(0,160)+"…" : s});
const eq = (a, b) => ({ok: a === b, actual: a});

(async () => {
  const browser = await chromium.launch(CHROME ? {executablePath: CHROME} : {});
  const ctx = await browser.newContext({viewport: {width: 375, height: 812}, deviceScaleFactor: 2});
  const p = await ctx.newPage();
  p.on("pageerror", e => errors.push(e.message)); p.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  const text = sel => p.locator(sel).innerText();
  const main = () => text("#content");
  const toastT = async () => (await p.locator("#toastzone").innerText()).trim();
  const dlg = async () => (await p.locator(".dialog").count()) ? (await p.locator(".dialog").innerText()) : "";
  const shot = async name => { await p.waitForTimeout(150); await p.screenshot({path: path.join(SHOTS, name + ".png")}); };
  const chip = async label => p.click(`#content label.chip:has(span:text-is("${label}"))`);
  const tab = async t => { await p.click(`[data-tab=${t}]`); await p.waitForTimeout(120); };
  const btn = async label => { await p.getByRole("button", {name: label, exact: true}).first().click(); await p.waitForTimeout(150); };
  const fillForm = async (o) => {
    if (o.name !== undefined) await p.fill("#f-name", o.name);
    if (o.qty !== undefined) await p.fill("#f-qty", o.qty);
    if (o.unit) await p.selectOption("#f-unit", o.unit);
    if (o.loc) await chip(o.loc);
    if (o.dtype) { await chip(o.dtype); await p.waitForTimeout(100); }
    if (o.date) { await p.fill("#f-date", o.date); await p.waitForTimeout(80); }
  };

  await p.goto(START); await p.waitForTimeout(300);

  /* ================= T1 Manage pantry ================= */
  await check("T1-01","T1","Pantry is the launch screen with sample items","Rice, Canned tomatoes, Olive oil; Fridge: No items",
    async () => { const m = await main(); return {ok: m.includes("Rice") && m.includes("Canned tomatoes") && m.includes("Olive oil") && /Fridge\s+No items/.test(m), actual: m.replace(/\s+/g," ").slice(0,140)}; });
  await check("T1-02","T1","Today line uses the test date","Today (test date): Thu 5 Nov 2026", async () => has(await main(), "Today (test date): Thu 5 Nov 2026"));
  await shot("01_pantry_launch");
  await btn("Add ingredient");
  await check("T1-03","T1","Add ingredient opens the form at its own address","#/pantry/add, title Add ingredient",
    async () => ({ok: p.url().endsWith("#/pantry/add") && (await text("#title")) === "Add ingredient", actual: p.url().split("#")[1] + " / " + await text("#title")}));
  await p.fill("#f-qty", "0"); await btn("Save");
  await check("T1-04","T1","Save with empty fields shows inline errors, fields kept","Enter an ingredient name / quantity > 0 / Choose a unit / Choose where the item is stored",
    async () => { const m = await main(); return {ok: ["Enter an ingredient name","Enter a quantity greater than 0 (decimals are accepted)","Choose a unit","Choose where the item is stored"].every(s => m.includes(s)), actual: (m.match(/Enter[^\n]*|Choose (a unit|where[^\n]*)/g)||[]).join(" | ")}; });
  await check("T1-05","T1","Focus moves to the first invalid field","#f-name focused", async () => eq(await p.evaluate(() => document.activeElement.id), "f-name"));
  await shot("03_validation_errors");
  await fillForm({name: "Zucchini", qty: "2", unit: "units", loc: "Fridge", dtype: "Reminder", date: "2026-11-07"});
  await check("T1-06","T1","Date read-back","Reads as: Sat 7 Nov 2026 (in 2 days)", async () => has(await text("#f-date-read"), "Reads as: Sat 7 Nov 2026 (in 2 days)"));
  await shot("02_add_ingredient");
  await btn("Save");
  await check("T1-07","T1","Saved: item under Use soon with badge; toast + Undo","Use soon · Reminder 7 Nov (in 2 days); toast 'Zucchini added' Undo",
    async () => { const m = await main(), t = await toastT(); return {ok: m.includes("Use soon\nZucchini") && m.includes("2 units · Fridge") && m.includes("Use soon · Reminder 7 Nov (in 2 days)") && t.startsWith("Zucchini added") && t.includes("Undo"), actual: t.replace(/\s+/g," ") + " / " + (m.match(/Zucchini[\s\S]{0,70}/)||[""])[0].replace(/\s+/g," ")}; });
  await check("T1-08","T1","Back on Pantry address after save","#/pantry", async () => eq("#" + p.url().split("#")[1], "#/pantry"));
  await shot("05_saved_undo");
  await btn("Undo");
  await check("T1-09","T1","Undo removes the new item","Zucchini gone; toast 'Zucchini removed'",
    async () => { const m = await main(), t = await toastT(); return {ok: !m.includes("Zucchini") && t.startsWith("Zucchini removed"), actual: t.replace(/\s+/g," ")}; });
  await btn("Add ingredient"); await fillForm({name: "Zucchini", qty: "2", unit: "units", loc: "Fridge", dtype: "Reminder", date: "2026-11-07"}); await btn("Save");
  /* duplicate */
  await btn("Add ingredient"); await fillForm({name: "zucchini", qty: "2", unit: "units", loc: "Fridge"}); await btn("Save");
  await check("T1-10","T1","Duplicate name opens the duplicate notice","Already in your pantry: Zucchini is already in your pantry (2 units, Fridge). Add to existing | Keep as separate item | Cancel",
    async () => { const d = await dlg(); return {ok: d.includes("Already in your pantry") && d.includes("Zucchini is already in your pantry (2 units, Fridge).") && ["Add to existing","Keep as separate item","Cancel"].every(s => d.includes(s)), actual: d.replace(/\s+/g," ")}; });
  await shot("04_duplicate_notice");
  await btn("Cancel");
  await check("T1-11","T1","Cancel on duplicate notice returns to the open form","Form still shows 'zucchini'", async () => eq(await p.inputValue("#f-name"), "zucchini"));
  await btn("Save"); await btn("Add to existing");
  await check("T1-12","T1","Add to existing merges quantities (calculation)","Toast 'Zucchini updated: now 4 units'", async () => has(await toastT(), "Zucchini updated: now 4 units"));
  await btn("Undo");
  await check("T1-13","T1","Undo of merge restores 2 units","Zucchini 2 units", async () => has(await main(), "2 units · Fridge"));
  /* past date */
  await btn("Add ingredient"); await fillForm({name: "Spinach", qty: "1", unit: "pack", loc: "Fridge", dtype: "Best before", date: "2026-11-02"});
  await check("T1-14","T1","Past date read-back","Reads as: Mon 2 Nov 2026 (3 days ago)", async () => has(await text("#f-date-read"), "Reads as: Mon 2 Nov 2026 (3 days ago)"));
  await btn("Save");
  await check("T1-15","T1","Past date notice (S3)","Check the date: This date has passed... Change date | Save anyway",
    async () => { const d = await dlg(); return {ok: d.includes("This date has passed. Check it, or save the item with a Past date label.") && d.includes("Change date") && d.includes("Save anyway"), actual: d.replace(/\s+/g," ")}; });
  await shot("S3_past_date_notice");
  await btn("Change date");
  await check("T1-16","T1","Change date returns focus to the date field","#f-date focused", async () => eq(await p.evaluate(() => document.activeElement.id), "f-date"));
  await btn("Save"); await btn("Save anyway");
  await check("T1-17","T1","Past date label (S4)","Past date section: Spinach · Past date · Best before 2 Nov",
    async () => { const m = await main(); return {ok: m.includes("Past date\nSpinach") && m.includes("Past date · Best before 2 Nov"), actual: (m.match(/Past date[\s\S]{0,80}/)||[""])[0].replace(/\s+/g," ")}; });
  await shot("S4_past_date_label");
  /* discard dialog */
  await btn("Add ingredient"); await fillForm({name: "Zucchini", qty: "2", unit: "units", loc: "Fridge", dtype: "Reminder", date: "2026-11-07"});
  await p.click("#backbtn"); await p.waitForTimeout(150);
  await check("T1-18","T1","Back with unsaved changes asks first (S2)","Discard your changes? Your changes to Zucchini will not be saved. Keep editing | Discard changes",
    async () => { const d = await dlg(); return {ok: d.includes("Discard your changes?") && d.includes("Your changes to Zucchini will not be saved.") && d.includes("Keep editing") && d.includes("Discard changes"), actual: d.replace(/\s+/g," ")}; });
  await shot("S2_discard_dialog");
  await btn("Keep editing");
  await check("T1-19","T1","Keep editing returns to the open form with data kept","Name Zucchini, date 2026-11-07",
    async () => ({ok: (await p.inputValue("#f-name")) === "Zucchini" && (await p.inputValue("#f-date")) === "2026-11-07", actual: await p.inputValue("#f-name") + " " + await p.inputValue("#f-date")}));
  await btn("Cancel"); await btn("Discard changes");
  await check("T1-20","T1","Discard changes returns to Pantry, unchanged","#/pantry; one Zucchini row",
    async () => { const m = await main(); return {ok: p.url().endsWith("#/pantry") && (m.match(/Zucchini/g)||[]).length === 1, actual: p.url().split("#")[1] + ", Zucchini rows: " + (m.match(/Zucchini/g)||[]).length}; });
  await btn("Add ingredient"); await btn("Cancel");
  await check("T1-21","T1","Cancel with no changes leaves without a dialog","#/pantry, no dialog", async () => ({ok: p.url().endsWith("#/pantry") && !(await dlg()), actual: p.url().split("#")[1]}));
  /* edit */
  await p.click('[data-open]:has-text("Zucchini")'); await p.waitForTimeout(150);
  await check("T1-22","T1","Tapping Zucchini opens the pre-filled edit form","Title 'Edit Zucchini', qty 2, address #/pantry/item/10",
    async () => ({ok: (await text("#title")) === "Edit Zucchini" && (await p.inputValue("#f-qty")) === "2" && /#\/pantry\/item\/\d+$/.test(p.url()), actual: await text("#title") + ", qty " + await p.inputValue("#f-qty") + ", " + p.url().split("#")[1]}));
  await p.click("#qp"); await shot("06_edit_ingredient");
  await p.fill("#f-qty", "0"); await btn("Save");
  await check("T1-23","T1","Edit with quantity 0 shows error, other fields kept","Enter a quantity greater than 0 (decimals are accepted); name still Zucchini",
    async () => ({ok: (await main()).includes("Enter a quantity greater than 0 (decimals are accepted)") && (await p.inputValue("#f-name")) === "Zucchini", actual: (await text("#f-qty-err"))}));
  await p.fill("#f-qty", "3"); await btn("Save");
  await check("T1-24","T1","Edit saved: new quantity and toast","3 units · Fridge; toast 'Zucchini updated' Undo",
    async () => { const m = await main(), t = await toastT(); return {ok: m.includes("3 units · Fridge") && t.startsWith("Zucchini updated") && t.includes("Undo"), actual: t.replace(/\s+/g," ")}; });
  await btn("Undo");
  await check("T1-25","T1","Undo restores old quantity","2 units · Fridge; toast 'Change undone'",
    async () => ({ok: (await main()).includes("2 units · Fridge") && (await toastT()).startsWith("Change undone"), actual: await toastT()}));
  await p.click('[data-open]:has-text("Zucchini")'); await p.fill("#f-qty", "3"); await btn("Save");

  /* ================= Website-level checks ================= */
  await p.reload(); await p.waitForTimeout(300);
  await check("W-01","Website","Data is kept after a page refresh","Zucchini 3 units and Spinach still in pantry",
    async () => { const m = await main(); return {ok: m.includes("3 units · Fridge") && m.includes("Spinach"), actual: m.replace(/\s+/g," ").slice(0,120)}; });

  /* ================= T2 Select a suitable meal ================= */
  await tab("meals");
  await check("T2-01","T2","Meals: filter chips, locked allergy chip, hidden note","Servings: 2 | Max time: 30 min | No peanuts (from Profile) | 1 recipe hidden: contains peanuts",
    async () => { const m = await main(); return {ok: ["Servings: 2","Max time: 30 min","No peanuts (from Profile)","1 recipe hidden: contains peanuts"].every(s => m.includes(s)), actual: m.split("\n").slice(0,6).join(" | ")}; });
  await check("T2-02","T2","Ranking: skillet (uses Use soon zucchini, 0 missing) before pasta (1 missing)","1. Zucchini and tomato rice skillet (0 missing) 2. Vegetable pasta (1 missing)",
    async () => { const t = await p.locator("[data-meal]").allInnerTexts(); return {ok: t.length === 2 && t[0].startsWith("Zucchini and tomato rice skillet") && t[0].includes("Zucchini (Use soon)") && t[0].includes("0 missing") && t[1].startsWith("Vegetable pasta") && t[1].includes("1 missing"), actual: t.map(x => x.replace(/\s+/g," ")).join(" || ")}; });
  await shot("07_meals");
  await p.click("#c-serv"); await p.fill("#sv", "0"); await btn("Apply");
  await check("T2-03","T2","Servings 0 is rejected (S5), previous value kept","Enter servings from 1 to 12; chip still Servings: 2",
    async () => { const m = await main(); return {ok: m.includes("Enter servings from 1 to 12") && m.includes("Servings: 2"), actual: (await text("#sv-err"))}; });
  await shot("S5_filter_error");
  await p.fill("#sv", "3"); await btn("Apply");
  await check("T2-04","T2","Servings 3 applied","Chip 'Servings: 3'", async () => has(await main(), "Servings: 3"));
  await p.click("[data-meal=skillet]"); await p.waitForTimeout(150);
  await check("T2-05","T2","Quantities scale to 3 servings (calculation)","Zucchini 3 units, Rice 225 g, Canned tomatoes 1.5 can, Olive oil 22.5 ml",
    async () => { const t = (await text(".ing")).replace(/\s+/g," "); return {ok: ["Zucchini · 3 units","Rice · 225 g","Canned tomatoes · 1.5 can","Olive oil · 22.5 ml"].every(s => t.includes(s)), actual: t}; });
  await p.click("#backbtn"); await p.waitForTimeout(150);
  await p.click("#c-serv"); await p.fill("#sv", "2"); await btn("Apply");
  await p.click("#c-time"); await chip("15 min"); await p.waitForTimeout(120);
  await check("T2-06","T2","No meals match with 15 min (S6)","No meals match. Change Servings or Max time, or search recipes.", async () => has(await main(), "No meals match. Change Servings or Max time, or search recipes."));
  await shot("S6_no_meals_match");
  await chip("30 min"); await p.click("#c-time");
  await p.click("#c-all"); await p.waitForTimeout(100);
  await check("T2-07","T2","Allergy chip explains it is set in Profile","Allergies are set in your Profile and always applied, including in search.", async () => has(await main(), "Allergies are set in your Profile and always applied, including in search."));
  await p.click("#c-all");
  await p.click("#toSearch"); await p.waitForTimeout(120);
  await p.fill("#sq", "lentil"); await p.waitForTimeout(120);
  await check("T2-08","T2","Search with no result (S7)","No recipes found. Try a different ingredient.", async () => has(await main(), "No recipes found. Try a different ingredient."));
  await shot("S7_no_recipes_found");
  await p.fill("#sq", "zucchini"); await p.waitForTimeout(120);
  await check("T2-09","T2","Search keeps allergy filter","2 recipes; 1 recipe hidden: contains peanuts",
    async () => { const m = await main(); return {ok: m.includes("2 recipes") && m.includes("1 recipe hidden: contains peanuts") && !m.includes("Peanut noodle"), actual: m.split("\n").slice(1,5).join(" | ")}; });
  await p.click("[data-meal=skillet]"); await p.waitForTimeout(150);
  await check("T2-10","T2","Meal detail: Why this meal, all Have","Uses Zucchini (Use soon · Reminder 7 Nov); 4 × Have; Select this meal + Reject",
    async () => { const m = await main(); return {ok: m.includes("Uses Zucchini (Use soon · Reminder 7 Nov)") && (m.match(/\bHave\b/g)||[]).length === 4 && m.includes("Select this meal") && m.includes("Reject"), actual: m.split("\n").slice(0,8).join(" | ")}; });
  await shot("08_meal_detail");
  await p.click("#backbtn"); await p.waitForTimeout(150);
  await check("T2-11","T2","Back from detail returns to Search with the query kept","Search recipes, query 'zucchini'",
    async () => ({ok: (await text("#title")) === "Search recipes" && (await p.inputValue("#sq")) === "zucchini", actual: await text("#title") + " / " + await p.inputValue("#sq")}));
  await p.click("#backbtn"); await p.waitForTimeout(150);
  await p.click("[data-meal=pasta]"); await p.waitForTimeout(150); await btn("Reject");
  await check("T2-12","T2","Reject hides the suggestion with Undo (S8)","Toast 'Suggestion hidden' Undo; pasta not listed; '1 suggestion hidden by you'",
    async () => { const m = await main(), t = await toastT(); return {ok: t.startsWith("Suggestion hidden") && !m.includes("Vegetable pasta") && m.includes("1 suggestion hidden by you"), actual: t.replace(/\s+/g," ")}; });
  await shot("S8_reject_undo");
  await btn("Undo");
  await check("T2-13","T2","Undo restores the suggestion","Vegetable pasta listed again", async () => has(await main(), "Vegetable pasta"));
  await p.click("[data-meal=skillet]"); await p.waitForTimeout(150); await btn("Select this meal");
  await check("T2-14","T2","Select a meal with all ingredients (S9)","Meal selected: Zucchini and tomato rice skillet selected. All ingredients are available. OK",
    async () => has((await dlg()).replace(/\s+/g," "), "Zucchini and tomato rice skillet selected. All ingredients are available."));
  await shot("S9_all_ingredients_available");
  await btn("OK");
  await check("T2-15","T2","Meal marked Selected on detail and card","Selected badge on detail; card shows Selected",
    async () => { const d = await main(); await p.click("#backbtn"); await p.waitForTimeout(150); const c = await p.locator("[data-meal=skillet]").innerText(); return {ok: d.includes("Selected") && d.includes("Unselect meal") && c.includes("Selected"), actual: c.replace(/\s+/g," ")}; });
  /* tab memory + browser back */
  await p.click("[data-meal=pasta]"); await p.waitForTimeout(150);
  await tab("pantry"); await tab("meals");
  await check("W-02","Website","Each tab remembers its place","Meals tab returns to Vegetable pasta detail", async () => ({ok: p.url().endsWith("#/meals/recipe/pasta"), actual: p.url().split("#")[1]}));
  await p.goBack(); await p.waitForTimeout(150);
  await check("W-03","Website","Browser Back works","Back to #/pantry", async () => ({ok: p.url().endsWith("#/pantry"), actual: p.url().split("#")[1]}));
  await p.goForward(); await p.waitForTimeout(150);

  /* ================= T3 Prepare grocery list ================= */
  await btn("Select this meal");
  await check("T3-01","T3","Selection confirmation with missing item (09)","Vegetable pasta selected. 1 ingredient is missing. Add 1 missing item to grocery list | Not now",
    async () => { const d = (await dlg()).replace(/\s+/g," "); return {ok: d.includes("Vegetable pasta selected. 1 ingredient is missing.") && d.includes("Add 1 missing item to grocery list") && d.includes("Not now"), actual: d}; });
  await shot("09_selection_confirmation");
  await btn("Not now");
  await check("T3-02","T3","Not now: meal Selected, grocery list unchanged (S10)","Selected badge; button 'Add 1 missing item to grocery list'",
    async () => { const m = await main(); return {ok: m.includes("Selected") && m.includes("Add 1 missing item to grocery list"), actual: m.split("\n").slice(0,4).join(" | ")}; });
  await shot("S10_not_now_selected");
  await btn("Add 1 missing item to grocery list");
  await check("T3-03","T3","Missing item added (S11)","Toast '1 item added to grocery list' View grocery list | Undo",
    async () => { const t = (await toastT()).replace(/\s+/g," "); return {ok: t.includes("1 item added to grocery list") && t.includes("View grocery list") && t.includes("Undo"), actual: t}; });
  await shot("S11_added_view_undo");
  await btn("Add 1 missing item to grocery list");
  await check("T3-04","T3","Adding again does not duplicate (S12)","Already on your list: Pasta is already on your grocery list. Nothing was added twice.",
    async () => has((await dlg()).replace(/\s+/g," "), "Pasta is already on your grocery list. Nothing was added twice."));
  await shot("S12_no_duplicate_notice");
  await btn("View grocery list");
  await check("T3-05","T3","Grocery list groups the item by meal (10)","For Vegetable pasta: Pasta, From: Vegetable pasta, 200 g",
    async () => { const m = await main(); return {ok: m.includes("For Vegetable pasta") && m.includes("From: Vegetable pasta") && (await p.inputValue("[data-q]")) === "200" && m.includes("g"), actual: m.replace(/\s+/g," ").slice(0,120) + " qty=" + await p.inputValue("[data-q]")}; });
  await shot("10_grocery_list");
  await p.click('[data-st][data-k="1"]'); await p.waitForTimeout(120);
  await check("T3-06","T3","Stepper + adds 50 g and shows Saved (calculation)","250, Saved",
    async () => ({ok: (await p.inputValue("[data-q]")) === "250" && (await main()).includes("Saved"), actual: await p.inputValue("[data-q]")}));
  await p.fill("[data-q]", "0"); await p.press("[data-q]", "Tab"); await p.waitForTimeout(120);
  await p.fill("#gname", ""); await p.click('#gadd button[type=submit]'); await p.waitForTimeout(120);
  await check("T3-07","T3","Grocery errors (S13)","Enter an item name; Enter a quantity greater than 0 (decimals are accepted)",
    async () => { const m = await main(); return {ok: m.includes("Enter an item name") && m.includes("Enter a quantity greater than 0 (decimals are accepted)"), actual: (m.match(/Enter[^\n]*/g)||[]).join(" | ")}; });
  await shot("S13_grocery_errors");
  await p.fill("[data-q]", "300"); await p.press("[data-q]", "Tab"); await p.waitForTimeout(120);
  await check("T3-08","T3","Typed quantity is saved (success state)","300, Saved", async () => ({ok: (await p.inputValue("[data-q]")) === "300" && (await main()).includes("Saved"), actual: await p.inputValue("[data-q]")}));
  await p.fill("#gname", "Bread"); await p.click('#gadd button[type=submit]'); await p.waitForTimeout(120);
  await check("T3-09","T3","Manual item added under 'Added by you'","Added by you: Bread; toast 'Bread added'",
    async () => ({ok: (await main()).includes("Added by you\nBread") && (await toastT()).startsWith("Bread added"), actual: await toastT()}));
  await p.click('[data-rm]:near(:text("Bread"))'); await p.waitForTimeout(120);
  await p.click('[data-rm]'); await p.waitForTimeout(150);
  await check("T3-10","T3","Removing the last item shows the empty state with Undo (S14)","Your grocery list is empty...; toast 'Pasta removed' Undo",
    async () => { const m = await main(), t = await toastT(); return {ok: m.includes("Your grocery list is empty. Select a meal to add its missing items, or add an item.") && t.startsWith("Pasta removed"), actual: t.replace(/\s+/g," ")}; });
  await shot("S14_empty_list_undo");
  await btn("Undo");
  await check("T3-11","T3","Undo restores the removed item","Pasta 300 g back", async () => ({ok: (await main()).includes("Pasta") && (await p.inputValue("[data-q]")) === "300", actual: await p.inputValue("[data-q]")}));

  /* ================= Profile ================= */
  await tab("profile");
  await check("P-01","Profile","Profile summary (11)","Allergies Peanuts; Default servings 2; Maximum time 30 min; Display size 100 %",
    async () => { const m = (await main()).replace(/\s+/g," "); return {ok: ["Allergies Peanuts","Default servings 2","Maximum time 30 min","Display size 100 %"].every(s => m.includes(s)), actual: m.slice(0,140)}; });
  await shot("11_profile");
  await btn("Edit profile"); await shot("12_edit_profile");
  await chip("130 %"); await btn("Save");
  await check("P-02","Profile","Display size 130 % applies (S15)","Root font size 20.8px; toast 'Profile saved. Meals now use your new settings.'",
    async () => { const fs = await p.evaluate(() => getComputedStyle(document.documentElement).fontSize); return {ok: fs === "20.8px" && (await toastT()).includes("Profile saved. Meals now use your new settings."), actual: fs + " / " + await toastT()}; });
  await tab("pantry"); await shot("S15_display_size_130");
  await tab("profile"); await btn("Edit profile"); await chip("100 %"); await btn("Save");
  await btn("Edit profile"); await chip("Wheat"); await p.goBack(); await p.waitForTimeout(150);
  await check("W-04","Website","Browser Back from a form with unsaved changes asks first","Discard your changes? Your changes to your profile will not be saved.; still on #/profile/edit",
    async () => { const d = (await dlg()).replace(/\s+/g," "); return {ok: d.includes("Your changes to your profile will not be saved.") && p.url().endsWith("#/profile/edit"), actual: d + " @ " + p.url().split("#")[1]}; });
  await btn("Discard changes");
  await check("W-05","Website","Discard leaves the form without saving","#/profile; Allergies Peanuts", async () => { const m = (await main()).replace(/\s+/g," "); return {ok: p.url().endsWith("#/profile") && m.includes("Allergies Peanuts"), actual: p.url().split("#")[1] + " / " + m.slice(0,40)}; });
  await btn("Edit profile"); await chip("Peanuts"); await btn("Save");
  await check("P-03","Profile","Removing all allergies asks for confirmation","Turn off allergy filter? ... Save | Keep editing",
    async () => has((await dlg()).replace(/\s+/g," "), "You removed all allergies. Meals will no longer hide recipes that contain allergens."));
  await btn("Keep editing"); await p.click("#pcancel"); await btn("Discard changes");

  /* ================= More website-level checks ================= */
  await p.goto(BASE + "#/meals/recipe/pasta"); await p.waitForTimeout(250);
  await check("W-06","Website","A screen can be opened directly by its address","Meal detail for Vegetable pasta", async () => has(await main(), "Vegetable pasta"));
  await p.click("#backbtn"); await p.waitForTimeout(150);
  await check("W-07","Website","In-app Back from a direct link goes to the parent screen","#/meals", async () => ({ok: p.url().endsWith("#/meals"), actual: p.url().split("#")[1]}));
  await p.goto(BASE + "#/nowhere"); await p.waitForTimeout(250);
  await check("W-08","Website","Unknown address falls back to Pantry","#/pantry", async () => ({ok: p.url().endsWith("#/pantry"), actual: p.url().split("#")[1]}));
  await p.goto(BASE + "#/pantry/item/999"); await p.waitForTimeout(250);
  await check("W-09","Website","Missing item address shows a message","This ingredient is no longer in your pantry.", async () => has(await main(), "This ingredient is no longer in your pantry."));
  /* empty pantry (S1): remove all items */
  await p.goto(START); await p.waitForTimeout(300);
  for (let i = 0; i < 3; i++) { await p.click("[data-open]"); await p.waitForTimeout(120); await btn("Remove"); }
  await check("T1-26","T1","Empty pantry state (S1)","Your pantry is empty. + Add ingredient", async () => has(await main(), "Your pantry is empty."));
  await shot("S1_empty_pantry");
  await check("T1-27","T1","Remove shows toast with Undo","Toast '<item> removed' Undo", async () => ({ok: /removed/.test(await toastT()) && (await toastT()).includes("Undo"), actual: (await toastT()).replace(/\s+/g," ")}));
  await p.goto(BASE + "?reset#/pantry"); await p.waitForTimeout(300);
  await check("W-10","Website","?reset restores the sample data and is removed from the address","3 sample items; no ?reset in URL",
    async () => ({ok: (await p.locator("[data-open]").count()) === 3 && !p.url().includes("reset"), actual: (await p.locator("[data-open]").count()) + " items, " + p.url().replace(BASE,"/")}));

  /* ================= Desktop layout ================= */
  const d = await browser.newPage({viewport: {width: 1280, height: 800}});
  d.on("pageerror", e => errors.push(e.message));
  await d.goto(BASE + "#/meals"); await d.waitForTimeout(300);
  await check("W-11","Website","Desktop: tab bar under the header, suggestion cards in 2 columns","tabbar top < main top; 2 cards side by side",
    async () => { const tb = await d.locator("#tabbar").boundingBox(), mn = await d.locator("#main").boundingBox(); const c = await d.locator(".card").evaluateAll(els => els.map(e => e.getBoundingClientRect().top)); return {ok: tb.y < mn.y && c.length >= 2 && Math.abs(c[0] - c[1]) < 2, actual: `tabbar y=${tb.y}, main y=${mn.y}, card tops=${c.join(",")}`}; });
  await d.screenshot({path: path.join(SHOTS, "W_desktop_meals.png")});
  await d.goto(BASE + "#/meals/recipe/skillet"); await d.waitForTimeout(250);
  await d.screenshot({path: path.join(SHOTS, "W_desktop_meal_detail.png")});

  await check("W-12","Website","No JavaScript errors during the whole run","0 errors", async () => ({ok: errors.length === 0, actual: errors.length + (errors.length ? ": " + errors.join(" | ") : "")}));

  const run = new Date().toISOString();
  fs.writeFileSync(path.join(OUT, "verification-results.json"), JSON.stringify({run, base: BASE, results}, null, 2));
  const pass = results.filter(r => r.status === "Pass").length;
  const cell = s => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
  const md = [`# V1 verification results`, ``,
    `Automated run of \`tests/e2e-verify.js\` on ${run.slice(0,10)} (Chrome, 375 px and 1280 px). Test date: 5 Nov 2026 (\`?reset&today=2026-11-05\`), the Output C reference date.`, ``,
    `**${pass} of ${results.length} checks passed.** Screenshots: \`screenshots/\`.`, ``,
    `| ID | Task | Check | Expected | Actual | Status |`, `|---|---|---|---|---|---|`,
    ...results.map(r => `| ${r.id} | ${r.task} | ${cell(r.check)} | ${cell(r.expected)} | ${cell(r.actual)} | ${r.status} |`)].join("\n");
  fs.writeFileSync(path.join(OUT, "verification-results.md"), md + "\n");
  console.log(`\n${pass}/${results.length} checks passed`);
  await browser.close();
  process.exit(pass === results.length ? 0 : 1);
})();
