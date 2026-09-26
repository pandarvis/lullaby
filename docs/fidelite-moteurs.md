# Fidélité aux moteurs Claude et Codex

Date : 26 septembre 2026. Exigence utilisateur retenue ; mécanismes ci-dessous
à valider avec les versions retenues. Aucune intégration réelle testée.

## Contrat produit

Lullaby doit pouvoir devenir l'outil de développement principal de l'utilisateur.
Préserver les capacités des moteurs officiels est un critère de recette, au même
titre que le chat et la reprise. assistant-ui assure l'affichage ; les moteurs
gardent la boucle d'exécution, les outils et la gestion du contexte.

Les étiquettes « développement », « architecture » ou « relecture » classent les
sessions. Elles ne changent implicitement ni prompt, ni outils, ni modèle, ni effort
de raisonnement. Un mode natif ou une consigne particulière reste un choix explicite.
Ne pas ajouter une personnalité Lullaby ni remplacer les instructions natives.
Ne pas réduire silencieusement les budgets, le nombre de tours ou le jeu d'outils.
Conserver les autorisations et restrictions configurées : fidélité ne signifie pas
accès illimité. Toute adaptation nécessaire à l'interface sera minimale et documentée.

## Configuration des adaptateurs

### Claude

La documentation actuelle indique un prompt SDK minimal par défaut. Utiliser
explicitement `systemPrompt: { type: "preset", preset: "claude_code" }`.
Les sources de réglages contrôlent séparément le chargement de `CLAUDE.md` ;
le preset seul ne suffit pas à établir la configuration effective.
Source : [prompts du SDK](https://code.claude.com/docs/en/agent-sdk/modifying-system-prompts).

Préserver les réglages utilisateur/projet/locaux attendus et vérifier `settingSources`
sur la version épinglée. Les docs actuelles décrivent la découverte des skills et
leur chargement à la demande ; vérifier que l'outil Skill reste disponible.
Contrôler aussi règles, mémoire, hooks, plugins et MCP utiles à l'utilisateur,
sans présumer que toutes les extensions de la CLI fonctionnent automatiquement.
Source : [fonctionnalités Claude Code dans le SDK](https://code.claude.com/docs/en/agent-sdk/claude-code-features).

### Codex

Utiliser App Server et sa configuration native. La documentation expose
`skills/list`, `thread/start` et `thread/resume`, ainsi que `instructionSources`
dans les réponses de démarrage/reprise. Exploiter ces informations lorsqu'elles
sont disponibles dans la version installée, avec diagnostic des capacités manquantes.
Source : [Codex App Server](https://learn.chatgpt.com/docs/app-server).

Lullaby doit vérifier les instructions du dépôt, les skills et les outils réellement
accessibles. Les outils fournis par l'application Codex hôte ne sont pas présumés
disponibles dans un client externe. L'accès au moteur Codex ne livre pas à lui seul
toutes les fonctions de ChatGPT Desktop, ses connecteurs, sa voix ou ses images.

## Skills : disponibilité obligatoire, utilisation adaptée à la tâche

Le chargement progressif présente les descriptions puis les instructions complètes
au besoin. C'est aussi le fonctionnement documenté côté
[Codex](https://learn.chatgpt.com/docs/build-skills).
Conserver ce mécanisme ; concaténer tous les skills à chaque message n'est pas
le contrat recherché. Ne pas maintenir un second chargeur lorsque le moteur suffit.

Proposition : un diagnostic par session distingue découvert, activé, indisponible
et invoqué lorsque l'événement est observable. Une découverte réussie ne prouve pas
l'application des instructions. Si un skill est déclaré obligatoire pour un projet
ou explicitement demandé et manque, expliquer le problème avant la tâche dépendante.
Préserver les règles d'invocation des skills ; leur présence n'autorise pas à lancer
tous leurs workflows ni à ajouter des restrictions de rôle.

Une bibliothèque commune peut partager du contenu portable, mais les formats,
outils et dépendances restent propres à chaque moteur. Vérifier la compatibilité
d'un skill avant de le présenter comme utilisable par les deux fournisseurs.

## Démarrage et reprise

Enregistrer le moteur, l'identifiant natif, le dossier et les choix de configuration.
Reprendre via l'identifiant exact : `resume` pour Claude, `thread/resume` pour Codex.
Éviter la sélection implicite de la dernière conversation d'un dossier.
Source Claude : [sessions SDK](https://code.claude.com/docs/en/agent-sdk/sessions).

L'historique graphique reste une projection ; il ne remplace pas la session native
par un résumé Lullaby. Laisser le moteur gérer sa compaction. À la reprise, vérifier
les réglages effectifs et signaler les changements de modèle, outils ou instructions.
Ne pas supposer que l'identifiant restaure chaque option de lancement. Réappliquer
uniquement les options nécessaires selon le contrat de la version utilisée, sans
écraser les politiques administrées ou les nouveaux choix explicites de l'utilisateur.

## Recette avant usage principal

Comparer CLI/client officiel et Lullaby sur un dépôt d'essai identique, avec mêmes
modèle, effort, instructions, skills et permissions. Relever versions et écarts.

- Départ à neuf : règle de projet et skill témoin effectivement utilisés.
- Lecture, modification, commande, approbation/refus et interruption fonctionnels.
- Reprise après fermeture et reprise Claude depuis la CLI : continuité de tâche,
  bon dossier, mêmes capacités attendues, aucun mélange de sessions.
- Conversations longues : continuité après compaction native à vérifier ensuite.
- Extension nécessaire ou skill obligatoire absent : diagnostic visible.

Évaluer les capacités et la réussite des tâches, pas l'identité mot à mot des réponses.
Une dégradation observée doit être corrigée ou identifiée comme limite avant de
recommander Lullaby comme remplacement principal. La parité complète reste à démontrer.
