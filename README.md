# Repso

Application Android de suivi d'entraînement en salle : programmes, séances live avec timer de repos,
records personnels, statistiques et import/export de programmes au format JSON.

Projet personnel et vitrine portfolio. Les données restent sur l'appareil (local-first) : voir la
[politique de confidentialité](PRIVACY.md).

## Stack

- [Expo](https://expo.dev) SDK 58, React Native, TypeScript strict
- [Expo Router](https://docs.expo.dev/router/introduction/) (onglets natifs)
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) + [Drizzle ORM](https://orm.drizzle.team) (migrations, requêtes live)
- [Uniwind](https://uniwind.dev) (Tailwind CSS 4 pour React Native), thème clair « néo-brutal »
- Zustand pour l'état de la séance en cours
- Jest (`jest-expo`) pour la logique métier

## Démarrer

```bash
npm install
npm run build:dev  # development build (APK) sur EAS, à installer sur le téléphone
npm start          # serveur de dev pour ce development build
```

## Scripts

| Script                     | Rôle                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `npm run check`            | Lint + typecheck + tests                                                               |
| `npm run format`           | Formatage Prettier                                                                     |
| `npm run db:generate`      | Génère une migration SQL après modification du schéma                                  |
| `npm run build:dev`        | APK de développement sur EAS (`com.taiyoudev.repso.dev`)                               |
| `npm run build:preview`    | APK de l'app réelle sur EAS (`com.taiyoudev.repso`)                                    |
| `npm run build:production` | AAB signé pour le Play Store (`com.taiyoudev.repso`)                                   |
| `npm run site:build`       | Pages web publiques (accueil, confidentialité) dans `site-dist/`, déployées par Vercel |

## Structure

```
src/
  app/          Routes Expo Router (un fichier = un écran)
  components/   Composants d'interface partagés (ui/)
  data/         Bibliothèque d'exercices (free-exercise-db, noms français)
  db/           Schéma Drizzle, client SQLite, requêtes live, migrations générées
  domain/       Logique métier pure et testée (volume, 1RM, records, stats…)
  features/     Écrans par domaine : composants, requêtes, mutations, logique
  lib/          Utilitaires (dates, texte, graphiques, thème)
  global.css    Design tokens (thème clair)
modules/        Modules natifs locaux (notification de minuteur, enregistrement de fichier)
```

## Base de données

Le schéma est dans [src/db/schema.ts](src/db/schema.ts). Après modification :

```bash
npm run db:generate
```

Les migrations sont appliquées automatiquement au démarrage de l'app.

Principe clé : un **entraînement** est une copie d'une **séance** de programme. Il peut être modifié
librement en cours de route, puis les changements peuvent être reportés (ou non) dans la séance.

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

GitHub Actions : lint, typecheck, tests et formatage sur chaque push/PR. Les APK sont construits sur
EAS (voir `eas.json`).

## Crédits et licences

- Code : licence [MIT](LICENSE).
- Exercices et illustrations : [free-exercise-db](https://github.com/yuhonas/free-exercise-db)
  (domaine public, Unlicense).
- Carte des muscles : [react-native-body-highlighter](https://github.com/HichamELBSI/react-native-body-highlighter)
  (MIT).
- Polices [Nunito](https://fonts.google.com/specimen/Nunito) et
  [Baloo 2](https://fonts.google.com/specimen/Baloo+2) : SIL Open Font License 1.1.
