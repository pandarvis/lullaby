# État du projet et passation

Dernière mise à jour : 26 septembre 2026, Codex.

## État réel

- Dépôt initialisé avec un README ; aucune application ni dépendance produit installée.
- Cadrage, proposition de V0 et checklist du poste professionnel rédigés.
- Choix assistant-ui confirmé comme base du chat ; parité complète avec les clients
  officiels non validée et périmètre détaillé encore à préciser.
- Gitflow et documentation commune Codex/Claude formalisés.
- Références artistiques Ankama/Dofus 3 documentées dans `direction-artistique.md`,
  avec sources, observations et transpositions proposées ; aucune maquette visuelle
  produite ou validée à ce stade.
- Préférence précisée : app colorée, palette maîtrisée et icônes un peu « sharp » ;
  teintes et formes exactes à valider. Référence Figs retenue comme inspiration ancienne.
- Le périmètre écrit de la V0 n'a pas encore reçu de validation explicite complète.
  Aucun plan d'implémentation détaillé ni exécution de ce plan n'a commencé.

## Vérifications effectuées

- Exécutables accessibles sur le poste personnel : Git 2.49.0.windows.1,
  Node 22.16.0, npm 10.9.2, Claude Code 2.1.220, Codex CLI 0.158.0-alpha.2.1.
- Syntaxe des deux blocs PowerShell de la checklist vérifiée, sans les exécuter
  sur le poste professionnel.
- Les checks de documentation accompagnent la PR (espaces et liens locaux).
- Étude Dofus du studio Figs lue et deux visuels examinés dans le navigateur ;
  témoignage de la designer Ankama et sources complémentaires consultés.
  Aucun devblog original sur la refonte 3.1 consulté directement.
- Aucun essai réel de connexion SDK aux abonnements, de génération de réponse,
  de paquet Electron ou de réseau professionnel réalisé.

## Branche et travail en cours

Branche documentaire : `feature/gitflow-documentation`, destinée à `develop`.
Elle contient aussi le cadrage initial réalisé avant la convention Gitflow.
`develop` a été initialisée depuis le `main` distant contenant le README initial.
Le commit documentaire antérieur `893184d` existait déjà sur le `main` local ;
son historique a été préservé, sans reset ni réécriture. Les nouveaux travaux
suivent désormais le circuit Gitflow. Vérifier `git status` à chaque reprise :
ce fichier ne remplace pas l'état réel du checkout.

## Prochaine action

Terminer la revue du périmètre V0, puis rédiger son plan d'implémentation. Le premier
jalon reste une application Windows sur le poste personnel avec les deux abonnements,
puis un paquet à vérifier sur le poste professionnel. Chronos et supervision avancée
restent dans la cible produit après ce jalon.

## Pour l'agent qui reprend

Lire `AGENTS.md`, `CONTRIBUTING.md`, le cadrage et la V0. Relever la branche et le diff.
Ne pas réinstaller une autre interface complète ni introduire Docker/WSL. Ne pas
présenter les propositions comme déjà testées. Actualiser ce document à la prochaine
passation en remplaçant les informations devenues obsolètes.
