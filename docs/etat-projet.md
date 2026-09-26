# État du projet et passation

Dernière mise à jour : 26 septembre 2026, Codex.

## État réel

La documentation et les plans approuvés ont rejoint `develop` par la PR #1,
commit de merge `bef0ae1`. Le checkout initial `C:\Sources\lullaby` reste sur develop.
Le premier socle produit rejoint également `develop` à la demande de l'utilisateur,
depuis `feature/windows-agent-foundation`. Le worktree
`C:\Sources\lullaby-worktrees\windows-agent-foundation` reste disponible avec
ses dépendances et son paquet Windows. Cette intégration ne vaut pas validation
complète de la recette V0.

Suite locale sur `feature/iris-windows-icon`, dans le même worktree libre :
logo Iris conservé et décliné pour l'icône de la fenêtre et de l'exécutable Windows.
Paquet reconstruit, huit tailles embarquées vérifiées, aucune dépendance ajoutée.
L'aperçu local est mis à jour ; l'icône Iris est observée dans la barre de titre.
Cette branche n'est pas encore intégrée à develop.

Implémenté : shell Electron Windows, Iris et logo SVG validés, menu repliable,
projets par dossier, conversations Claude/Codex, chat assistant-ui, Markdown/code,
actions, questions, autorisations, arrêt et reprise par identifiant natif.
Le JSON local conserve projets, sessions, brouillons et projection des échanges.
Une seule exécution par dossier dans Lullaby ; une CLI externe n'est pas verrouillée.

Les moteurs officiels gardent leur contexte, instructions, skills et configuration.
Aucune clé API ni bascule payante automatique. Le diagnostic distingue la présence
d'un moteur de la confirmation de l'abonnement. Modèle/effort se choisissent dans
le catalogue natif ; aucun remplacement implicite d'un modèle refusé.

Le panneau Réseau conserve un profil par moteur et permet de lancer un relais
existant sur demande. Lullaby ne tue pas un relais externe. Aucune commande Px
professionnelle n'a été inventée ni aucun réglage global modifié.

## Vérifications et limites

- [Claude local](validation/claude-local.md) : abonnement Max, règle/skill, fichier,
  refus, interruption, reprise SDK et reprise d'une session créée en CLI réussis.
- [Codex local](validation/codex-local.md) : compte ChatGPT, AGENTS.md/skill,
  fichier et reprise réussis. Ancien modèle local refusé ; choix explicite du
  modèle par défaut du catalogue pour la recette. Refus/arrêt couverts par fake.
- [Interface](validation/interface-v0.md) : sélection Windows d'un dossier avec
  espaces/accents, chat Claude réel, brouillons/routage testés.
- Tests hors réseau : stockage, crash simulé, sessions, IPC, flux moteurs, transport,
  UI et relais local. Les appels modèles sont opt-in.
- 42 tests hors réseau réussis, TypeScript et paquet Windows vérifiés après relecture.
  Trois corrections : permissions Claude natives, état des sessions concurrentes
  et identifiant de reprise conservé lors d'un arrêt au démarrage.
- Paquet Windows construit ; lancement hors checkout observé sur le paquet précédent.
  La recette graphique complète du paquet final reste à terminer. Paquet non signé.
- Poste professionnel, véritable Px/certificat et règles d'entreprise non testés.
- Parité globale non démontrée : outils de l'application hôte non automatiquement
  disponibles, contexte long non testé. L'historique externe reste dans le moteur ;
  le chat d'une session importée affiche les nouveaux échanges.
- Logos fournisseurs officiels encore à obtenir avec provenance : noms textuels
  utilisés. Iris et les emblèmes internes restent en SVG.

## Suite

Terminer la [recette du paquet](validation/v0-windows.md). La relecture du socle
et les corrections associées sont terminées ; l'intégration locale à develop
est demandée explicitement, sans publication de release.
Après acceptation du premier jalon, exécuter le plan Git : graphe des commits,
branches et merges, arbre des fichiers modifiés et diffs en consultation.
Chronos par projet/session, distinction humain/agent, supervision avancée et alertes
internes appartiennent aux jalons suivants. Notifications Windows non prioritaires,
espace documentaire spécialisé envisagé en V2.

Les maquettes HTML restent indépendantes : elles illustrent aussi des fonctions
futures et des données fictives. Pour les principes validés, lire le cadrage,
les décisions, la direction artistique et le contrat de fidélité aux moteurs.

## Reprise par un autre agent

Lire AGENTS.md et CONTRIBUTING.md, puis le statut Git réel. Préserver les
modifications et le worktree en cours ; ne pas manipuler les connexions officielles
ni les conversations privées pour reproduire les tests. Utiliser des fixtures
temporaires. Les commandes vérifiées sont dans developpement.md. Mettre à jour
cette passation en remplaçant les informations obsolètes, sans empiler les journaux.
