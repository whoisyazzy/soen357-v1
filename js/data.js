/* Meal Planning Assistant – V1 (The Vth Division, SOEN 357)
   data.js: icons, fixed lists, fictional sample recipes and sample pantry.
   All foods, recipes and dates are fictional sample data (Output C, Section 2.4). */
"use strict";

const APP_VERSION = "V1";
const GROUP_ID = "The Vth Division";

const I = {
  pantry:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 10h16M4 16h16"/></svg>',
  meals:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 3-3 6s1 4 3 4v8"/></svg>',
  grocery:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/></svg>',
  profile:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
  chev:'<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  back:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  plusBtn:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  alert:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg>',
  empty:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12h8"/></svg>',
  search:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>'
};

const ALLERGENS = ["Peanuts","Tree nuts","Milk","Eggs","Wheat","Soy"];
const PREFS = ["Vegetarian","Vegan","Halal"];
const UNITS = ["units","g","kg","ml","L","can","pack"];
const LOCATIONS = ["Fridge","Freezer","Pantry"];
const DATE_TYPES = ["None","Best before","Use by","Personal reminder"];
const MAX_TIMES = [15,30,45,60,"Any"];
const SCALES = [1,1.15,1.3];

const DLABEL = {"Best before":"Best before","Use by":"Use by","Personal reminder":"Reminder"};
const DHELP = {
  "None":"No date on the package.",
  "Best before":"A quality date. Food may still be fine after it; check before using.",
  "Use by":"A date set by the producer. Follow the instructions on the label.",
  "Personal reminder":"Your own reminder, for example for leftovers or fresh produce."
};

/* Recipes: quantities are written for `servings` (2) and scaled to the chosen servings. */
const RECIPES = [
 {id:"skillet", name:"Zucchini and tomato rice skillet", time:25, servings:2, difficulty:"Easy", allergens:[],
  ing:[["Zucchini",2,"units"],["Rice",150,"g"],["Canned tomatoes",1,"can"],["Olive oil",15,"ml"]],
  steps:["Rinse the rice and slice the zucchini.","Heat the olive oil in a large pan and cook the zucchini for 4 minutes.","Add the rice, the canned tomatoes and 300 ml of water. Stir.","Cover and simmer for 18 minutes, until the rice is tender."]},
 {id:"pasta", name:"Vegetable pasta", time:20, servings:2, difficulty:"Easy", allergens:["Wheat"],
  ing:[["Pasta",200,"g"],["Zucchini",1,"units"],["Canned tomatoes",1,"can"],["Olive oil",15,"ml"]],
  steps:["Cook the pasta in salted boiling water for 10 minutes.","Meanwhile, dice the zucchini and cook it in the olive oil for 5 minutes.","Add the canned tomatoes and simmer for 5 minutes.","Drain the pasta and mix it into the sauce."]},
 {id:"peanut", name:"Peanut noodle stir-fry", time:20, servings:2, difficulty:"Easy", allergens:["Peanuts","Soy","Wheat"],
  ing:[["Noodles",200,"g"],["Peanut butter",40,"g"],["Zucchini",1,"units"],["Soy sauce",20,"ml"]],
  steps:["Cook the noodles.","Stir-fry the zucchini.","Mix in the peanut butter and soy sauce."]},
 {id:"soup", name:"Tomato rice soup", time:35, servings:2, difficulty:"Easy", allergens:[],
  ing:[["Rice",100,"g"],["Canned tomatoes",1,"can"],["Onion",1,"units"],["Vegetable stock",500,"ml"]],
  steps:["Dice the onion and soften it in a pot for 5 minutes.","Add the canned tomatoes, stock and rice.","Simmer for 25 minutes and season to taste."]}
];

/* Sample data. Output C fixed "today" at 5 Nov 2026 with canned tomatoes best before
   15 Dec 2026 (40 days later). V1 uses the real date, so that date is kept relative. */
function seed(today){
  return {
    schema:1,
    pantry:[
      {id:1,name:"Rice",qty:500,unit:"g",loc:"Pantry",dtype:"None",date:""},
      {id:2,name:"Canned tomatoes",qty:1,unit:"can",loc:"Pantry",dtype:"Best before",date:toISO(addDays(today,40))},
      {id:3,name:"Olive oil",qty:100,unit:"ml",loc:"Pantry",dtype:"None",date:""}
    ],
    nextId:10,
    profile:{allergies:["Peanuts"],prefs:[],servings:2,maxTime:30,scale:1},
    filters:{servings:2,maxTime:30},
    rejected:[], selected:[],
    grocery:[], gNext:1
  };
}
