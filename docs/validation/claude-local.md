# Claude — recette locale du 26 septembre 2026

Windows personnel, Node 22.16, SDK officiel `0.3.283` avec son exécutable Windows
fourni par `@anthropic-ai/claude-agent-sdk-win32-x64`. Git for Windows est présent,
avec Bash natif sous `C:\Program Files\Git\bin\bash.exe` ; aucun WSL utilisé.
Ce relevé ne valide pas un poste sans Git Bash ni les politiques du poste pro.

Le diagnostic du moteur confirme `firstParty` et `Claude Max` avant tout prompt.
Les sélections API ambiguës sont refusées sans afficher leur valeur. Les sources
`user`, `project`, `local` et le preset `claude_code` sont conservés.

Résultats réels, dans des dossiers temporaires dédiés :

- Lecture de `marker.txt`, utilisation du skill local témoin et écriture du fichier
  attendu : réussies. La règle CLAUDE.md demandant une réponse courte a été suivie.
- Fermeture puis reprise SDK par identifiant natif exact : marqueur conservé.
- Session créée par la CLI native, CLI terminée, puis reprise par le SDK : réussie.
- Demande d'écriture hors du dossier refusée : fichier non créé.
- Interruption native, fermeture du moteur et des attentes : réussies.
- Les commandes et skills utilisateur, dont Superpowers, sont annoncés par le
  moteur. Leur découverte seule ne prouve pas que chaque intégration fonctionne.

Les tests réels sont opt-in : `LULLABY_LIVE_TEST=claude`, `claude-cli` ou
`claude-control`, puis `npm test -- tests/claude-live.test.ts`. Ils utilisent les
quotas de l'abonnement ; la suite normale ne lance aucun appel modèle.
Les tests synthétiques couvrent le flux, les permissions, erreurs et configuration.

Restent à vérifier : parcours graphique du chat, paquet distribué, contexte long,
extensions particulières et poste professionnel. Pas de promesse de parité complète.

Source abonnement consultée : [Claude Agent SDK avec un abonnement Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan).
La mise à jour du 15 juin y indique que le changement annoncé est suspendu ; les
essais ci-dessus sont le constat local du mode d'authentification effectif.
