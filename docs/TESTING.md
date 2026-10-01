# Vérifications et limites — démonstration 1.0.0

## Calculs, intégrité et reproduction

`npm run build && npm test` : 14 tests réussis sur Node.js 22.12.0, le 1 octobre 2026.

- Onze fichiers publics : tailles et SHA-256 du manifeste ; manifeste épinglé.
- Recalcul de 188 sources, 430 URL, 242 destinations seules, 6 729 relations uniques et 188 auto-relations.
- Références 3/37 et 3/2 : distances, comptes et ensemble complet des chemins identiques ; script public original exécuté inchangé.
- Graphes **synthétiques séparés du corpus** : orientation, déduplication, cycles, auto-liens, égalités, départ = destination, absence de chemin, URL inconnue, source ou destination non documentée.
- Normalisation : fragments, slash final, requêtes distinctes conservées.
- 2^60 chemins dans un graphe synthétique : compte BigInt exact et seulement trois chemins matérialisés dans le test.
- Simulation immuable, ajout/retrait, annulation, restauration, maintien des URL isolées après retrait, modification sans effet, rejet des doublons et contradictions.
- Scénario partagé et export rejoués avec le même moteur par la CLI ; bornes et versions invalides rejetées.
- HTML FR/EN statique : références, preuves, liens relatifs compatibles avec le sous-chemin de projet.

Un premier test a révélé qu’une destination isolée par la simulation était traitée comme inconnue. Le moteur conserve désormais l’univers des URL de l’archive ; le test vérifie qu’elle reste connue et devient simplement inatteignable dans ce périmètre.

## Interface

Recette dans le navigateur intégré, moteur Chromium, aux largeurs 1440 et 390 px (viewports émulés, pas un téléphone physique). Actions : choix des URL, recherche, exploration, ajout et retrait guidés, annulation, preuves inline, changement FR/EN conservant les URL et opérations, ouverture du lien partagé, erreur de version et réinitialisation. Activation de boutons et preuves avec Entrée, navigation Tab et focus visible contrôlés. Les sélecteurs natifs ont aussi été sélectionnés par leur API de navigateur ; aucune revendication de test avec lecteur d’écran.

Le cas retrait retrouve 3/34 après partage. Le cas EN reste à 3/2 lorsque ce retrait ne touche pas ses chemins minimaux. Le parcours mobile est vertical sans débordement horizontal observé. Les preuves restent ouvrables quand les scripts sont bloqués par CSP et les références sont générées en HTML ; ceci est distinct d’un test avec JavaScript désactivé dans les préférences du navigateur.

L’export présente le JSON lisible et copiable, avec un lien de téléchargement natif. La capture automatisée de l’événement de téléchargement du navigateur intégré a expiré ; le contenu exporté est vérifié et rejouable, sans prétendre avoir validé un enregistrement sur tous les navigateurs.

## Limites

Pas de tests Safari, Firefox, VoiceOver, NVDA, appareil physique ou audit complet WCAG. Pas de mesure terrain, score SEO, causalité, indexation, performance de classement ni trafic. Le corpus et les opérations disponibles restent bornés à l’archive du 9 septembre 2026. Une URL actuelle peut avoir changé ; l’ouvrir ne vérifie pas l’archive.

Le workflow GitHub Pages reconstruit le site et rejoue les tests avant publication. Les contrôles de livraison (empreintes réellement servies, URL publique et scénario partagé, encarts Edikka FR/EN) sont conservés dans la recette opérationnelle Edikka de cette publication.
