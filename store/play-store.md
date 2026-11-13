# Fiche Play Store

Tout ce qu'il faut saisir dans la Play Console pour publier Repso, prêt à copier. Les limites de
longueur de Google sont indiquées entre parenthèses ; `npm test` les vérifie.

Adresse du site : `https://repso-app-android.vercel.app` (projet Vercel « repso », déployé depuis `main`).

## Fiche principale

### Nom de l'application (30 caractères max)

<!-- title -->

Repso : carnet de musculation
<!-- /title -->

### Description courte (80 caractères max)

<!-- short -->

Programmes, séances, records et stats de muscu. Sans compte, sans pub.
<!-- /short -->

### Description complète (4 000 caractères max)

<!-- full -->

Repso est un carnet d'entraînement de musculation simple et rapide. Prépare tes séances, note tes séries en salle et regarde tes progrès, sans compte, sans publicité et sans connexion obligatoire.

PROGRAMMES ET SÉANCES
• Crée tes programmes et leurs séances : Push, Pull, Legs, Full body, Haut / Bas…
• Ou pars d'un programme suggéré et adapte-le.
• Pour chaque exercice : ordre, temps de repos et objectif (« 4 × 8-10 »).
• Importe et exporte tes programmes en fichier, pour les partager ou les écrire à l'avance.

EN SALLE
• Démarre ta séance en un geste : chaque exercice reprend tes séries de la dernière fois.
• Tes performances précédentes s'affichent à côté de chaque série.
• Minuteur de repos automatique, avec notification et vibration, même écran éteint.
• Séries d'échauffement, dégressives ou jusqu'à l'échec.
• Exercices au poids du corps et en durée, avec compte à rebours.

PROGRÈS
• Records personnels : charge max, 1RM estimé, volume, répétitions et durée.
• Récapitulatif à la fin de chaque entraînement, comparé à la dernière fois.
• Historique complet, modifiable, et ajout des entraînements faits sans l'app.
• Statistiques : semaines d'affilée, calendrier, volume par semaine, séries par muscle sur une silhouette.

PLUS DE 870 EXERCICES
• Bibliothèque complète en français, avec illustrations et consignes d'exécution.
• Recherche par nom, muscle ou matériel ; 170 exercices essentiels mis en avant.
• Crée tes propres exercices.

TES DONNÉES RESTENT CHEZ TOI
• Aucun compte, aucun serveur, aucune publicité, aucun traqueur.
• Tout est enregistré sur ton téléphone.
• Sauvegarde et restauration dans un fichier, quand tu veux.
<!-- /full -->

### Catégorie et coordonnées

- Type : Application
- Catégorie : Santé et remise en forme
- Tags : Musculation, Suivi d'entraînement, Fitness
- Adresse e-mail : taiyoudev@gmail.com
- Site web : `https://repso-app-android.vercel.app`
- Téléphone : laisser vide

### Éléments graphiques

Dans [store/graphics/](graphics/) :

- Icône 512 × 512 : `icon-512.png`
- Image de présentation 1024 × 500 : `feature-graphic.png`
- Captures d'écran téléphone : 2 à 8 images, à prendre sur le téléphone avec l'app de production et
  quelques semaines de vraies données (Accueil, entraînement en cours, récapitulatif, fiche
  exercice, statistiques, bibliothèque).

## Contenu de l'application

### Règles de confidentialité

URL : `https://repso-app-android.vercel.app/privacy/` (générée depuis [PRIVACY.md](../PRIVACY.md)).

### Annonces

Non, l'application ne contient pas d'annonces.

### Accès à l'application

Toutes les fonctionnalités sont disponibles sans restriction (pas de compte ni de connexion).

### Classification du contenu (questionnaire IARC)

- Catégorie : Toutes les autres catégories d'applications (ni jeu, ni réseau social).
- Violence, sexualité, langage grossier, substances, jeux d'argent : non à tout.
- Les utilisateurs peuvent-ils interagir ou échanger du contenu ? Non.
- Partage de la position ? Non.
- Achats numériques ? Non.
- Résultat attendu : PEGI 3 / Tout public.

### Public cible

- Tranche d'âge : 18 ans et plus. L'app n'est pas pensée pour les enfants ; ne cocher aucune tranche
  de moins de 13 ans évite les obligations du programme Familles.
- L'app n'attire pas involontairement les enfants : non.

### Sécurité des données

- L'application collecte-t-elle ou partage-t-elle des données utilisateur des types requis ? **Non.**
  Les données saisies ne quittent jamais le téléphone, sauf dans un fichier que l'utilisateur
  exporte lui-même : ce n'est ni une collecte ni un partage au sens de Google.
- Les illustrations sont téléchargées depuis le CDN jsDelivr. C'est un simple chargement de
  contenu : aucune donnée utilisateur n'est envoyée.
- Chiffrement en transit, demande de suppression : sans objet, puisque rien n'est collecté.

### Applications de santé

Déclaration demandée pour la catégorie Santé et remise en forme : cocher « Activité physique et
remise en forme » (suivi d'entraînements). Pas de Santé Connect, pas de fonction médicale.

### Autres déclarations

- Application d'actualités : non.
- Application gouvernementale : non.
- Fonctionnalités financières : aucune.
- Identifiant publicitaire : non utilisé (pas de SDK publicitaire ni d'analyse).
- Autorisation d'alarmes exactes : `SCHEDULE_EXACT_ALARM` seulement, accordée par l'utilisateur. Elle
  n'exige pas de déclaration, contrairement à `USE_EXACT_ALARM`, retirée exprès.

## Publication

1. Créer le compte développeur (personnel), puis l'application « Repso », gratuite.
2. Remplir les sections ci-dessus.
3. `npm run build:production`, puis envoyer l'AAB sur la piste de test fermé.
4. Test fermé : au moins 12 testeurs inscrits pendant 14 jours d'affilée (obligatoire pour les
   comptes personnels récents).
5. Demander l'accès à la production, puis publier.

Attention à la signature : l'APK v1 distribué à la main (`npm run build:preview`) est signé avec la
clé générée par EAS. Pour que la version du Play Store le mette à jour sans perte de données, choisir
dans la signature d'application Play « Utiliser la clé de signature existante » et y envoyer cette
clé (`eas credentials` → Android → télécharger le keystore). Sinon Google signe avec sa propre clé :
il faudra faire une sauvegarde dans Réglages, désinstaller l'APK, installer depuis le Play Store,
puis restaurer la sauvegarde.
