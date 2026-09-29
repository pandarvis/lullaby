# Historique des versions

## 0.1.0 — 29 septembre 2026

Première version utilisable de Lullaby : un atelier Windows natif pour superviser
des conversations Claude Code et Codex par projet, avec les abonnements existants.

### Conversations et moteurs

- Projets ouverts depuis un dossier, conversations Claude Code (abonnement Claude)
  ou Codex (abonnement ChatGPT), reprise d'une session créée dans la CLI.
- Chat assistant-ui : Markdown, code coloré, actions des outils, questions et
  autorisations, interruption, brouillons conservés.
- Moteurs officiels conservés entre les messages : environ 3 s par réponse une fois
  la conversation ouverte, au lieu d'un démarrage complet à chaque message.
- Modèle, effort et autorisations au choix ; les choix natifs affichent la valeur
  réellement configurée.
- Récapitulatif des fichiers modifiés après chaque intervention, avec leur différence.
- Aucune bascule vers une API facturée ; un diagnostic nomme la cause d'un abonnement
  non confirmé et propose « Réessayer ».

### Interface

- Coquille Iris : barre de titre, conversations groupées par projet, Atelier de
  supervision, raccourcis clavier, barre latérale réduite en icônes.
- Git en vue pleine largeur : historique en graphe, fichiers et différences colorées.
- Aperçu HTML isolé dans un panneau latéral.

### Réseau

- Proxy et certificat réglables par moteur ; lancement d'un relais local (Px) avec
  journal et état en direct.

### Installation et limites

- Paquet Windows `dist/win-unpacked` (construit par `npm run package:win`), non signé :
  conserver tout le dossier avec `Lullaby.exe`. Claude Code et Codex restent requis
  sur le poste ; Git pour les vues Git et le récapitulatif.
- Premier message d'une conversation lent quand le profil Claude charge des hooks.
- Sur un réseau d'entreprise, l'accès de Codex à chatgpt.com peut être bloqué ; Lullaby
  l'indique sans le contourner.
- Détails, vérifications et réserves : [état du projet](docs/etat-projet.md).
