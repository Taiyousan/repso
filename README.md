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

| Script                     | Rôle                                                            |
| -------------------------- | --------------------------------------------------------------- |
| `npm run check`            | Lint + typecheck + tests                                        |
| `npm run format`           | Formatage Prettier                                              |
| `npm run db:generate`      | Génère une migration SQL après modification du schéma           |
| `npm run build:dev`        | APK de développement sur EAS (`com.taiyoudev.repso.dev`)        |
| `npm run build:preview`    | APK de l'app réelle sur EAS (`com.taiyoudev.repso`)             |
| `npm run build:production` | AAB signé pour le Play Store (`com.taiyoudev.repso`)            |
| `npm run site:build`       | Site web (`site/`, Astro) dans `site/dist/`, déployé par Vercel |

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
site/           Site web public (Astro) : téléchargement, catalogue d'exercices, confidentialité
```

## Base de données

Le schéma est dans [src/db/schema.ts](src/db/schema.ts). Après modification :

```bash
npm run db:generate
```

Les migrations sont appliquées automatiquement au démarrage de l'app.

Principe clé : un **entraînement** est une copie d'une **séance** de programme. Il peut être modifié
librement en cours de route, puis les changements peuvent être reportés (ou non) dans la séance.

## Bibliothèque d'exercices

`src/data/exercise-library.json` est généré par `npm run library:build` depuis free-exercise-db, les
traductions de `src/data/` et les exercices ajoutés à la main (`src/data/exercise-extras.json`).
L'app embarque cette bibliothèque, qui marche hors ligne, et la récupère aussi sur le site, pour la
mettre à jour sans nouvelle version de l'app :

1. Modifier les fichiers de `src/data/`, puis `npm run library:build`.
2. Incrémenter `LIBRARY_VERSION` dans `src/features/exercises/library.ts`.
3. Pousser sur `main` : Vercel publie `/library/manifest.json` et `/library/v<version>.json`.

Le site expose aussi la bibliothèque à tout le monde : une page par exercice (`/exercices/<slug>/`),
une liste avec recherche et filtres (`/exercices/`), le JSON à une adresse fixe
(`/library/latest.json`, lisible depuis un autre site) et sa description pour les IA (`/llms.txt`).

Pour donner ses propres photos à un exercice, les déposer dans `src/data/exercise-images/<slug>/`
(`0.jpg`, `1.jpg`… : position de départ puis d'arrivée, moins de 500 ko chacune), puis suivre les
étapes ci-dessus. Elles remplacent les images de l'exercice : le site les publie sous un nom qui
contient une empreinte de leur contenu (`/exercise-images/<slug>/0.<empreinte>.jpg`), si bien qu'une
photo modifiée change d'adresse et qu'aucun téléphone ne garde l'ancienne en cache.

Les apps installées lisent le manifest au plus une fois par jour à l'ouverture (ou via Réglages →
« Mettre à jour la bibliothèque ») et ne téléchargent la bibliothèque que si sa version est plus
récente. Un fichier invalide est ignoré en entier. Pour tester sans déployer, servir le site depuis le PC
(`npm run site:build`, puis `npm run preview --prefix site -- --host`) et lancer Metro avec
`EXPO_PUBLIC_LIBRARY_URL=http://<ip-du-pc>:4321/library/`. Un nouveau type de suivi demande en revanche une
nouvelle version de l'app : les anciennes refusent alors la bibliothèque et gardent la leur.

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

## Distribuer l'APK

Le site ([repso-app-android.vercel.app](https://repso-app-android.vercel.app)) propose la dernière Release de ce
dépôt. Les liens des builds EAS expirent : ne jamais les diffuser. Pour publier une version :

```bash
npm run build:preview   # puis télécharger l'APK depuis la page du build
gh release create v1.0.0 repso.apk --repo Taiyousan/repso --title "Repso 1.0.0"
```

L'asset doit s'appeler `repso.apk` : c'est le nom du lien `releases/latest/download/repso.apk`.

## Crédits et licences

- Code : licence [MIT](LICENSE).
- Exercices et illustrations : [free-exercise-db](https://github.com/yuhonas/free-exercise-db)
  (domaine public, Unlicense).
- Carte des muscles : [react-native-body-highlighter](https://github.com/HichamELBSI/react-native-body-highlighter)
  (MIT).
- Polices [Nunito](https://fonts.google.com/specimen/Nunito) et
  [Baloo 2](https://fonts.google.com/specimen/Baloo+2) : SIL Open Font License 1.1.
