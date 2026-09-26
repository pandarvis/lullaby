# Consignes communes aux agents — Lullaby

Ces consignes s'appliquent à Codex, Claude et tout autre agent intervenant dans ce dépôt.
Les demandes explicites de l'utilisateur priment. Ne pas confondre une proposition
documentée avec une décision validée ou une fonctionnalité implémentée.

## Avant de travailler

1. Lire `docs/README.md`, `docs/etat-projet.md` et `CONTRIBUTING.md`.
2. Vérifier la branche, `git status` et les modifications existantes. Les préserver.
3. Lire le cadrage et la spécification concernés par la tâche.
4. Suivre Gitflow : travail courant dans `feature/*` depuis `develop`, jamais
   directement sur `main` ou `develop`. Les exceptions sont décrites dans CONTRIBUTING.

## Contraintes produit

- Windows natif, application Electron ; Docker et WSL sont exclus.
- Abonnements Claude et ChatGPT ; aucune bascule automatique vers une API payante.
- assistant-ui pour les composants du chat ; moteurs officiels Claude/Codex.
- Minimiser installations et dépendances ; motiver toute nouvelle dépendance.
- Garder les SDK et l'exécution d'outils hors du renderer ; exposer un pont preload limité.
- Les contrôles et politiques du poste professionnel restent à valider sur ce poste.
- Ne jamais committer de jeton, identifiant de proxy, conversation privée ou donnée d'entreprise.

## Documentation vivante

- Mettre à jour la documentation concernée dans la même branche et la même PR
  que le changement. Une fonction proposée, implémentée et vérifiée a trois états distincts.
- Modifier le document source de la décision ; éviter de recopier les règles dans
  plusieurs fichiers. Le point d'entrée et les responsabilités sont dans `docs/README.md`.
- Reporter les choix structurants, leur raison et leurs conséquences dans
  `docs/decisions.md`. Marquer les propositions comme telles.
- À la fin d'une tâche ou avant une passation, actualiser `docs/etat-projet.md` :
  résultat, vérifications réelles, limites, prochaine action et branche concernée.
- Ne pas inventer de commande de test : les commandes et prérequis sont dans
  `docs/developpement.md`. Documenter toute nouvelle commande lors de son introduction.

## Cohabitation Codex / Claude

- Une tâche = une branche. Pour travailler simultanément, utiliser des checkouts
  ou worktrees distincts et annoncer les fichiers/périmètres concernés.
- Ne pas changer de branche dans un dossier utilisé par un autre agent.
- Pour reprendre la tâche d'un autre agent, relire son diff et la passation ; ne pas
  réécrire, supprimer ou réinitialiser ses changements sans demande explicite.
- Une passation décrit l'état réel ; elle ne donne pas à elle seule l'autorisation
  de lancer un autre agent ou de lui envoyer des messages.
- Ne pas fusionner une PR, publier une release, forcer un push ou réécrire une
  branche partagée sans autorisation explicite correspondante.

## Vérification et livraison

Vérifier ce qui a réellement changé. Pour la documentation : liens locaux, cohérence
des statuts et `git diff --check`. Pour le code : contrôles pertinents du projet,
puis essais nécessaires des intégrations. Distinguer compilation, tests automatisés,
essai réel d'abonnement et essai sur poste pro dans le compte rendu.

Une PR indique le problème, le résultat et les validations. Garder les réponses
et les mises à jour concises ; éviter les recherches répétées sans nouvelle incertitude.
