# Reproduire un scénario / Replay a scenario

Node.js 22+, aucune dépendance, aucun accès privé requis. Les calculs ne contactent pas Edikka.

```sh
git clone https://github.com/edikkaweb/seo-architecture-demo.git
cd seo-architecture-demo
npm run build
npm test
node originals/reproduce-paths.mjs
```

Le build vérifie la taille et SHA-256 de chaque original et l’empreinte épinglée du manifeste avant de générer le dérivé d’affichage et les pages HTML FR/EN. `node originals/reproduce-paths.mjs` exécute sans modification le programme public du paquet et compare tous les chemins aux références.

## Rejouer l’export JSON

Dans la démonstration, choisir les deux URL, appliquer éventuellement des opérations et activer **Exporter le scénario JSON**. Enregistrer `edikka-architecture-scenario.json` dans le clone puis :

```sh
node src/replay.mjs edikka-architecture-scenario.json > calculated.json
```

Le moteur `src/engine.mjs` est le même que celui livré au navigateur. La commande accepte également un lien partagé, à mettre entre apostrophes dans le terminal :

```sh
node src/replay.mjs 'https://edikkaweb.github.io/seo-architecture-demo/#scenario=…'
```

L’export indique `kind`, version de démo, date de calcul, provenance (version et date de l’archive, empreintes), scénario et résultats archive/simulation. Les comptes sont des chaînes décimales exactes ; `distance: null` indique une distance indisponible, jamais zéro. La liste de chemins est bornée à 50, mais le total est exact. Les champs `calculated_at` changent à chaque exécution ; ils ne font pas partie de l’égalité structurelle attendue des résultats.

## Normalisation et algorithme

Graphe dirigé non pondéré. Fragments supprimés, slash final retiré sauf racine, requêtes conservées. Aucune fusion par canonical, langue ou ressemblance. Couples source–destination dédupliqués. BFS calcule distances, prédécesseurs et comptes BigInt. Le DAG des prédécesseurs permet ensuite une énumération déterministe bornée, par ordre lexicographique des chaînes URL (points de code JavaScript), indépendante de la langue du navigateur.

Le script original classe ses chemins par `localeCompare`; les tests comparent tous les chemins comme ensembles, en plus des distances et comptes, et exécutent séparément le script original inchangé. L’ordre visuel peut donc différer du script public, sans modifier le résultat mathématique.

Une copie conserve aussi l’univers initial des URL : retirer le dernier lien vers une destination documentée ne la transforme pas en URL inconnue. Annuler reconstitue la copie depuis l’archive et la liste restante. Aucun original n’est modifié. Les huit opérations sont validées ; un couple ne peut être modifié deux fois dans le même scénario.

## Vérifier ou réimporter

`npm run import` télécharge le manifeste public et les onze fichiers. Toute divergence d’empreinte ou tentative de remplacer un original différent provoque un échec. L’import met à jour seulement sa provenance d’accès lorsque les octets sont identiques. Pour vérifier hors réseau sans changer la date d’accès, utiliser `npm run build` et `npm test`.

Attribution : Edikka, paquet Architecture SEO 1.1.0, archive 2026-09-09, CC BY 4.0. [Instrument](https://www.edikka.com/bibliotheque#instrument-architecture-seo-decision-matrix) · [Article](https://www.edikka.com/insights/seo/architecture-seo-site).

## English quick start

Build and test with Node.js 22+, then pass the exported JSON file or quoted share URL to `node src/replay.mjs`. This uses the exact browser engine. Compare `archive` and `simulation` objects; `calculated_at` is intentionally new. The source observation date remains 2026-09-09. No SEO outcome or current-site observation is produced.
