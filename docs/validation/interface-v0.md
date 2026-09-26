# Interface V0 — état de la recette

Le 26 septembre 2026 : assistant-ui React `0.15.22` et son module Markdown
`0.14.17`. Aucune boucle d'agent ni service cloud de chat ajouté. Le module Markdown
réutilise l'affichage riche et les blocs de code ; Testing Library/jsdom sont des
dépendances de test seulement. jsdom 26 est compatible avec le Node local 22.16.

Vérifié en fenêtre Electron sur Windows :

- Iris, logo SVG conservé et navigation repliable ; préférence conservée au redémarrage.
- Sélecteur de dossier natif : ouverture, annulation et sélection finale.
- Ouverture d'un dossier temporaire dont le nom contient espaces et `été`.
- Création d'une conversation Claude, saisie et envoi par assistant-ui ; réponse
  réelle `IRIS_UI_OK` affichée, état terminé, aucun outil demandé.

Tests UI automatiques : brouillon A, passage B, événement reçu pour A et retour A ;
bonne projection et brouillon conservés. Routage de refus vers la bonne session,
attente d'accusé du main, erreur de demande périmée rendue visible.

Implémenté : Markdown/code/copie, actions détaillées, questions et approbations,
arrêt, diagnostics, modèle/effort annoncés par le moteur, reprise par UUID explicite.
Pas de commande d'édition/régénération/pièces jointes non raccordée.
Les fournisseurs sont désignés par leur nom : les logos officiels restent à obtenir
avec leur provenance, aucun logo inventé n'est présenté comme officiel.

Restent à vérifier dans le paquet : parcours Codex complet, autorisations graphiques,
zoom et fenêtre étroite, reprise après fermeture. Le contexte d'une session importée
est repris par le moteur ; l'historique antérieur n'est pas importé dans le chat V0.
