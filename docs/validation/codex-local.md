# Codex — recette locale du 26 septembre 2026

Windows personnel, exécutable officiel détecté dans le PATH, version
`0.158.0-alpha.2.1`. Aucun chemin de dossier versionné de l'application n'est codé
en dur. `LULLABY_CODEX_PATH` permet de choisir explicitement un exécutable natif.

Le schéma a été généré par ce binaire. Méthodes utilisées : `initialize`,
`initialized`, `account/read`, `config/read`, `skills/list`, `model/list`,
`thread/read`, `thread/start`, `thread/resume`, `turn/start`, `turn/interrupt`.
Les demandes de commande/fichier et les questions structurées sont relayées ;
une demande serveur inconnue est refusée et signalée dans les actions.

Le diagnostic confirme ChatGPT et le fournisseur OpenAI natif avant le premier
tour. L'ancien modèle configuré `gpt-5.1-codex` a été refusé par le service. Le test
a donc sélectionné explicitement le modèle par défaut du catalogue exposé par le
moteur ; aucun réglage global modifié, aucune bascule automatique à l'exécution.

Essai réel réussi : règle AGENTS.md, skill local témoin, lecture/écriture d'un
fichier, fermeture et reprise du fil par identifiant exact. Le test est opt-in :
`LULLABY_LIVE_TEST=codex`, puis `npm test -- tests/codex-live.test.ts` ; il consomme
le quota de l'abonnement. `codex-diagnostic` ne lance pas de tour modèle.

Transport testé hors réseau : UTF-8 fragmenté, JSON incorrect, ligne incomplète ou
supérieure à 16 Mio, lancement impossible, fermeture, réponses tardives, appels
concurrents et demandes serveur. Refus et interruption sont testés avec le serveur
factice ; une demande d'autorisation réelle Codex reste à vérifier avec un profil
adapté. Les politiques natives de cette machine ne sont pas modifiées pour le test.

Les outils réservés à l'application hôte ne sont pas fournis automatiquement par
App Server : panneaux, gestion de ses chats, connecteurs et génération de médias
de l'app ne sont pas prétendus présents. Contexte long, paquet et poste pro restent
à vérifier.

Référence : [protocole officiel Codex App Server](https://learn.chatgpt.com/docs/app-server).
