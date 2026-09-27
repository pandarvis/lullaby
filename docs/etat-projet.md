# État du projet et passation

Dernière mise à jour : 27 septembre 2026, Codex.

## État réel

Le checkout initial `C:\Sources\lullaby` reste sur `develop`, au merge local
`391b780` de la consultation Git. Documentation, socle Windows et icône Iris
intégrés. Aucun push supplémentaire ni release publié pendant cette tranche.

Le travail courant est sur `feature/project-overview`, depuis `6d78fd7`, dans
`C:\Sources\lullaby-worktrees\windows-agent-foundation`. Cette branche contient
les évolutions locales `feature/git-hover` et `feature/iris-workspace` : fiches Git
au survol, huit emblèmes SVG facettés et interface compacte. Elle n'est pas fusionnée
dans `develop`.

L'application ouvre des dossiers, y compris vides et sans Git, puis crée des
conversations Claude/Codex. assistant-ui affiche Markdown, outils, questions et
permissions. Brouillons et projection des échanges sont conservés dans
`%APPDATA%\lullaby\state.json` ; les moteurs gardent contexte natif, instructions,
skills et identifiants de reprise. Une seule exécution par dossier dans Lullaby ;
une CLI externe n'est pas verrouillée.

La tranche Studio ajoute :

- Détection Codex dans le PATH ou l'installation officielle, chemin configurable,
  diagnostic distinct entre moteur installé et abonnement confirmé.
- Modèle, effort et permissions dans le compositeur ; flèche d'envoi/arrêt et
  menu « + » pour références de fichiers/dossiers et aperçu HTML.
- Aperçu HTML autonome isolé, côte à côte avec la conversation ; ouverture
  externe d'une copie statique sans scripts.
- Paramètres moteurs/réseau/apparence, logos fournisseurs officiels SVG,
  accueil facetté et animations désactivables. Point vert décoratif retiré.
- Renommer ou retirer une entrée projet et ses conversations locales avec
  confirmation, sans effacer le dossier ni les sessions natives.
- État Git propre explicite et raccourci vers Historique. Modifications montre
  les changements non committés du dossier choisi, indépendamment des autres worktrees.

La [recette Studio](validation/studio-v1.md) précise les modes de permissions,
les limites d'aperçu, la provenance des logos et les décisions de relecture.
Studio ne comportait aucune dépendance supplémentaire ni accès API facturé. Réseau/Px reste
configuré par moteur ; aucun réglage global ou proxy professionnel inventé.

Les retours Iris ajoutent des icônes utilitaires facettées, les onglets dans
l'en-tête, des menus Radix avec descriptions, la coloration du code et une activité
visible dès l'envoi. Les commandes sont identifiables dans des cartes dépliables.
Une bibliothèque de coloration embarquée (highlight.js) a été ajoutée ; Radix était
déjà installé transitivement. Voir la [recette Iris](validation/iris-feedback.md).

Les menus « … » utilisent des points discrets ; le menu de conversation est aligné sur sa carte, avec un libellé centré.

Chaque conversation dispose désormais d’un menu « … » pour supprimer son historique
et son brouillon locaux après confirmation. Les fichiers du projet et la session
native restent intacts. Un agent actif doit être arrêté avant la suppression.
Plusieurs conversations peuvent appartenir au même projet ; elles travaillent à tour
de rôle dans son dossier. Des projets distincts peuvent exécuter leurs agents en parallèle.
L’isolation automatique par worktree pour un même projet reste à implémenter.

L’accueil est une liste stable de projets : emblème, dossier, conversation concernée,
état et compteurs globaux. Les états se mettent à jour depuis les événements des moteurs.
La sélection de conversation est conservée par projet pendant la navigation (en mémoire,
pas après redémarrage). Depuis l’accueil, priorité à une demande de réponse, puis une
exécution, une erreur ou une interruption. Les paramètres généraux restent uniquement
en bas à gauche ; Réseau conserve son raccourci dans le bandeau.

## Vérifications

- Suite complète : **116 tests réussis, 5 essais fournisseurs opt-in ignorés**, puis un test ciblé de navigation réussi (117 tests au total).
  TypeScript, build et `npm run package:win` réussis ; paquet Windows non signé.
- Diagnostic ChatGPT réel et échange Codex avec GPT-6-Luna dans un projet
  temporaire : liste Markdown et bloc HTML reçus. Compteur de l'aperçu cliqué 0 → 1.
- Réglage natif Codex après mode explicite vérifié par protocole sans appel modèle.
  Un profil avancé non représentable est refusé plutôt que remplacé silencieusement.
- Isolation native : aucun pont Lullaby dans l'iframe et navigation vers un second
  serveur local bloquée, zéro requête reçue par le collecteur de recette.
- Paramètres observés avec les deux abonnements confirmés ; conversation
  et saisie accessibles dans une fenêtre de 797 × 574 px.
- Les recettes antérieures [Claude](validation/claude-local.md),
  [Codex](validation/codex-local.md), [interface](validation/interface-v0.md)
  et [Git](validation/git-v1.md) conservent leurs preuves et réserves spécifiques.

L'aperçu personnel est disponible hors checkout dans
`C:\Sources\Lullaby-preview-0.1.0\Lullaby.exe`.
Les essais utilisent des projets temporaires séparés du dépôt utilisateur.

## Limites et suite

Le poste professionnel, Px, les certificats et les règles d'exécution restent à
tester sur place. La parité globale avec les clients officiels n'est pas démontrée.
L'historique d'une session importée reste dans le moteur ; Lullaby n'affiche que
les échanges réalisés après l'import. Aucune synchronisation entre machines.

Les références de fichiers ne sont pas des pièces jointes vision. L'aperçu accepte
du HTML autonome avec CSS/JS intégrés, pas encore un serveur Vite/React ou des
ressources voisines/réseau. La copie externe est statique et son URL expire avec
l'aperçu. Deux détails mineurs de relecture restent à améliorer : confinement du
focus clavier dans les paramètres et message d'erreur périmé possible entre deux
demandes d'aperçu concurrentes ; le document affiché reste protégé par son identifiant.

Chronos par projet/session, supervision avancée et alertes internes restent des
jalons suivants. Notifications Windows hors priorité ; espace documentaire en V2.
La prochaine étape est l'essai utilisateur du paquet puis, sur demande, l'intégration
de `feature/project-overview` (qui contient Iris, Studio et la suppression des conversations) vers `develop`. Les maquettes ne sont pas une preuve
d'implémentation des fonctions futures.

## Reprise par un autre agent

Lire AGENTS.md et CONTRIBUTING.md, puis vérifier le statut Git réel. Préserver les
worktrees et dépendances ; utiliser des fixtures temporaires et ne pas manipuler
les connexions ou conversations privées. Les commandes sont dans
[Développement](developpement.md), les résultats de cette tranche dans la recette
Studio. Remplacer les informations obsolètes de cette passation sans empiler un journal.
