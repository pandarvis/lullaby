# Feuille de route d'implémentation

Date : 26 septembre 2026. Plans demandés par l'utilisateur ; exécution non commencée.
La demande de plan ne vaut pas validation de tous les détails techniques proposés.

| Jalon | Résultat utilisable | Document d'exécution |
| --- | --- | --- |
| A — V0 Windows | Ouvrir un dossier, discuter avec chaque moteur, agir, autoriser, interrompre et reprendre dans Iris ; paquet testable | [Plan du socle](superpowers/plans/2026-09-26-v0-windows.md) |
| B — Git V1 | Graphe commits/branches/merges ET arborescence des fichiers modifiés avec diffs, demandés tous les deux | [Plan Git](superpowers/plans/2026-09-26-v1-git.md) |
| C — Confort V1 | Vue « À mon attention », alertes internes et sons réglables, reprise et navigation soignées | À concevoir après les retours A/B |
| D — Supervision | Plusieurs projets, temps humain/agent par session et projet, puis parallélisme isolé | À découper après validation du socle |
| E — V2 documentaire | Espace de travail documentaire spécialisé éventuel | Exploration conservée dans le cadrage |

Ordre recommandé : terminer A et ses essais locaux avant B ; tester le poste pro
dès qu'il est disponible. Un blocage propre au poste pro ne doit pas empêcher les
travaux locaux indépendants. Les jalons C/D ne sont pas des engagements de release
figés : ils conservent les besoins exprimés sans gonfler la première tranche.

## Limites retenues

- Notifications Windows explicitement hors priorité et hors des plans A/B.
- Alertes visuelles internes et petits sons envisagés ; préférences, regroupement
  et comportement fenêtre réduite à cadrer dans C. Aucun son copié de ChatGPT.
- Bibliothèque SVG de projets, véritables logos fournisseurs et Iris à préserver.
- Pas de plateforme tierce complète, Docker, WSL ou dépendance de service ajoutée.
- La fidélité aux moteurs et aux skills reste une condition de recette de A.
- L'interface documentaire dédiée est une piste V2 ; les agents peuvent entretenir
  les documents du dépôt dès A.

## Gitflow pour exécuter

Ces documents poursuivent la branche de cadrage `feature/gitflow-documentation`
et la PR en brouillon vers `develop`. Aucune fusion n'est effectuée par le plan.
Après intégration autorisée des documents dans `develop`, créer
`feature/windows-agent-foundation`, puis `feature/git-inspector` depuis la base
intégrée correspondante. Si les documents ne sont pas encore intégrés au début
de l'exécution, terminer leur revue puis obtenir l'autorisation de fusion avant
de créer la branche produit depuis `develop`. La branche de cadrage reste destinée
aux documents et maquettes ; ne pas y commencer le produit ni démarrer depuis un
`develop` vide. Aucun merge automatique n'est prévu.

## Lecture et validation

Lire la [V0](superpowers/specs/2026-09-26-v0-windows-design.md), la
[vue Git](superpowers/specs/2026-09-26-v1-git-design.md), puis les deux plans.
Recommandation : exécution séquentielle dans cette session, avec commits par tâche
et documentation à jour. Pas de délégation lancée pendant la préparation des plans.
Les essais par mocks ne remplacent ni les deux abonnements ni le paquet Windows.
