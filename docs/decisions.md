# Décisions structurantes

Statuts : **retenu**, **proposé**, **remplacé**. Le statut « retenu » désigne un choix,
pas une fonctionnalité déjà implémentée. Ajouter une entrée lors d'un changement
structurant ; utiliser le cadrage pour la description détaillée du produit.

## D001 — Windows natif et dépendances limitées

Date : 26 septembre 2026. Statut : **retenu**.

Lullaby cible Electron sur Windows, sans Docker ni WSL. Le poste professionnel
bloque les logiciels par défaut. Limiter les installations, intégrer les bibliothèques
au paquet et recenser les exécutables enfants. Conséquence : valider tôt un paquet
sur le poste personnel puis sur le poste professionnel.

## D002 — Abonnements et moteurs officiels

Date : 26 septembre 2026. Statut : **retenu** pour la contrainte d'abonnement ;
intégration effective **à vérifier**.

Utiliser Claude Agent SDK et Codex App Server avec les abonnements de l'utilisateur.
Pas de bascule payante automatique. Les sessions et fonctionnalités exactes doivent
être vérifiées avec les versions utilisées et les politiques du poste cible.

## D003 — Composants assistant-ui

Date : 26 septembre 2026. Statut : **retenu** comme base du chat, sous réserve de
validation technique de l'intégration.

Réutiliser les composants du chat et conserver les adaptateurs et l'historique côté
Lullaby. Ne pas dépendre d'Assistant Cloud. L'objectif de qualité comparable aux
clients officiels reste à décomposer ; une parité complète n'est pas démontrée.

## D004 — Gitflow et documentation partagée

Date : 26 septembre 2026. Statut : **retenu**, demandé par l'utilisateur.

Appliquer Gitflow selon `CONTRIBUTING.md`. `AGENTS.md` porte les règles communes,
et `CLAUDE.md` les importe. Mettre à jour la documentation dans chaque PR et tenir
un état de passation. Les agents simultanés utilisent des branches et répertoires
distincts. Cette décision n'autorise pas à lancer ou contacter d'autres agents.

## D005 — Qualité visuelle et référence Ankama/Dofus 3

Date : 26 septembre 2026. Statut : **retenu** pour la référence, le niveau de soin,
la direction Iris et le logo facetté, explicitement validés par l'utilisateur.

L'utilisateur apprécie les interfaces Ankama/Dofus 3 et souhaite une direction
artistique forte, une excellente UX et des animations légères. Il confirme une app
colorée avec une palette maîtrisée et des icônes d'identité un peu « sharp » ; les
ambiances entièrement noires ou blanches et l'effet arc-en-ciel sont écartés. Les principes sont
décrits dans `direction-artistique.md`. La V0 doit reprendre Iris et le logo de la
maquette : surfaces lavande, navigation indigo, accents menthe et ambre.
Lagon reste une exploration non retenue. Cette validation visuelle ne modifie pas
le périmètre fonctionnel de la V0 et ne vaut pas vérification des intégrations.

Les emblèmes et icônes Lullaby seront en SVG, préférence explicitement confirmée.
Une bibliothèque locale réutilisable est envisagée ; elle n'est pas encore créée.

## D006 — Préserver les capacités des agents natifs

Date : 26 septembre 2026. Statut : **retenu** pour l'exigence utilisateur ;
configuration et parité effective **à vérifier**.

Lullaby vise l'usage principal sans perte de capacités de développement par rapport
aux moteurs officiels. Préserver leurs instructions, outils, skills et sessions.
La [fidélité aux moteurs](fidelite-moteurs.md) décrit les mécanismes proposés et la
recette. Les catégories visuelles ne restreignent pas implicitement les agents.
Vérifier la disponibilité des skills et respecter leur chargement à la demande.

## D007 — Développement V1, double vue Git et alertes internes

Date : 26 septembre 2026. Statut : **retenu** pour les priorités exprimées ;
découpage technique **proposé** dans la feuille de route.

La V1 vise le développement. L'utilisateur confirme son intérêt pour le graphe
des commits/branches/merges ET l'arborescence des fichiers modifiés. Première
tranche de consultation avec diffs proposée après une session fiable. Les opérations
Git d'écriture ne sont pas encore cadrées. Les notifications Windows sont exclues
des premiers jalons ; alertes internes et sons envisagés ensuite. L'espace
documentaire spécialisé reste une piste V2.

## D008 — Paquet Windows du prototype

Date : 26 septembre 2026. Statut : **implémenté**, recette complète encore ouverte.

Distribuer un dossier contenant Electron et le moteur Claude du SDK ; utiliser
Codex officiel installé sur le poste. ASAR reste désactivé pour cette première
recette afin de conserver les chemins natifs des ressources Claude. Le dossier
est volumineux et non signé ; ce choix doit être réévalué avant une distribution
plus large. Voir la [recette du paquet](validation/v0-windows.md).

## D009 — Git V1 en consultation locale

Date : 26 septembre 2026. Statut : **implémenté** sur `feature/git-inspector`.

Git installé fournit les données ; SVG et React assurent le graphe et les arbres,
sans dépendance supplémentaire. Le renderer sélectionne des identifiants validés
par le main, jamais des commandes arbitraires. Les helpers de diff et filtres clean
sont désactivés dans les processus de lecture, sans modifier les configurations
du dépôt. Conséquence : les projets utilisant des filtres voient les octets locaux.
La lecture ne lance aucun fetch ni commande de mutation. Limites, annulations,
essais et arbitrages détaillés dans la [recette Git](validation/git-v1.md).
