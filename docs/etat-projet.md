# État du projet et passation

Dernière mise à jour : 26 septembre 2026, Codex.

## État réel

- Plan validé et PR documentaire #1 fusionnée dans `develop` (`bef0ae1`).
- Implémentation démarrée dans le worktree `C:\Sources\lullaby-worktrees\windows-agent-foundation`,
  branche `feature/windows-agent-foundation`. Le checkout initial reste sur `develop`.
- T1 : socle Electron/React/TypeScript installé ; fenêtre Iris, preload limité,
  sélection de dossier et menu repliable. Tests IPC et build passent ; les moteurs
  ne sont pas encore branchés. Commandes dans `docs/developpement.md`.
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
- Les plans du socle Windows et de la vue Git sont validés ; exécution séquentielle
  du socle commencée. Voir `feuille-de-route.md`.
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

- Exigence de fidélité aux moteurs et SVG confirmée ; contrat dans
  `fidelite-moteurs.md`. Catégories de session sans rôle restrictif implicite.
  Configuration native, skills et reprise documentés, toujours sans intégration.

- Trajectoire précisée : V1 centrée développement ; outil documentaire spécialisé
  envisagé en V2, sans périmètre ni choix technique arrêté. La documentation du dépôt
  reste une tâche des agents en V1. Pistes UX conservées dans le cadrage.
- Git : graphe commits/branches/merges et arborescence des fichiers modifiés confirmés
  tous les deux. Spécification et plan de consultation/diffs rédigés, non implémentés.
- Notifications Windows explicitement hors priorité ; alertes internes et sons
  restent une piste de confort après le socle et Git, sans intégration réelle.

## Vérifications effectuées

- Plans relus pour couverture de la V0 et de la vue Git, contrats communs,
  distinction tests simulés/essais réels et limites proposées. Contrôle des liens
  Markdown locaux et du diff ; aucun test produit exécuté (code encore absent).

- Documentation officielle consultée : preset Claude Code distinct du prompt SDK
  minimal, découverte des skills, reprise native Claude/Codex. Ces informations
  restent à confronter aux versions réellement utilisées par le prototype.

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
Relire la V0, la spécification Git et les deux plans liés depuis la feuille de route,
puis choisir l'exécution. Les plans recommandent une progression séquentielle.
Préparer une branche d'implémentation selon Gitflow une fois les documents intégrés
dans `develop` avec l'autorisation correspondante ; aucune fusion effectuée ici. Le premier
jalon reste une application Windows sur le poste personnel avec les deux abonnements,
puis un paquet à vérifier sur le poste professionnel. Chronos et supervision avancée
restent dans la cible produit après ce jalon.

## Pour l'agent qui reprend

Lire `AGENTS.md`, `CONTRIBUTING.md`, le cadrage et la V0. Relever la branche et le diff.
Ne pas réinstaller une autre interface complète ni introduire Docker/WSL. Ne pas
présenter les propositions comme déjà testées. Actualiser ce document à la prochaine
passation en remplaçant les informations devenues obsolètes.

## Exécution en cours — socle Windows

La PR documentaire #1 est fusionnée dans develop. Le produit se développe sur
feature/windows-agent-foundation dans le worktree séparé. T1 compile et les quatre
tests IPC passent. Fenêtre Iris observée sous Windows ; menu repliable et ouverture/
annulation du sélecteur natif vérifiés. La sélection finale doit être retestée :
le pilote UI cible mal le dialogue secondaire sur cette configuration d'écran.
T2 (sessions et stockage) est la prochaine tâche. Aucun moteur réellement connecté.

T2 : gestion des sessions et stockage JSON implémentés. Suite actuelle : 15 tests
passants ; build/typecheck réussis. Verrou par dossier, routage des autorisations,
remplacement des deltas par le texte final, reprise en état interrompu, identifiant
natif, brouillons et fermeture pendant lancement couverts. Les tests utilisent un
moteur factice et ne prouvent pas encore une connexion aux abonnements.

T3 : SDK Claude 0.3.283 intégré. Essais réels Max réussis : skill, fichier, refus, interruption, reprise SDK et CLI. Voir validation/claude-local.md. Suite hors réseau : 21 tests passants. Chat graphique encore à raccorder ; Codex suit en T4.

T4 : App Server Codex intégré, diagnostic ChatGPT confirmé. Essai réel skill/AGENTS.md, fichier et reprise réussi avec modèle choisi dans le catalogue natif. Ancien modèle local refusé sans bascule automatique. Suite : 30 tests passants, 5 essais réels ignorés par défaut. Refus/interruption Codex testés avec serveur factice, recette réelle encore partielle. Voir validation/codex-local.md.
