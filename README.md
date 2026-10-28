# Workout Planner

Application Android de suivi d'entraînement en salle : programmes, séances live avec timer de repos,
records personnels, statistiques et import/export de programmes au format JSON.

Projet personnel et vitrine portfolio. Les données restent sur l'appareil (local-first).

## Stack

- [Expo](https://expo.dev) SDK 58, React Native, TypeScript strict
- [Expo Router](https://docs.expo.dev/router/introduction/) (onglets natifs)
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) + [Drizzle ORM](https://orm.drizzle.team) (migrations, requêtes live)
- [Uniwind](https://uniwind.dev) (Tailwind CSS 4 pour React Native), thème clair/sombre
- Zustand pour l'état de la séance en cours
- Jest (`jest-expo`) pour la logique métier

## Démarrer

```bash
npm install
npm start          # serveur de dev (Expo Go ou development build)
npm run android:build  # development build natif (nécessite Android Studio / SDK Android)
```

## Scripts

| Script                | Rôle                                                  |
| --------------------- | ----------------------------------------------------- |
| `npm run check`       | Lint + typecheck + tests                              |
| `npm run format`      | Formatage Prettier                                    |
| `npm run db:generate` | Génère une migration SQL après modification du schéma |

## Structure

```
src/
  app/          Routes Expo Router (un fichier = un écran)
  components/   Composants partagés (ui/)
  db/           Schéma Drizzle, client SQLite, migrations générées
  domain/       Logique métier pure et testée (volume, 1RM, records…)
  global.css    Design tokens (thèmes clair et sombre)
```

## Base de données

Le schéma est dans [src/db/schema.ts](src/db/schema.ts). Après modification :

```bash
npm run db:generate
```

Les migrations sont appliquées automatiquement au démarrage de l'app.

Principe clé : une **séance** est une copie d'une **séance type** de programme. Elle peut être modifiée
librement pendant l'entraînement, puis les changements peuvent être reportés (ou non) dans le programme.

## Import/export de programmes

L'onglet Programmes permet d'importer un fichier de programme `.json`, d'exporter un programme (aussi
depuis sa fiche) et d'exporter le format. Chaque export ouvre une fenêtre qui propose de télécharger le fichier
(fenêtre Android « Enregistrer sous », module natif local `modules/file-saver`) ou de le partager à une
appli (Drive, mail, appli d'IA…). Le format est décrit par un JSON Schema versionné :
[schemas/program.v1.json](schemas/program.v1.json).

L'export du format produit sa documentation en Markdown (structure, exemple, schéma, renvoi vers
free-exercise-db, noms des exercices courants et exercices perso), pour écrire un programme importable soi-même ou le faire écrire
par une IA.

À l'import, chaque exercice est reconnu par son `slug`, sinon par son nom français ou anglais, sinon par
le nom le plus proche (à confirmer). Les exercices introuvables deviennent des exercices perso, créés à
partir des champs `primaryMuscles`, `equipment` et `trackingType` s'ils sont fournis. Un aperçu permet
de corriger chaque correspondance avant de créer le programme.

## CI

GitHub Actions : lint, typecheck, tests et formatage sur chaque push/PR, puis build d'un APK installable
(signé avec la clé de debug) téléchargeable dans les artefacts du workflow.
