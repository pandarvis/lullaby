# Contribuer à Lullaby

## Gitflow

| Branche | Départ | Destination | Rôle |
| --- | --- | --- | --- |
| `main` | — | — | Versions stables publiées |
| `develop` | `main` lors de l'initialisation | — | Intégration de la prochaine version |
| `feature/<sujet>` | `develop` à jour | `develop` | Fonctionnalité, correctif courant, documentation ou maintenance |
| `release/<version>` | `develop` | `main`, puis report vers `develop` | Stabilisation d'une version |
| `hotfix/<sujet>` | `main` | `main`, puis report vers `develop` et release active | Correctif urgent d'une version publiée |

Noms courts en minuscules avec tirets. Pas besoin d'installer l'extension `git-flow` :
les commandes Git ordinaires suffisent. Ne pas créer de release tant qu'aucune
version utilisable n'est prête.

Avant une nouvelle tâche, vérifier que le checkout est libre et propre, récupérer
les références distantes et créer la branche depuis `origin/develop`. Une branche
locale non poussée se crée depuis `develop`. Aucun reset pour rendre le dossier propre.

Les changements passent par une PR vers la destination du tableau. Par défaut,
utiliser un commit de merge (`--no-ff`) afin de conserver les frontières des branches.
Ne pas rebaser une branche déjà partagée avec un autre agent. Fusionner les changements
de `develop` si une synchronisation de cette branche partagée est nécessaire.

Après validation d'une release : fusion vers `main`, tag annoté `vX.Y.Z` sur le
commit livré, puis report de la stabilisation vers `develop`. Un hotfix reçoit
également un tag et son correctif doit rejoindre toutes les branches actives concernées.
Fusion, publication et suppression des branches sont des actions distinctes :
ne les faire qu'avec l'autorisation correspondante.

La présente documentation instaure une convention ; elle n'active pas de protection
GitHub ou de contrôle CI. Leur configuration reste une étape ultérieure.

## Commits et pull requests

Préférer des commits ciblés et des messages comme `feat: ...`, `fix: ...`,
`docs: ...`, `test: ...`, `refactor: ...` ou `chore: ...`.

Une PR présente le besoin, le comportement obtenu, les vérifications effectuées et
les limitations pertinentes. Les changements de code et leur documentation sont revus
ensemble. Une PR incomplète ou en attente d'un test réel reste en brouillon.

## Mise à jour de la documentation

Consulter l'index `docs/README.md`. Mettre à jour uniquement les sources concernées :

- comportement et périmètre : `docs/cadrage.md` et spécification concernée ;
- choix structurant : `docs/decisions.md`, avec son statut et ses conséquences ;
- installation et environnement professionnel : `docs/poste-pro.md` ;
- travail terminé, limites et passation : `docs/etat-projet.md` ;
- nouvelles commandes de développement et de vérification : README et document approprié.

Lorsqu'une décision remplace une ancienne, marquer l'ancienne comme remplacée et
actualiser les documents actifs. Git conserve l'historique ; la documentation courante
doit décrire l'état présent. Ne pas écrire « testé » sans indiquer ce qui a été exécuté.

## Travail avec plusieurs agents

Les règles communes se trouvent dans `AGENTS.md`. Un worktree Git est un dossier
de travail supplémentaire, pas un conteneur : il ne nécessite ni Docker ni WSL.
Séparer les tâches concurrentes par branche et répertoire ; répartir les fichiers
partagés avant de commencer pour éviter les modifications contradictoires.

Pour une reprise séquentielle, transmettre : branche, commit de référence, changements
non committés, vérifications, blocages et prochaine action. Ne pas prétendre qu'une
autre conversation est coordonnée si elle n'a pas effectivement reçu ces informations.
