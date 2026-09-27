# Documentation Lullaby

La documentation évolue avec le projet : chaque changement met à jour ses documents
dans la même PR. Éviter les comptes rendus redondants et les copies de conversations.

| Document | Source de référence pour |
| --- | --- |
| [État du projet](etat-projet.md) | Ce qui existe, ce qui est vérifié et la prochaine action |
| [Cadrage](cadrage.md) | Besoin, contraintes et architecture envisagée |
| [Fidélité aux moteurs](fidelite-moteurs.md) | Instructions natives, skills, reprise et critères de comparaison avec les clients officiels |
| [Direction artistique](direction-artistique.md) | Référence Ankama/Dofus 3, principes UX et mouvement |
| [Maquette interactive](mockups/README.md) | Exploration de la supervision et du chat, parcours fictifs et ouverture locale |
| [Décisions](decisions.md) | Choix structurants, justification et statut |
| [V0 Windows](superpowers/specs/2026-09-26-v0-windows-design.md) | Périmètre proposé et critères de validation du prototype |
| [Feuille de route](feuille-de-route.md) | Ordre des jalons et accès aux plans d'implémentation |
| [Vue Git V1](superpowers/specs/2026-09-26-v1-git-design.md) | Graphe des commits, arborescence des changements et différences |
| [Poste professionnel](poste-pro.md) | Prérequis et contrôles à effectuer sur la machine cible |
| [Développement](developpement.md) | Commandes du socle Electron et tests |
| [Recette Claude](validation/claude-local.md) | Essais réels de l'abonnement et reprise CLI |
| [Recette Codex](validation/codex-local.md) | App Server, authentification, skills et reprise |
| [Recette interface](validation/interface-v0.md) | Parcours Iris et chat assistant-ui |
| [Recette du paquet Windows](validation/v0-windows.md) | Vérifications finales, décisions de réalisation et réserves V0 |
| [Recette Git V1](validation/git-v1.md) | Graphe, versions index/worktree, différences et limites de consultation |
| [Recette Studio V1](validation/studio-v1.md) | Connexion Codex, permissions, aperçu HTML, fichiers, paramètres et gestion des projets |
| [Recette Iris — retours](validation/iris-feedback.md) | Icônes, densité, menus, coloration du code et activité visible |
| [Contribution](../CONTRIBUTING.md) | Gitflow, PR et mise à jour des documents |
| [Consignes communes](../AGENTS.md) | Règles partagées par Codex et Claude |

Ordre conseillé à la reprise : état du projet, contribution, puis les documents
touchés par la tâche. Les plans du socle Windows et de la vue Git sont disponibles
depuis la feuille de route ; leur progression réelle est décrite dans l'état du projet.

- [Récapitulatif d’intervention](validation/turn-review.md) : capture avant/après, carte des fichiers, Examiner, limites et validation.
