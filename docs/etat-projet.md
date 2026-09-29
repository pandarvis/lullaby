# État du projet et passation

Dernière mise à jour : 29 septembre 2026, Claude.

## État réel

**Version 0.1.1** (hotfix `hotfix/approval-scroll`) : défilement conservé lors d’une
demande d’autorisation, autorisations modifiables pendant un tour, mode « Auto » Claude,
mémoire du mode par projet. Un réglage d’autorisation signalé perdu avant le premier
message n’a pas été reproduit (chaîne vérifiée de l’interface au moteur) : à surveiller.

**Version 0.1.0** : première version, stabilisée sur `release/0.1.0` depuis `develop`,
fusionnée dans `main` avec le tag annoté `v0.1.0` ; contenu et limites dans le
[CHANGELOG](../CHANGELOG.md). Paquet `dist/win-unpacked` construit et lancé sur le
poste professionnel (projets et conversations existants rechargés) ; non signé.

Le checkout initial `C:\Sources\lullaby` reste sur `develop`, au merge local
`391b780` de la consultation Git. Documentation, socle Windows et icône Iris
intégrés. Publication des branches sur `origin` demandée pour la reprise sur poste
professionnel ; aucune release publiée.

Le travail courant est sur `feature/turn-review`, depuis `51168d0`, dans
`C:\Sources\lullaby-worktrees\windows-agent-foundation`. Cette branche contient
les évolutions locales `feature/git-hover` et `feature/iris-workspace` : fiches Git
au survol, huit emblèmes SVG facettés et interface compacte. Elle n'est pas fusionnée
dans `develop`.

Pour reprendre la version complète sur un autre poste, utiliser
`feature/turn-review` et les commandes de [reprise professionnelle](poste-pro.md).

Sur le poste professionnel, Claude a poursuivi sur `feature/pro-workstation`
(depuis `946237e`, checkout `C:\Sources\lullaby`), qui intègre `develop` (`7e3d5e6`,
coquille Iris) le 29 septembre ; non poussée, non fusionnée dans `develop` :

- Moteurs conservés entre les messages (D014) : ~40 s par réponse avant, ~3 s
  ensuite pour Claude ; premier message ~30 s (démarrage natif et hooks utilisateur).
  Délai de démarrage Claude porté à 90 s.
- Relais : journal en direct (étapes, sortie du processus, en mémoire uniquement)
  et badge d'état dans Réseau ; arrêt vérifié du lanceur Px et de son processus enfant.
- Choix « natifs » nommés dans le compositeur (modèle, effort, autorisations).
- Chrono du tour conservé en changeant de vue ; menus fermés au clic extérieur ;
  icônes utilitaires au trait ; copie en icône ; prompt envoyé ancré en haut du
  chat (`turnAnchor="top"` d'assistant-ui).
- Refus Codex rapportés avec l'étape et le message du moteur ; le diagnostic Claude
  nomme l'étape en échec et le bandeau propose « Réessayer » (`feature/diagnostic-retry`).
- Git en vue pleine largeur, panneau droit réservé à l'aperçu (D015,
  `feature/git-workspace`).
- Règle d'or ajoutée : jamais en dessous des clients officiels (D013).

L'application ouvre des dossiers, y compris vides et sans Git, puis crée des
conversations Claude/Codex. assistant-ui affiche Markdown, outils, questions et
permissions. Brouillons et projection des échanges sont conservés dans
`%APPDATA%\lullaby\state.json` ; les moteurs gardent contexte natif, instructions,
skills et identifiants de reprise. Une seule exécution par dossier dans Lullaby ;
une CLI externe n'est pas verrouillée.

**Coquille Iris** (`feature/iris-shell`) : barre de titre intégrée, conversations
par projet, panneau droit Git/Aperçu. Recette : [iris-shell](validation/iris-shell.md).

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

Le chat est plus large (maximum 1120 px) avec des contrôles de compositeur compacts,
des chevrons SVG centrés et une gouttière de pictogrammes pour code et outils.
Les extraits de commandes restent distincts des exécutions réelles. Les blocs
`diff`/`patch` colorent les ajouts/suppressions ; deux blocs avant/après restent
séparés, sans comparateur côte à côte automatique.

Les nouvelles interventions disposent d’un récapitulatif des fichiers modifiés et
compteurs textuels, avec Examiner vers un panneau de différences. La comparaison
porte sur les fichiers avant/après l’intervention, même après un commit, et reste
conservée avec la conversation. Git requis ; limites et exclusions explicites.
Aucun bouton Annuler, aucun appel LLM supplémentaire. Voir la [recette dédiée](validation/turn-review.md).

## Vérifications

- Poste pro (`feature/pro-workstation`) : essai réel Claude (skill, écriture,
  reprise) réussi via Px ; trois tours dans un moteur conservé : 28,8 s puis 3,5 s et 2,6 s.
  Tests ciblés et TypeScript réussis. Les tests Git dépassent leurs délais sur ce poste
  (Git lent) et un test compare un chemin court `~1` à sa forme longue : échecs
  préexistants, non traités. Codex réel : trois tours dans un
  App Server conservé, 14,4 s puis 2,9 s et 2,9 s, contexte conservé.
- Tranche chat compact : 11 tests du chat réussis, TypeScript/build réussis ; aucun nouvel appel fournisseur.
- Dernière suite complète : **126 tests réussis, 5 essais fournisseurs opt-in ignorés**.
  TypeScript, build et `npm run package:win` réussis ; paquet Windows non signé.
- Récapitulatif : fixtures Git, faux moteur, persistance et ouverture du panneau
  assistant-ui vérifiés ; aucun appel aux abonnements pour cette tranche.
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

Poste professionnel : Claude et Codex fonctionnent par abonnement via Px, lancé par
Lullaby ou en externe. Le matin, le proxy d'entreprise répondait 403 sur chatgpt.com
pour Codex ; après mise à jour de Codex l'après-midi, l'accès fonctionne. Lullaby
affiche désormais la raison donnée par le moteur en cas de refus. Le compte rendu
détaillé reste hors dépôt. Le paquet Windows n'a pas encore été essayé sur ce poste. La parité globale avec les clients officiels n'est pas démontrée.
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
de `feature/turn-review` (qui contient les évolutions précédentes) vers `develop`. Les maquettes ne sont pas une preuve
d'implémentation des fonctions futures.

## Reprise par un autre agent

Lire AGENTS.md et CONTRIBUTING.md, puis vérifier le statut Git réel. Préserver les
worktrees et dépendances ; utiliser des fixtures temporaires et ne pas manipuler
les connexions ou conversations privées. Les commandes sont dans
[Développement](developpement.md), les résultats de cette tranche dans la recette
Studio. Remplacer les informations obsolètes de cette passation sans empiler un journal.
