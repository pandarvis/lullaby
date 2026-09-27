# Recette Iris — lisibilité et activité

27 septembre 2026, branche `feature/iris-feedback`, depuis Studio `56aea89`.

## Changements

- Icônes utilitaires SVG sculptées : facettes claires/sombres, lavande/menthe/ambre,
  relief discret. Logos officiels des fournisseurs conservés sans altération.
- Onglets Conversations/Git intégrés à l'en-tête du projet, suppression de leur
  bandeau séparé. Police système Segoe UI Variable Text avec repli Segoe UI ;
  code Cascadia Code avec repli Consolas, aucune police distante.
- Menus du compositeur rendus avec Radix Select : clavier, focus, défilement,
  explications des permissions. Aucun changement des politiques natives.
- Coloration dans le slot SyntaxHighlighter d'assistant-ui : C#, JS/TS, HTML/XML,
  CSS, JSON, Bash, PowerShell, Python, SQL, YAML et diff. Texte brut pour langage
  inconnu ou bloc supérieur à 30 000 caractères ; texte copié inchangé.
- Indicateur d'activité immédiat : envoi, préparation, réponse, action en cours,
  attente de réponse. La mention Réflexion correspond à un signal natif explicite,
  sans recopier de contenu de raisonnement privé. Aucun pourcentage inventé.
- Actions dépliables avec icône, commande/chemin quand disponible et statut.
  Claude conserve les paramètres de l'outil avec son résultat.

Le compteur d'activité mesure le temps observé dans la vue ouverte ; il ne remplace
pas le futur suivi de temps des projets/sessions et repart lorsqu'on rouvre la vue.

## Dépendances et sources

`highlight.js` 11.12.0 est la seule nouvelle bibliothèque installée ; elle est
embarquée et fonctionne hors réseau, sans processus ni installation supplémentaire
sur le poste cible. Seules les douze grammaires importées sont incluses dans le
renderer. Radix Select 2.3.7 était déjà transitif via assistant-ui ; il est déclaré
comme dépendance directe pour un import stable. Le lockfile ajoute un seul paquet.

Référence : [slot de coloration assistant-ui](https://www.assistant-ui.com/elements/syntax-highlighter).
Le composant garde assistant-ui pour Markdown, copie et aperçu HTML.

## Vérification

- 110 tests réussis, 5 essais fournisseurs opt-in ignorés ; typecheck/build et
  paquet Windows réussis.
- Régressions : retour dès l'envoi avant tout événement moteur, action et attente,
  disparition à la fin, événements natifs Claude/Codex sans texte privé, contexte
  d'une commande après résultat, sélection de modèle/effort et permissions.
- Coloration C# avec chaîne contenant une balise script : aucune exécution,
  texte inchangé. Les langages `constructor` et `__proto__` restent du texte brut.
  Ce cas de crash a été identifié en relecture et corrigé avant livraison.
- Recette Electron : extrait C# existant coloré, menu des permissions lisible,
  navigation clavier et fermeture Échap observés.
- Échange Codex réel de recette sans modification de fichier : retour immédiat
  « prépare la réponse », commande PowerShell affichée puis terminée et réponse OK.
  Les états de réflexion des deux moteurs sont vérifiés par événements de test.
- Version finale observée à 797 × 574 px : onglets dans l'en-tête, permissions,
  modèle/effort et saisie restent accessibles. Commandes longues tronquées dans
  leur résumé, détails complets dépliables sans élargir la conversation.

Les résumés de réflexion ne sont pas un journal de pensée détaillé. Les capacités
observables dépendent des événements transmis par chaque moteur ; les outils non
reconnus gardent leur nom natif et leurs détails consultables.
