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
