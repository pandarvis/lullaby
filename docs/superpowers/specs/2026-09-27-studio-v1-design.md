# Studio V1 — conversations et outils

L'utilisateur autorise le 26 septembre plans et réalisation en autonomie pendant
la nuit. Cette tranche architecturale continue les changements Iris non intégrés,
sur `feature/studio-v1`, sans fusion ni publication de branche partagée.

## Résultat attendu

- Codex via abonnement ChatGPT : moteur officiel détecté ou chemin configurable,
  diagnostic exploitable et conversation réelle vérifiée quand la connexion existe.
- Chat assistant-ui Iris compact : modèles, effort et permissions près de l'envoi,
  flèche et arrêt, ajout de fichiers/dossiers, Markdown lisible et listes soignées.
- Aperçu HTML à côté du chat : blocs HTML et fichiers du projet, ouverture externe
  explicite. Le HTML n'a jamais accès au preload, aux données ou aux privilèges Node.
- Paramètres dédiés : moteurs, réseau existant, apparence et informations locales.
  Icônes SVG fournisseurs avec provenance, animations discrètes, accueil facetté.
- Renommer l'entrée d'un projet et la retirer de Lullaby ; jamais effacer ses fichiers.
  Refuser le retrait pendant une exécution, annoncer le retrait des conversations locales.
- Git : diagnostiquer l'écran vide et rendre les états propres/erreurs explicites.

## Choix

Conserver Electron/assistant-ui et les moteurs natifs est préférable à un second
client chat ou une iframe de service propriétaire : abonnements, reprise et skills
restent natifs. Pas de Docker, WSL, service distant ni dépendance supplémentaire.

Les pièces jointes sont des références locales choisies explicitement ; les fichiers
et dossiers sont transmis comme contexte de chemins, avec une indication visible.
Pas de faux téléversement ni conversion silencieuse de documents. Les images peuvent
être lues par les outils natifs du moteur ; cela reste distinct d'une entrée vision.

Permissions : conserver le réglage natif par défaut, exposer uniquement des modes
effectivement pris en charge, avec leur portée. Ne jamais approuver automatiquement
des demandes en se substituant au moteur. Réglage figé durant une exécution.

Aperçus HTML : chargement sur action utilisateur, limites de taille, lecture de
fichiers contenue dans le projet après résolution des liens. Documents autonomes
isolés ; ressources réseau et privilèges hôte absents. Une URL localhost proposée
peut être ouverte extérieurement ; pas de serveur arbitraire démarré implicitement.

## Vérification

Tests ciblés pour résolution du moteur, permissions, retrait actif, références de
fichiers et confinement des aperçus. Suite complète, types, build et paquet Windows.
Recette native : connexion Codex, listes Markdown, composer, aperçu, paramètres et
petite fenêtre. Aucune donnée privée ni token dans le dépôt ou les sorties de test.
