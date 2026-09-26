# État du projet et passation

Dernière mise à jour : 26 septembre 2026, Codex.

## État réel

- Dépôt initialisé avec un README ; aucune application ni dépendance produit installée.
- Cadrage, proposition de V0 et checklist du poste professionnel rédigés.
- Choix assistant-ui confirmé comme base du chat ; parité complète avec les clients
  officiels non validée et périmètre détaillé encore à préciser.
- Gitflow et documentation commune Codex/Claude formalisés.
- Références artistiques Ankama/Dofus 3 documentées dans `direction-artistique.md`,
  avec sources, observations et transpositions proposées.
- Première maquette interactive dans `docs/mockups/atelier.html` : supervision,
  conversation, palettes Iris/Lagon, emblèmes facettés et interactions fictives.
  Direction Iris et logo facetté validés par l'utilisateur le 26 septembre 2026 ;
  aucune intégration assistant-ui ou moteur.
- Préférence précisée : app colorée, palette maîtrisée et icônes un peu « sharp » ;
  référence concrète désormais fixée par Iris. Figs reste une inspiration ancienne.
- Le périmètre écrit de la V0 n'a pas encore reçu de validation explicite complète.
  Aucun plan d'implémentation détaillé ni exécution de ce plan n'a commencé.
- Usage CLI précisé : dossier de projet puis reprise de session Claude. Parcours
  projet/conversations et essai de reprise CLI ajoutés au cadrage, non implémentés.
- Proxy local requis pour Claude sur le poste pro, probablement Px d'après une
  commande citée de mémoire. Outil et configuration à confirmer sur ce poste ;
  bouton de lancement à la demande souhaité, réglages par moteur proposés.
- Maquette enrichie : menu repliable à 76 px avec préférence locale mémorisée,
  emblèmes de projets et panneau « Proxy Claude » avec démarrage/arrêt simulés.
  Aucun processus Px réel lancé ; commande à confirmer sur le poste pro.
- Vrais logos Anthropic/Codex demandés pour la prochaine retouche ; les pictogrammes
  de fournisseurs de la maquette restent provisoires.
- Temps demandé par projet/session : durées humain/agent séparées sur les cartes
  et dans le détail, cumuls par projet dans la maquette. Valeurs fictives fixes,
  pas de chronométrage réel ; filtres de sessions sans effet sur les cumuls projet.

## Vérifications effectuées

- Exécutables accessibles sur le poste personnel : Git 2.49.0.windows.1,
  Node 22.16.0, npm 10.9.2, Claude Code 2.1.220, Codex CLI 0.158.0-alpha.2.1.
- Syntaxe des deux blocs PowerShell de la checklist vérifiée, sans les exécuter
  sur le poste professionnel.
- Les checks de documentation accompagnent la PR (espaces et liens locaux).
- Temps de la maquette : cumul Lullaby vérifié (35 + 15 = 50 min humain,
  42 + 20 = 62 min agent), conservation du cumul lors d'une recherche, affichage
  dans le chat et nouvelle session à zéro vérifiés. Pas de débordement à 390 px.
- Menu compact vérifié au clavier : repli, dépli, mémorisation après actualisation,
  sélection de projet et ouverture du chat. Démarrage/arrêt Px simulés vérifiés.
  Aucun débordement horizontal à 390 px en modes compact et déplié.
- Maquette : syntaxe JavaScript vérifiée avec Node ; essais dans le navigateur de
  l'approbation, du refus, de l'interruption, de l'envoi simulé, de l'erreur/reprise,
  de la création d'une session vide, de la recherche sans résultat et de l'isolation
  des brouillons. Aucun message d'erreur navigateur observé pendant ces essais.
- Inspection visuelle au format bureau, à 900 et 390 px ; absence de débordement
  horizontal vérifiée à 320 px sur atelier et conversation après correction du bandeau.
  Variante Lagon et navigation par projet vérifiées. Pas d'audit d'accessibilité complet.
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

Préserver Iris et le logo validés lors du passage de la maquette au produit.
Confirmer sur le poste pro le relais Px et les réglages transmis à Claude ; tester
Codex séparément. Intégrer le parcours dossier puis sélection/reprise de conversation.
Terminer la revue du périmètre V0, puis rédiger son plan d'implémentation. Le premier
jalon reste une application Windows sur le poste personnel avec les deux abonnements,
puis un paquet à vérifier sur le poste professionnel. Chronos et supervision avancée
restent dans la cible produit après ce jalon.

## Pour l'agent qui reprend

Lire `AGENTS.md`, `CONTRIBUTING.md`, le cadrage et la V0. Relever la branche et le diff.
Ne pas réinstaller une autre interface complète ni introduire Docker/WSL. Ne pas
présenter les propositions comme déjà testées. Actualiser ce document à la prochaine
passation en remplaçant les informations devenues obsolètes.
