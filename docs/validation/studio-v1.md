# Recette Studio V1

Tranche autonome du 26–27 septembre 2026, `feature/studio-v1`.

## Utilisation

- Ouvrir un dossier accepte aussi un dossier vide et sans Git. Le dialogue Windows
  permet de créer un dossier. Les boutons Claude/Codex créent ensuite la conversation.
- Le bas de la conversation contient modèle, effort, permissions, ajout de références
  et envoi/arrêt. Les modèles proviennent du moteur ; un modèle ancien indisponible
  n'est jamais remplacé silencieusement.
- Le « + » ajoute les chemins des fichiers/dossiers au brouillon pour lecture par les
  outils natifs. Ce n'est pas une entrée image multimodale ni une copie des fichiers.
- Un bloc de code HTML a un bouton Aperçu ; les liens HTML locaux et le sélecteur du
  « + » ouvrent aussi le panneau. CSS/JS intégrés fonctionnent ; fichiers CSS/JS voisins,
  ressources réseau, serveurs Vite/React et navigation web ne sont pas intégrés dans
  cette première version. Les liens HTTP ordinaires s'ouvrent dans le navigateur.
- L'ouverture externe d'un aperçu est une **copie statique sans scripts**. L'URL locale
  expire à la fermeture de l'aperçu ou de Lullaby ; elle n'est pas une publication.
- Paramètres regroupe moteur Codex, diagnostic, réseau/Px existant et apparence
  (animations/taille du texte). Le chemin peut rester vide pour la détection native.
- Le menu « … » du projet renomme son entrée ou la retire avec ses conversations
  locales après confirmation. Le dossier et les sessions natives restent conservés.
  Un projet actif ne peut pas être retiré.
- Git / Modifications affiche les changements non committés du dossier choisi.
  Un dépôt propre propose un accès à Historique ; un autre worktree reste indépendant.

## Permissions

| Choix | Claude | Codex |
| --- | --- | --- |
| Natif | Réglages natifs, argument implicite SDK omis | Configuration native résolue et réappliquée à la reprise |
| Avec demandes | `default` explicite | `on-request` + `workspace-write` |
| Auto | `acceptEdits`, autres outils selon règles natives | `never` + `workspace-write`, actions interdites refusées |
| Lecture seule | `plan` | `on-request` + `read-only` |

Aucun mode `bypassPermissions` ou `danger-full-access` ajouté par ces profils.
Natif peut refléter les choix existants de l'utilisateur ; il ne signifie pas un
réglage restrictif universel. Un profil avancé Codex non représentable est refusé
explicitement, sans remplacement silencieux. Une exécution possède son processus
App Server : réutiliser un fil déjà chargé dans le même processus ferait ignorer
certains changements de permissions.

## Sources et provenance

- App Server : [documentation officielle](https://learn.chatgpt.com/docs/app-server),
  schéma généré par le binaire installé pour les valeurs exactes du protocole.
- Logo Claude SVG : fichier `.github/logo.svg` du paquet officiel
  `@anthropic-ai/sdk` 0.128.0, [dépôt Anthropic](https://github.com/anthropics/anthropic-sdk-typescript).
- Symbole OpenAI SVG : en-tête de [ChatGPT Learn](https://learn.chatgpt.com/docs/appshots),
  extrait sans redessiner le tracé. Il identifie ici Codex connecté à ChatGPT.
- « Joindre Lullaby » dans l'application ChatGPT est une
  [Appshot](https://learn.chatgpt.com/docs/appshots), capture et texte disponible d'une
  fenêtre ; cela ne connecte pas les comptes des applications.

## Vérifications et décisions de relecture

- Absence Codex reproduite : ancien moteur recherché seulement dans le PATH enrichi
  de la session de développement. Résolution désormais indépendante via PATH/cache
  officiel ou chemin explicitement choisi, sans hash fixe ni lecture de credentials.
- Diagnostic réel d'abonnement ChatGPT réussi ; échange Codex dans le projet temporaire
  avec GPT-6-Luna, marqueur CODEX_IRIS_OK, liste Markdown et bloc HTML reçu.
- Aperçu natif du bloc reçu observé ; bouton compteur passé de 0 à 1.
- Fichier HTML choisi dans le dialogue Windows : `window.lullaby` absent dans
  l'iframe. Après clic sur un bouton naviguant vers un second serveur localhost,
  document inchangé et zéro requête reçue par ce serveur.
- Paramètres observés avec les deux abonnements confirmés ; compositeur accessible
  dans une fenêtre de 797 × 574 px. Retour à la taille initiale après recette.
- Suite finale : 103 tests réussis, 5 essais fournisseurs opt-in ignorés ;
  TypeScript, build et paquet Windows réussis. Aucun ajout de dépendance.
- Reprise Codex testée sans appel modèle sur un fil synthétique : `never` persistait
  sans override. Configuration réappliquée ; valeurs implicites résolues par fil
  éphémère. Claude rétablit son mode de réglages lorsque l'argument est omis.
- Relecture indépendante : navigation d'un aperçu identifiée comme contournement
  du seul CSP. Ajout d'une liste exacte des URL d'aperçu dans le main et d'une copie
  externe sans scripts/rafraîchissement automatique. IPC toujours réservé au main frame.
- Un test de course ancien attendait 10 ms avant d'appeler un callback non initialisé
  sous charge ; remplacement de cette attente par le signal réel d'entrée du moteur.
- Limites : pas de serveur de développement intégré, fichiers joints par références,
  pas de synchronisation, historique externe non importé, poste professionnel non testé.
- Deux remarques mineures différées : focus clavier non confiné dans les paramètres ;
  erreur d'une ancienne demande d'aperçu susceptible de remplacer la notice courante.
  Le choix du document et sa libération restent protégés contre les réponses périmées.
