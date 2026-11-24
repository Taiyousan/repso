---
name: add-exercise
description: Add, fix, rename, illustrate or hide an exercise in Repso's exercise library and ship it to production. Use whenever the user asks to add an exercise to the library ("ajoute le … à la bibliothèque"), or to change an existing one.
---

# Add an exercise to the library

The library ships to production from `main`: Vercel republishes `/library/` and installed apps pick
the new version up within a day (or at once via Réglages → « Mettre à jour la bibliothèque »). The
user wants it live quickly, so the work ends with a push to `main` (see AGENTS.md, section Git).
Background: README, section « Bibliothèque d'exercices ».

## 1. Make sure it doesn't exist already

Search `src/data/exercise-library.json` for the English and French names, synonyms and the main
muscle (`grep -n -i`). free-exercise-db names can be misleading: its "Seated Triceps Press" is an
overhead dumbbell extension, not the machine.

- **Exists but hidden** (`"isEssential": false`): it only shows under « Tous » or in a search.
  Offer to add its slug to `src/data/exercise-essentials.json` instead of creating a duplicate.
- **Ambiguous** (dumbbell or machine version, several variants): ask the user which one, naming
  the existing exercises in the question.

## 2. Edit the source files, never exercise-library.json by hand

- **New exercise**: append it to `src/data/exercise-extras.json`, copying the shape of the last
  entry. The `slug` must be new (the build fails on a slug taken in free-exercise-db) and never
  start with `custom-`.
  - `name` in French, `nameEn` in English. Muscle and equipment ids are free-exercise-db's
    (see `src/features/exercises/labels.ts`).
  - `instructions`: 3 to 4 short steps in French, using `tu` like the other exercises, with typographic
    apostrophes (’). Set `"instructionsLanguage": "fr"`.
  - `trackingType`: `weight_reps` for loads, `bodyweight_reps`, `weighted_bodyweight` (dips, pull-ups
    with a belt), `assisted_reps` (machine or band assistance), or `duration`.
  - `"isEssential": true` so it shows by default.
- **free-exercise-db exercise**: French name in `exercise-names.fr.json`, steps in
  `exercise-instructions.fr.json`, visibility in `exercise-essentials.json`, tracking in
  `TRACKING_OVERRIDES` (`scripts/build-exercise-library.mjs`).

## 3. Images

- Reuse free-exercise-db images (`"<Folder>/0.jpg"`, `"<Folder>/1.jpg"`) of the closest movement,
  e.g. `Dip_Machine/` for a seated triceps press machine. Tell the user they are borrowed.
- Or add photos to `src/data/exercise-images/<slug>/` (`0.jpg` start, `1.jpg` end, under 500 KB
  each) under a licence that allows it. Credit them in the README (« Licences et crédits ») and on
  `site/src/pages/exercices/index.astro` if the source is new.

## 4. Build

```bash
npm ci                      # if node_modules is missing
npm run library:build       # downloads free-exercise-db, writes exercise-library.json
npx prettier --write src/data/exercise-library.json src/data/exercise-extras.json
```

The build writes the JSON on one line: prettier restores the committed layout, so `git diff`
shows only the exercise. Then bump `LIBRARY_VERSION` by one in
`src/features/exercises/library.ts`. Without it, installed apps keep their copy.

## 5. Check, commit, push to main

```bash
npm run lint && npm run typecheck && npm test && npm run format:check
```

All must pass. Commit in English, Conventional Commits, mentioning the library version, e.g.
`feat: add the seated triceps press machine` + "Library version 8." in the body. Then:

```bash
git checkout main && git pull --ff-only origin main
# bring the commit over (cherry-pick it if it was made on another branch)
git push origin main
```

If the push to `main` is refused, say so and give the reason. Don't fall back to another
branch without telling the user.

Report to the user in French: the exercise (name, muscles, equipment, essentials or not), the
borrowed images if any, the library version, and that it will be live once Vercel has deployed.
